const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000") + "/api/v1";

function getApiOrigin(): string {
  try {
    const url = new URL(API_BASE);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return "http://localhost:4000";
  }
}

function normalizeImageUrl(path?: string | null): string {
  const p = (path || "").trim();
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const origin = getApiOrigin();
  if (p.startsWith("/uploads/")) return `${origin}${p}`;
  if (p.startsWith("uploads/")) return `${origin}/${p}`;
  return `${origin}/${p.replace(/^\/+/, "")}`;
}

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
  inStock?: boolean;
  stock?: number;
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
  reviewCount: number;
  inStock: boolean;
  description?: string;
  specs?: ApiSpec[];
}

function mapApiProductToUi(product: ApiProduct): UiProduct {
  const reviews = product.reviews || [];
  const ratings = reviews.map((r) => r.rating);
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? Math.round(
        ratings.reduce((sum, r) => sum + r, 0) / reviewCount
      )
    : 5; // Mặc định 5 sao nếu chưa có đánh giá

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: normalizeImageUrl(product.image),
    category: product.category?.name || "Khác",
    rating: avgRating,
    reviewCount: reviewCount,
    inStock: typeof product.stock === 'number' ? product.stock > 0 : !!product.inStock,
    description: product.description,
    specs: product.specs,
  };
}

export async function fetchProducts(): Promise<UiProduct[]> {
  const res = await fetch(`${API_BASE}/products`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const json = await res.json();
  const list: ApiProduct[] = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
  return list.map(mapApiProductToUi);
}

export async function fetchProductById(id: string): Promise<UiProduct | null> {
  const res = await fetch(`${API_BASE}/products/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product ${id}: ${res.status}`);
  const json = await res.json();
  const product: ApiProduct = json?.data ?? json;
  return mapApiProductToUi(product);
}

// Categories API
export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE}/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  const json = await res.json();
  const list: ApiCategory[] = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
  return list.map((c) => ({ ...c, image: normalizeImageUrl(c.image) }));
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
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  birthDate?: string | null;
  gender?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orders?: Array<{
    id?: string;
    totalPrice: number;
    status?: string;
    createdAt?: string;
    orderItems?: Array<{
      quantity: number;
      product: {
        id: string;
        name: string;
        image: string;
        price: number;
      };
    }>;
  }>;
  _count?: {
    orders: number;
    reviews: number;
  };
}

// Auth helper
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tpestore_token') : null;
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

  const res = await fetch(`${API_BASE}/admin/products?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch admin products: ${res.status}`);
  const data = await res.json();
  const normalized = Array.isArray(data?.products)
    ? data.products.map((p: any) => ({ ...p, image: normalizeImageUrl(p.image) }))
    : [];
  return { products: normalized, pagination: data.pagination };
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  inStock: boolean;
  specs?: Array<{
    specFieldId: string;
    value: string;
  }>;
  stock?: number;
}

export async function createProduct(productData: CreateProductData): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`Failed to create product: ${res.status}`);
  const prod = await res.json();
  return { ...prod, image: normalizeImageUrl(prod?.image) } as AdminProduct;
}

export async function updateProduct(id: string, productData: Partial<CreateProductData>): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`Failed to update product: ${res.status}`);
  const prod = await res.json();
  return { ...prod, image: normalizeImageUrl(prod?.image) } as AdminProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete product: ${res.status}`);
}

// Excel template and import (Admin)
export function getProductTemplateUrl(categoryId: string): string {
  return `${API_BASE}/admin/products/template/${categoryId}`;
}

export async function importProductsFromExcel(categoryId: string, file: File): Promise<{ imported: number; results: any[] }>{
  const token = typeof window !== 'undefined' ? localStorage.getItem('tpestore_token') : null;
  const form = new FormData();
  form.append('categoryId', categoryId);
  form.append('file', file);
  const res = await fetch(`${API_BASE}/admin/products/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    } as any,
    body: form
  });
  if (!res.ok) throw new Error(`Failed to import products: ${res.status}`);
  return await res.json();
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

  const res = await fetch(`${API_BASE}/admin/categories?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch admin categories: ${res.status}`);
  const data = await res.json();
  const list: AdminCategory[] = Array.isArray(data?.categories) ? data.categories : [];
  return { categories: list.map((c) => ({ ...c, image: normalizeImageUrl(c.image) })), pagination: data.pagination };
}

export async function createCategory(categoryData: Partial<AdminCategory>): Promise<AdminCategory> {
  const res = await fetch(`${API_BASE}/admin/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) throw new Error(`Failed to create category: ${res.status}`);
  const cat = await res.json();
  return { ...cat, image: normalizeImageUrl(cat?.image) } as AdminCategory;
}

export async function updateCategory(id: string, categoryData: Partial<AdminCategory>): Promise<AdminCategory> {
  const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  });
  if (!res.ok) throw new Error(`Failed to update category: ${res.status}`);
  const cat = await res.json();
  return { ...cat, image: normalizeImageUrl(cat?.image) } as AdminCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
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

  const res = await fetch(`${API_BASE}/admin/users?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch admin users: ${res.status}`);
  return await res.json();
}

export async function updateUser(id: string, userData: Partial<AdminUser>): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
  return await res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
}

// User Profile API
export async function fetchUserProfile(forceRefresh = false): Promise<AdminUser> {
  const headers = getAuthHeaders();
  // Add cache-busting if force refresh
  const url = forceRefresh 
    ? `${API_BASE}/users/profile?t=${Date.now()}`
    : `${API_BASE}/users/profile`;
  const res = await fetch(url, {
    headers,
    cache: forceRefresh ? 'no-store' : 'default',
  });
  if (!res.ok) throw new Error(`Failed to fetch user profile: ${res.status}`);
  const json = await res.json();
  console.log('fetchUserProfile response:', json);
  const data = json?.data ?? json;
  console.log('fetchUserProfile parsed data:', data);
  return data;
}

export async function updateUserProfile(userData: Partial<AdminUser>): Promise<AdminUser> {
  console.log('updateUserProfile - calling API with:', userData);
  console.log('updateUserProfile - API URL:', `${API_BASE}/users/profile`);
  console.log('updateUserProfile - Method: PUT');
  
  try {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    console.log('updateUserProfile - Response status:', res.status);
    console.log('updateUserProfile - Response ok:', res.ok);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('updateUserProfile - Error response:', errorData);
      const errorMessage = errorData.message || errorData.error || `Failed to update user profile: ${res.status}`;
      throw new Error(errorMessage);
    }
    const json = await res.json();
    console.log('updateUserProfile - Success response:', json);
    return json?.data ?? json;
  } catch (error) {
    console.error('updateUserProfile - Fetch error:', error);
    throw error;
  }
}

// Order cancellation APIs
export async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string; order: any; ghnResult?: any }> {
  const res = await fetch(`${API_BASE}/admin/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to cancel order: ${res.status}`);
  return await res.json();
}

export async function cancelUserOrder(orderId: string): Promise<{ success: boolean; message: string; order: any; ghnResult?: any }> {
  const res = await fetch(`${API_BASE}/users/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to cancel order: ${res.status}`);
  return await res.json();
}

// Address management APIs
export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  email?: string
  address: string
  province?: string
  district?: string
  ward?: string
  provinceName?: string
  districtName?: string
  wardName?: string
  hamlet?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch(`${API_BASE}/users/addresses`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch addresses: ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
}

export async function fetchAddressById(id: string): Promise<Address> {
  const res = await fetch(`${API_BASE}/users/addresses/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch address: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export async function createAddress(addressData: Partial<Address>): Promise<Address> {
  const res = await fetch(`${API_BASE}/users/addresses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(addressData),
  });
  if (!res.ok) throw new Error(`Failed to create address: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export async function updateAddress(id: string, addressData: Partial<Address>): Promise<Address> {
  const res = await fetch(`${API_BASE}/users/addresses/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(addressData),
  });
  if (!res.ok) throw new Error(`Failed to update address: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/addresses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete address: ${res.status}`);
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const res = await fetch(`${API_BASE}/users/addresses/${id}/default`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to set default address: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

// File upload (images)
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  const path: string = data.url;
  // Return absolute URL so frontend at port 3000 can load image from backend 4000
  return path.startsWith('http') ? path : `http://localhost:4000${path}`;
}

// Revenue Statistics API
export interface RevenueStatistics {
  period: string;
  chartData: Array<{
    period: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  totals: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    previousRevenue: number;
    revenueChange: string;
  };
}

export async function fetchRevenueStatistics(period: string = "30days"): Promise<RevenueStatistics> {
  const res = await fetch(`${API_BASE}/admin/revenue/statistics?period=${period}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch revenue statistics: ${res.status}`);
  return await res.json();
}

// Dashboard Statistics API
export interface DashboardStats {
  totalRevenue: number;
  previousRevenue: number;
  revenueChange: string;
  totalOrders: number;
  previousTotalOrders: number;
  ordersChange: string;
  totalProducts: number;
  previousTotalProducts: number;
  productsChange: string;
  totalUsers: number;
  previousTotalUsers: number;
  usersChange: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/admin/dashboard/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch dashboard stats: ${res.status}`);
  return await res.json();
}

// Category Revenue API
export interface CategoryRevenue {
  categories: Array<{
    name: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  totalRevenue: number;
}

export async function fetchCategoryRevenue(): Promise<CategoryRevenue> {
  const res = await fetch(`${API_BASE}/admin/analytics/category-revenue`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch category revenue: ${res.status}`);
  return await res.json();
}

// Top Products API
export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  trend: string;
}

export interface TopProductsResponse {
  products: TopProduct[];
}

export async function fetchTopProducts(limit: number = 5): Promise<TopProductsResponse> {
  const res = await fetch(`${API_BASE}/admin/analytics/top-products?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch top products: ${res.status}`);
  return await res.json();
}

// Sales by Region API
export interface SalesByRegion {
  regions: Array<{
    name: string;
    sales: number;
    orders: number;
    percentage: number;
  }>;
  topRegion: string;
  totalSales: number;
}

export async function fetchSalesByRegion(): Promise<SalesByRegion> {
  const res = await fetch(`${API_BASE}/admin/analytics/sales-by-region`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch sales by region: ${res.status}`);
  return await res.json();
}

// Review APIs
export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

export interface ReviewEligibility {
  orderId: string;
  canReview: boolean;
  isCompleted: boolean;
  isDelivered: boolean;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    canReview: boolean;
    hasReviewed: boolean;
    product: {
      id: string;
      name: string;
      image: string;
    };
  }>;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
}

export async function getReviewEligibility(orderId: string): Promise<ReviewEligibility> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/review-eligibility`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch review eligibility: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export async function createReview(productId: string, data: {
  rating: number;
  comment: string;
  orderId?: string;
}): Promise<Review> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create review: ${res.status}`);
  }
  const json = await res.json();
  return json?.data ?? json;
}

export async function getProductReviews(productId: string, page: number = 1, limit: number = 10): Promise<ReviewsResponse> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews?page=${page}&limit=${limit}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export interface PurchaseStatus {
  hasPurchased: boolean;
  canReview: boolean;
  hasReviewed: boolean;
  reviewId: string | null;
  orders: Array<{
    orderId: string;
    status: string;
    isDelivered: boolean;
  }>;
}

export async function checkUserPurchasedProduct(productId: string, orderId?: string): Promise<PurchaseStatus> {
  try {
    const url = orderId 
      ? `${API_BASE}/products/${productId}/purchase-status?orderId=${orderId}`
      : `${API_BASE}/products/${productId}/purchase-status`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // Return default status instead of throwing - backend should handle errors gracefully
      return {
        hasPurchased: false,
        canReview: false,
        hasReviewed: false,
        reviewId: null,
        orders: [],
      };
    }
    const json = await res.json();
    return json?.data ?? json;
  } catch (error) {
    // Network or other errors - return safe default
    return {
      hasPurchased: false,
      canReview: false,
      hasReviewed: false,
      reviewId: null,
      orders: [],
    };
  }
}

export interface OrderProductsReviewStatus {
  orderId: string;
  canReview: boolean;
  isDelivered: boolean;
  products: Array<{
    productId: string;
    hasReviewed: boolean;
  }>;
}

export async function getOrderProductsReviewStatus(orderId: string): Promise<OrderProductsReviewStatus> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/products-review-status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get review status: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

// API Client object for easy usage in components
export const api = {
  // Users API
  get: async (url: string) => {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    return await res.json();
  },
  
  post: async (url: string, data?: any) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`API request failed: ${res.status}`, errorData);
      throw new Error(`API request failed: ${res.status} - ${JSON.stringify(errorData)}`);
    }
    return await res.json();
  },
  
  put: async (url: string, data?: any) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    return await res.json();
  },
  
  patch: async (url: string, data?: any) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    return await res.json();
  },
  
  delete: async (url: string) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    return await res.json();
  },
};


