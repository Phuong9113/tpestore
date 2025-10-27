import prisma from '../utils/database.js';
import { handleError } from '../utils/helpers.js';

// Get all addresses for current user
export const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json(addresses);
  } catch (error) {
    handleError(res, error);
  }
};

// Get address by ID
export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await prisma.address.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json(address);
  } catch (error) {
    handleError(res, error);
  }
};

// Create new address
export const createAddress = async (req, res) => {
  try {
    const { name, phone, address, province, district, ward, provinceName, districtName, wardName, hamlet, isDefault } = req.body;
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }
    
    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        address,
        province,
        district,
        ward,
        provinceName,
        districtName,
        wardName,
        hamlet,
        isDefault: isDefault || false
      }
    });
    
    res.status(201).json(newAddress);
  } catch (error) {
    handleError(res, error);
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, province, district, ward, provinceName, districtName, wardName, hamlet, isDefault } = req.body;
    
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // If setting as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: req.user.id,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }
    
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(province !== undefined && { province }),
        ...(district !== undefined && { district }),
        ...(ward !== undefined && { ward }),
        ...(provinceName !== undefined && { provinceName }),
        ...(districtName !== undefined && { districtName }),
        ...(wardName !== undefined && { wardName }),
        ...(hamlet !== undefined && { hamlet }),
        ...(isDefault !== undefined && { isDefault })
      }
    });
    
    res.json(updatedAddress);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if address belongs to user
    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    await prisma.address.delete({
      where: { id }
    });
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// Set address as default
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if address belongs to user
    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // Unset all other defaults
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });
    
    // Set this as default
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });
    
    res.json(updatedAddress);
  } catch (error) {
    handleError(res, error);
  }
};

