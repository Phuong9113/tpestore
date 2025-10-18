const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface ApiCategory {
  id: string;
  name: string;
  image?: string;
  specFields?: Array<{
    id?: string;
    name: string;
    type: string;
    required: boolean;
  }>;
}

export interface ApiReview {
  id: string;
  rating: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  category?: ApiCategory;
  reviews?: ApiReview[];
  specs?: ApiSpec[];
}

export interface ApiSpec {
  id: string;
  value: string;
  specField: {
    id: string;
    name: string;
    type: string;
  };
}

export interface UiProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  inStock: boolean;
  description?: string;
  specs?: ApiSpec[];
}

function mapApiProductToUi(product: ApiProduct): UiProduct {
  const ratings = (product.reviews || []).map((r) => r.rating);
  const avgRating = ratings.length
    ? Math.round(
        ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      )
    : 0;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
    category: product.category?.name || "Khác",
    rating: avgRating,
    inStock: product.inStock,
    description: product.description,
    specs: product.specs,
  };
}

export async function fetchProducts(): Promise<UiProduct[]> {
  const res = await fetch(`${API_BASE}/api/products`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const data: ApiProduct[] = await res.json();
  return data.map(mapApiProductToUi);
}

export async function fetchProductById(id: string): Promise<UiProduct | null> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product ${id}: ${res.status}`);
  const data: ApiProduct = await res.json();
  return mapApiProductToUi(data);
}

// Categories API
export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return await res.json();
}

// Admin APIs
export interface AdminProduct extends ApiProduct {
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory extends ApiCategory {
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  specFields?: Array<{
    id?: string;
    name: string;
    type: string;
    required: boolean;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    reviews: number;
  };
}

// Auth helper
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Admin Products
export async function fetchAdminProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}): Promise<{ products: AdminProduct[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);

  const res = await fetch(`${API_BASE}/api/admin/products?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch admin products: ${res.status}`);
  return await res.json();
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  categoryId: string;
  inStock: boolean;
  specs?: Array<{
    specFieldId: string;
    value: string;
  }>;
}

export async function createProduct(productData: CreateProductData): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`Failed to create product: ${res.status}`);
  return await res.json();
}

export async function updateProduct(id: string, productData: Partial<CreateProductData>): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`Failed to update product: ${res.status}`);
  return await res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete product: ${res.status}`);
}

// Admin Categories
export async function fetchAdminCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ categories: AdminCategory[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);

  const res = await fetch(`${API_BASE}/api/categories?${searchParams}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to fetch admin categories: ${res.status}`);
  const categories = await res.json();
  return { categories, pagination: { page: 1, limit: 10, total: categories.length, pages: 1 } };
}

export async function createCategory(categoryData: Partial<AdminCategory>): Promise<AdminCategory> {
  const res = await fetch(`${API_BASE}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) throw new Error(`Failed to create category: ${res.status}`);
  return await res.json();
}

export async function updateCategory(id: string, categoryData: Partial<AdminCategory>): Promise<AdminCategory> {
  const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) throw new Error(`Failed to update category: ${res.status}`);
  return await res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to delete category: ${res.status}`);
}

// Admin Users
export async function fetchAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}): Promise<{ users: AdminUser[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.role) searchParams.set('role', params.role);

  const res = await fetch(`${API_BASE}/api/admin/users?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch admin users: ${res.status}`);
  return await res.json();
}

export async function updateUser(id: string, userData: Partial<AdminUser>): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
  return await res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
}


