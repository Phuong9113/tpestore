CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "ProductEmbedding" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "embedding" vector(768) NOT NULL,
  "rawText" TEXT NOT NULL,
  "jsonData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductEmbedding_productId_key" UNIQUE ("productId")
);

CREATE INDEX "ProductEmbedding_embedding_idx"
  ON "ProductEmbedding"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

