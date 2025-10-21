import prisma from '../utils/database.js';
import { handleError, validateRequired } from '../utils/helpers.js';
import xlsx from 'xlsx';

export const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          specs: {
            include: {
              specField: true
            }
          },
          reviews: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);
    // Normalize inStock from stock if schema uses stock
    const normalized = products.map(p => ({ ...p, categoryId: p.categoryId, inStock: typeof p.stock === 'number' ? p.stock > 0 : false }));

    res.json({
      products: normalized,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Normalize inStock for UI compatibility
    const normalized = { ...product, categoryId: product.categoryId, inStock: typeof product.stock === 'number' ? product.stock > 0 : !!product.inStock };
    res.json(normalized);
  } catch (error) {
    handleError(res, error);
  }
};

export const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      image, 
      categoryId, 
      inStock, 
      stock, 
      specs = [] 
    } = req.body;
    
    const validation = validateRequired(req.body, ['name', 'price', 'categoryId']);
    if (validation) return res.status(400).json(validation);
    
    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }
    
    const resolvedStock = stock !== undefined && stock !== null && !Number.isNaN(Number(stock))
      ? parseInt(stock)
      : (inStock !== undefined ? (inStock ? 1 : 0) : 1);

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        category: { connect: { id: categoryId } },
        stock: resolvedStock,
        specs: {
          create: specs.map(spec => ({
            specFieldId: spec.specFieldId,
            value: spec.value
          }))
        }
      },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        }
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      image, 
      categoryId, 
      inStock, 
      stock, 
      specs = [] 
    } = req.body;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if category exists (if provided)
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }
    
    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        
        ...(image && { image }),
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        ...(
          (stock !== undefined && stock !== null && !Number.isNaN(Number(stock)))
            ? { stock: parseInt(stock) }
            : (inStock !== undefined ? { stock: inStock ? 1 : 0 } : {})
        ),
        ...(specs.length > 0 ? {
          specs: {
            deleteMany: {},
            create: specs.map(spec => ({ specFieldId: spec.specFieldId, value: spec.value }))
          }
        } : {})
      },
      include: {
        category: true,
        specs: {
          include: {
            specField: true
          }
        }
      }
    });

    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete product (cascade will handle related records)
    await prisma.product.delete({ where: { id } });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// Generate Excel template per category with spec columns
export const downloadProductTemplate = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { specFields: true }
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const baseColumns = ['name', 'description', 'price', 'stock', 'image'];
    const specColumns = category.specFields.map(f => `spec:${f.name}`);
    const headers = [...baseColumns, ...specColumns];
    // No mock/sample data; create sheet with headers only
    const ws = xlsx.utils.json_to_sheet([{}], { header: headers });
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, category.name.slice(0, 31));

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="template-${category.name}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    handleError(res, error);
  }
};

// Import products from Excel for a category
export const importProductsFromExcel = async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) return res.status(400).json({ error: 'Missing categoryId' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const category = await prisma.category.findUnique({ where: { id: categoryId }, include: { specFields: true } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid Excel file' });
    }
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: 'Empty workbook' });
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return res.status(400).json({ error: 'Missing worksheet' });
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'No data rows found' });

    const results = [];
    for (const row of rows) {
      const name = String(row.name || '').trim();
      const description = String(row.description || '');
      const price = Number(row.price || 0);
      const stock = Number(row.stock || 0);
      const image = String(row.image || '');

      if (!name || !Number.isFinite(price)) {
        results.push({ name, ok: false, error: 'Missing required name or price' });
        continue;
      }

      const specValues = [];
      let missingRequired = null;
      for (const field of category.specFields) {
        const key = `spec:${field.name}`;
        const value = row[key];
        if ((value === undefined || value === '') && field.required) {
          missingRequired = field.name;
          break;
        }
        if (value !== undefined && value !== '') {
          specValues.push({ specFieldId: field.id, value: String(value) });
        }
      }
      if (missingRequired) {
        results.push({ name, ok: false, error: `Missing required spec ${missingRequired}` });
        continue;
      }

      const created = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          image,
          category: { connect: { id: categoryId } },
          specs: { create: specValues.map(sv => ({ specFieldId: sv.specFieldId, value: sv.value })) }
        },
        include: { category: true, specs: { include: { specField: true } } }
      });
      results.push({ name: created.name, ok: true, id: created.id });
    }

    res.json({ imported: results.filter(r => r.ok).length, results });
  } catch (error) {
    handleError(res, error);
  }
};
