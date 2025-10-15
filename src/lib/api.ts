const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface ApiCategory {
  id: string;
  name: string;
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
  stock: number;
  image: string;
  category?: ApiCategory;
  reviews?: ApiReview[];
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
    image: product.image,
    category: product.category?.name || "Khác",
    rating: avgRating,
    inStock: (product.stock || 0) > 0,
    description: product.description,
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


