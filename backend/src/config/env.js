import dotenv from "dotenv";

dotenv.config();

export const env = {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
	HOST: process.env.HOST || "0.0.0.0",
	JWT_SECRET: process.env.JWT_SECRET || "changeme",
	GHN_TOKEN: process.env.GHN_TOKEN || "",
	GHN_SHOP_ID: process.env.GHN_SHOP_ID || "",
	ZALOPAY_APP_ID: process.env.ZALOPAY_APP_ID || "",
	ZALOPAY_KEY1: process.env.ZALOPAY_KEY1 || "",
	ZALOPAY_KEY2: process.env.ZALOPAY_KEY2 || "",
	CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
	GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
	GEMINI_EMBED_MODEL: process.env.GEMINI_EMBED_MODEL || "text-embedding-004",
	GEMINI_RAG_MODEL: process.env.GEMINI_RAG_MODEL || "gemini-1.5-flash",
	GEMINI_ASSIST_MODEL: process.env.GEMINI_ASSIST_MODEL || "gemini-1.5-pro",
	EMBEDDING_DIMENSION: process.env.EMBEDDING_DIMENSION ? Number(process.env.EMBEDDING_DIMENSION) : 768,
	VECTOR_TOP_K: process.env.VECTOR_TOP_K ? Number(process.env.VECTOR_TOP_K) : 3,
	VECTOR_STORE_PROVIDER: (process.env.VECTOR_STORE_PROVIDER || "pgvector").toLowerCase(),
	PINECONE_API_KEY: process.env.PINECONE_API_KEY || "",
	PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || "",
	PINECONE_INDEX_HOST: process.env.PINECONE_INDEX_HOST || "",
	PINECONE_NAMESPACE: process.env.PINECONE_NAMESPACE || "default",
	FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID || "",
	FIRESTORE_KEY_FILE: process.env.FIRESTORE_KEY_FILE || "",
	FIRESTORE_COLLECTION: process.env.FIRESTORE_COLLECTION || "product_embeddings",
	FIRESTORE_BASE_URL: process.env.FIRESTORE_BASE_URL || "",
	FIRESTORE_BEARER_TOKEN: process.env.FIRESTORE_BEARER_TOKEN || "",
	FIRESTORE_QUERY_LIMIT: process.env.FIRESTORE_QUERY_LIMIT ? Number(process.env.FIRESTORE_QUERY_LIMIT) : 500,
	FIRESTORE_API_KEY: process.env.FIRESTORE_API_KEY || "",
};
