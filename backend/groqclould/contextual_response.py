import asyncio
import os
import chromadb
import logging
from typing import List, Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from constants import (
    CHROMA_COLLECTION_NAME, 
    CHROMA_PERSIST_DIR, 
    FOLDERPATH,
    EMBEDDING_MODEL_NAME,
    GROQ_MODEL_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    SEPARATORS
)
from groqclould.system_prompt import RAG_SYSTEM_PROMPT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure environment
os.environ["TOKENIZERS_PARALLELISM"] = "false"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY environment variable is not set")
    raise ValueError("GROQ_API_KEY environment variable is not set.")
os.environ["GROQ_API_KEY"] = GROQ_API_KEY

class RAGManager:
    def __init__(self):
        self._embed_model: Optional[HuggingFaceEmbeddings] = None
        self._rag_llm: Optional[ChatGroq] = None
        self._chroma_client: Optional[chromadb.PersistentClient] = None
        self._vectorstore: Optional[Chroma] = None
        self._retriever = None
        # Clean up and initialize ChromaDB directory
        self._initialize_chroma_directory()
        logger.info("RAGManager initialized")

    def _initialize_chroma_directory(self):
        """Initialize ChromaDB directory with proper cleanup."""
        try:
            # Ensure the directory exists
            os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
            
            # Initialize ChromaDB client with settings
            settings = chromadb.Settings(
                anonymized_telemetry=False,
                allow_reset=True,
                is_persistent=True,
                persist_directory=CHROMA_PERSIST_DIR
            )
            
            self._chroma_client = chromadb.PersistentClient(
                path=CHROMA_PERSIST_DIR,
                settings=settings
            )

            # Create or get collection
            try:
                collection = self._chroma_client.get_or_create_collection(
                    name=CHROMA_COLLECTION_NAME,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info(f"ChromaDB collection '{CHROMA_COLLECTION_NAME}' initialized")
            except Exception as e:
                logger.warning(f"Error with collection, recreating: {str(e)}")
                # If there's an error, try to reset the collection
                self._chroma_client.delete_collection(CHROMA_COLLECTION_NAME)
                collection = self._chroma_client.create_collection(
                    name=CHROMA_COLLECTION_NAME,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info(f"ChromaDB collection '{CHROMA_COLLECTION_NAME}' recreated")

        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {str(e)}")
            raise

    @property
    def chroma_client(self):
        """Get or create ChromaDB client."""
        if self._chroma_client is None:
            logger.debug("Creating new ChromaDB client")
            self._initialize_chroma_directory()
        return self._chroma_client

    @property
    def embed_model(self):
        """Get or create embedding model."""
        if self._embed_model is None:
            logger.debug("Initializing embedding model")
            self._embed_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
            logger.info("Embedding model initialized successfully")
        return self._embed_model

    @property
    def rag_llm(self):
        """Get or create RAG LLM model."""
        if self._rag_llm is None:
            logger.debug("Initializing RAG LLM model")
            self._rag_llm = ChatGroq(model=GROQ_MODEL_NAME)
            logger.info("RAG LLM model initialized successfully")
        return self._rag_llm

    def load_files_and_create_retriever(self, directory: str):
        """Load files and create/get retriever with error handling."""
        try:
            if not os.path.isdir(directory):
                logger.error(f"Invalid directory: {directory}")
                raise ValueError(f"Invalid directory: {directory}")

            files = os.listdir(directory)
            if not files:
                logger.error(f"No files uploaded in directory: {directory}")
                raise ValueError(f"No files uploaded in directory: {directory}")

            # Check if collection exists
            if self._vectorstore is not None:
                try:
                    logger.debug("Attempting to use existing vectorstore")
                    return self._vectorstore.as_retriever()
                except Exception as e:
                    logger.warning(f"Failed to use existing vectorstore: {str(e)}")
                    self._vectorstore = None

            # Load and split documents
            logger.info("Loading and splitting documents")
            loader = DirectoryLoader(
                directory,
                use_multithreading=True,
                loader_cls=TextLoader,
                show_progress=True
            )
            text_splitter = RecursiveCharacterTextSplitter(
                separators=SEPARATORS,
                chunk_size=CHUNK_SIZE,
                chunk_overlap=CHUNK_OVERLAP,
                length_function=len,
                is_separator_regex=False,
            )
            documents = loader.load_and_split(text_splitter=text_splitter)
            logger.debug(f"Loaded {len(documents)} document chunks")

            # Create vectorstore with persistence
            logger.info("Creating vector store")
            self._vectorstore = Chroma.from_documents(
                documents,
                embedding=self.embed_model,
                collection_name=CHROMA_COLLECTION_NAME,
                persist_directory=CHROMA_PERSIST_DIR,
                client=self.chroma_client
            )
            logger.info("Vector store created/updated successfully")

            self._retriever = self._vectorstore.as_retriever()
            return self._retriever

        except Exception as e:
            logger.error(f"Error in load_files_and_create_retriever: {str(e)}")
            raise

    def format_docs(self, docs: List[Document]) -> str:
        """Format documents with error handling."""
        try:
            if not docs:
                logger.debug("No documents to format")
                return ""
            formatted = "\n".join(doc.page_content for doc in docs)
            logger.debug(f"Formatted {len(docs)} documents")
            return formatted
        except Exception as e:
            logger.error(f"Error formatting documents: {str(e)}")
            return ""

    def setup_rag_chain(self):
        """Set up RAG chain with error handling."""
        try:
            if not self._retriever:
                logger.debug("No retriever found, creating new one")
                self._retriever = self.load_files_and_create_retriever(FOLDERPATH)

            logger.info("Setting up RAG chain")
            prompt = ChatPromptTemplate.from_messages([
                ("system", RAG_SYSTEM_PROMPT),
                ("human", "{input}")
            ])

            rag_chain = (
                {
                    "context": self._retriever | self.format_docs,
                    "input": RunnablePassthrough(),
                }
                | prompt
                | self.rag_llm
                | StrOutputParser()
            )
            logger.info("RAG chain setup complete")

            return rag_chain
        except Exception as e:
            logger.error(f"Error setting up RAG chain: {str(e)}")
            raise

    async def get_contextual_response(self, question: str) -> str:
        """Get contextual response with comprehensive error handling."""
        try:
            logger.info("Getting contextual response")
            # Set up chain
            rag_chain = self.setup_rag_chain()

            # Generate response
            try:
                logger.debug("Attempting async invoke")
                return await rag_chain.ainvoke(question)
            except Exception as e:
                if "async library" in str(e):
                    logger.warning("Async invoke failed, falling back to sync invoke")
                    # Fallback to sync invoke if async fails
                    return rag_chain.invoke(question)
                raise

        except Exception as e:
            logger.error(f"Error generating contextual response: {str(e)}")
            return ""

# Create a singleton instance
rag_manager = RAGManager()
logger.info("RAGManager singleton instance created")

# Export the get_contextual_response function for backward compatibility
async def get_contextual_response(question: str) -> str:
    return await rag_manager.get_contextual_response(question)
