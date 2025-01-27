import os

FOLDERPATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "files")
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vectorstore")

# ChromaDB settings
CHROMA_COLLECTION_NAME = "groq_rag"

# Text splitting settings
CHUNK_SIZE = 3000
CHUNK_OVERLAP = 200
SEPARATORS = ["\n\n", "\n", " ", ""]

# Model settings
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
GROQ_MODEL_NAME = "llama3-8b-8192"

# Create necessary directories
os.makedirs(FOLDERPATH, exist_ok=True)
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

