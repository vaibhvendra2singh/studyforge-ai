"""
Retrieval-Augmented Generation (RAG) Engine Skeleton.
This module demonstrates how to chunk large documents, embed them into a local vector space,
and query them. This is an advanced architecture feature to bypass LLM token limits on huge PDFs.
"""

import os
import json
import sqlite3
import numpy as np

# In a production environment, you would use:
# pip install chromadb sentence-transformers langchain
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDER = SentenceTransformer('all-MiniLM-L6-v2')
except ImportError:
    EMBEDDER = None

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'rag_vectors.db')

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS document_chunks
                 (id INTEGER PRIMARY KEY, document_id TEXT, text TEXT, embedding BLOB)''')
    conn.commit()
    conn.close()

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    """Splits a massive textbook into overlapping context windows."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def ingest_document(document_id: str, text: str):
    """Chunks a document, generates embeddings, and saves to the vector database."""
    if EMBEDDER is None:
        raise RuntimeError("sentence-transformers not installed. Run: pip install sentence-transformers")
    
    init_db()
    chunks = chunk_text(text)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    for chunk in chunks:
        # Generate 384-dimensional vector embedding
        embedding = EMBEDDER.encode(chunk)
        embedding_blob = embedding.tobytes()
        c.execute("INSERT INTO document_chunks (document_id, text, embedding) VALUES (?, ?, ?)",
                  (document_id, chunk, embedding_blob))
                  
    conn.commit()
    conn.close()
    return len(chunks)

def query_rag(document_id: str, query: str, top_k: int = 3):
    """Finds the most relevant chunks of a textbook using cosine similarity."""
    if EMBEDDER is None:
        return ["RAG is currently running in mock mode. Please install sentence-transformers."]
        
    query_vector = EMBEDDER.encode(query)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT text, embedding FROM document_chunks WHERE document_id=?", (document_id,))
    rows = c.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        text, emb_blob = row
        chunk_vector = np.frombuffer(emb_blob, dtype=np.float32)
        # Cosine similarity
        similarity = np.dot(query_vector, chunk_vector) / (np.linalg.norm(query_vector) * np.linalg.norm(chunk_vector))
        results.append((similarity, text))
        
    # Sort by highest similarity
    results.sort(key=lambda x: x[0], reverse=True)
    return [text for score, text in results[:top_k]]
