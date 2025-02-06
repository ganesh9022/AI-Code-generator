import asyncio
import os
import logging
from typing import List, Optional
from contextlib import contextmanager

import numpy as np
from dotenv import load_dotenv
from langchain_groq import ChatGroq
#  in future we can change - from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings

from langchain_community.embeddings import SpacyEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from sqlalchemy import select

from db.sqlalchemy_orm import DocumentEmbedding
from db.database import SessionLocal
from constants import (
    EMBEDDING_MODEL_NAME,
    GROQ_MODEL_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    SEPARATORS
)
from groqclould.system_prompt import RAG_SYSTEM_PROMPT
from groq import Groq
import spacy

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

@contextmanager
def get_db_session():
    """Context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class RAGManager:
    def __init__(self):
        self._embed_model = None
        self._initialize_embed_model()
        self._rag_llm: Optional[ChatGroq] = None
        logger.info("RAGManager initialized")

    def _initialize_embed_model(self):
        """Initialize the embedding model."""
        try:
            # Download spaCy model if not already downloaded
            try:
                spacy.load(EMBEDDING_MODEL_NAME)
            except OSError:
                spacy.cli.download(EMBEDDING_MODEL_NAME)
            
            self._embed_model = SpacyEmbeddings(model_name=EMBEDDING_MODEL_NAME)
            logger.info("Embedding model initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing embedding model: {str(e)}")
            raise

    @property
    def embed_model(self):
        """Get or create embedding model."""
        if self._embed_model is None:
            self._initialize_embed_model()
        return self._embed_model

    @property
    def rag_llm(self):
        """Get or create RAG LLM model."""
        if self._rag_llm is None:
            logger.debug("Initializing RAG LLM model")
            self._rag_llm = ChatGroq(model=GROQ_MODEL_NAME)
            logger.info("RAG LLM model initialized successfully")
        return self._rag_llm

    async def get_relevant_documents(self, query: str, k: int = 4) -> List[Document]:
        """Get relevant documents using vector similarity search."""
        with get_db_session() as db:
            # Get query embedding
            query_embedding = self.embed_model.embed_query(query)

            # Get all documents and calculate similarities
            stmt = select(DocumentEmbedding)
            results = db.execute(stmt).scalars().all()

            if not results:
                logger.warning("No documents found in database")
                return []

            # Convert embeddings to numpy array for faster computation
            embeddings = np.array([doc.embedding for doc in results])
            query_embedding = np.array(query_embedding)

            # Calculate similarities in batch
            similarities = np.dot(embeddings, query_embedding) / (
                np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
            )

            # Get indices of top k results
            top_k_indices = np.argsort(similarities)[-k:][::-1]

            # Convert top k results to Documents
            return [
                Document(
                    page_content=results[idx].content,
                    metadata=results[idx].doc_metadata or {}
                )
                for idx in top_k_indices
            ]

    def format_docs(self, docs: List[Document]) -> str:
        """Format documents with error handling."""
        try:
            if not docs:
                logger.debug("No documents to format")
                return ""
            formatted = "\n\n".join(doc.page_content for doc in docs)
            logger.debug(f"Formatted {len(docs)} documents")
            return formatted
        except Exception as e:
            logger.error(f"Error formatting documents: {str(e)}")
            return ""

    async def process_documents(self, documents: List[Document]) -> bool:
        """Process documents and store embeddings in PostgreSQL."""
        try:
            if not documents:
                logger.warning("No documents provided")
                return False

            # Split documents
            text_splitter = RecursiveCharacterTextSplitter(
                separators=SEPARATORS,
                chunk_size=CHUNK_SIZE,
                chunk_overlap=CHUNK_OVERLAP,
                length_function=len,
                is_separator_regex=False,
            )

            split_docs = []
            for doc in documents:
                try:
                    split_docs.extend(text_splitter.split_documents([doc]))
                except Exception as e:
                    logger.warning(f"Error splitting document {doc.metadata.get('source', 'unknown')}: {str(e)}")
                    continue

            if not split_docs:
                logger.warning("No content could be split from documents")
                return False

            # Create embeddings and store in database
            with get_db_session() as db:
                try:
                    # Clear existing embeddings
                    db.query(DocumentEmbedding).delete()

                    # Create embeddings in batch
                    contents = [doc.page_content for doc in split_docs]
                    embeddings = self.embed_model.embed_documents(contents)

                    # Store embeddings
                    db_embeddings = [
                        DocumentEmbedding(
                            content=doc.page_content,
                            embedding=embedding,
                            doc_metadata=doc.metadata,
                            source=doc.metadata.get("source")
                        )
                        for doc, embedding in zip(split_docs, embeddings)
                    ]
                    db.add_all(db_embeddings)
                    db.commit()

                    logger.info(f"Successfully stored {len(split_docs)} embeddings in database")
                    return True

                except Exception as e:
                    db.rollback()
                    logger.error(f"Error storing embeddings in database: {str(e)}")
                    return False

        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}")
            return False

    async def get_contextual_response(self, question: str) -> str:
        """Get contextual response using RAG."""
        try:
            # Get relevant documents
            relevant_docs = await self.get_relevant_documents(question)
            
            if not relevant_docs:
                logger.warning("No relevant documents found")
                return "I don't have enough context to answer that question."

            # Format documents
            context = self.format_docs(relevant_docs)

            # Generate response
            prompt = ChatPromptTemplate.from_messages([
                ("system", RAG_SYSTEM_PROMPT),
                ("human", "{input}")
            ])

            chain = (
                {"context": lambda x: context, "input": RunnablePassthrough()}
                | prompt
                | self.rag_llm
                | StrOutputParser()
            )

            response = await chain.ainvoke(question)
            logger.info("Successfully generated contextual response")
            return response

        except Exception as e:
            logger.error(f"Error generating contextual response: {str(e)}")
            return f"Error generating response: {str(e)}"

# Create a singleton instance
rag_manager = RAGManager()
logger.info("RAGManager singleton instance created")

# Export the get_contextual_response function for backward compatibility
async def get_contextual_response(question: str) -> str:
    return await rag_manager.get_contextual_response(question)
