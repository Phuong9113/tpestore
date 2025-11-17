import { env } from "../../config/env.js";
import * as pgvectorStore from "./pgvector.store.js";
import * as pineconeStore from "./pinecone.store.js";
import * as firestoreStore from "./firestore.store.js";

const PROVIDERS = {
	pgvector: pgvectorStore,
	pinecone: pineconeStore,
	firestore: firestoreStore,
};

function getProvider() {
	const provider = env.VECTOR_STORE_PROVIDER;
	return PROVIDERS[provider] || pgvectorStore;
}

export function getVectorStoreProvider() {
	return env.VECTOR_STORE_PROVIDER;
}

export async function upsertEmbedding(payload) {
	const provider = getProvider();
	return provider.upsertEmbedding(payload);
}

export async function similaritySearch(payload) {
	const provider = getProvider();
	return provider.similaritySearch(payload);
}

