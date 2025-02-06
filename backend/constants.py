from enum import Enum
import os

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vectorstore")

# ChromaDB settings
CHROMA_COLLECTION_NAME = "groq_rag"

# Text splitting settings
CHUNK_SIZE = 3000
CHUNK_OVERLAP = 200
SEPARATORS = ["\n\n", "\n", " ", ""]

# Model settings in future we can change the model EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_MODEL_NAME = "en_core_web_md"  # Using spaCy's medium-sized English model (~40MB)
GROQ_MODEL_NAME = "llama3-8b-8192"

# Create necessary directories
os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

class RequestStatus(str, Enum):
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    FAILED = "FAILED"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS"
