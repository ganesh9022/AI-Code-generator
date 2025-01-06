import os
import chromadb
import nest_asyncio
from typing import List
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
from constants import FOLDERPATH
from groqclould.system_prompt import RAG_SYSTEM_PROMPT

load_dotenv()

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
os.environ["TOKENIZERS_PARALLELISM"] = "false"
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set.")
os.environ["GROQ_API_KEY"] = GROQ_API_KEY

def initialize_models() -> tuple:
    """
    Initialize the embedding model and the RAG LLM model.
    
    Returns:
        tuple: A tuple containing the embedding model and the RAG LLM model.
    """
    embed_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    rag_llm = ChatGroq(model="llama3-8b-8192")
    return embed_model, rag_llm

def load_files(directory: str, embed_model: HuggingFaceEmbeddings):
    """
    Load and split files from the specified directory, and create a retriever.

    Args:
        directory (str): The directory containing the files to load.
        embed_model (HuggingFaceEmbeddings): The embedding model to use.

    Returns:
        retriever: A retriever object for retrieving documents.
    """
    if not os.path.isdir(directory):
        raise ValueError(f"Invalid directory: {directory}")

    # Load and split documents from the directory
    loader = DirectoryLoader(directory, use_multithreading=True, loader_cls=TextLoader)
    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", " ", ""],
        chunk_size=3000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    documents = loader.load_and_split(text_splitter=text_splitter)

    # Create a vector store from the documents
    vectorstore = Chroma.from_documents(
        documents, embedding=embed_model, collection_name="groq_rag"
    )

    # Clear the ChromaDB system cache
    chromadb.api.client.SharedSystemClient.clear_system_cache()

    return vectorstore.as_retriever()

def format_docs(docs: List[Document]) -> str:
    """
    Format a list of documents into a single string.

    Args:
        docs (List[Document]): A list of Document objects.

    Returns:
        str: A formatted string containing the content of the documents.
    """
    if not docs:
        return ""
    return "\n".join(doc.page_content for doc in docs)

def setup_rag_chain(retriever, rag_llm):
    """
    Set up the RAG chain for generating responses.

    Args:
        retriever: The retriever object for retrieving documents.
        rag_llm: The RAG LLM model.

    Returns:
        rag_chain: The RAG chain object for generating responses.
    """
    RAG_HUMAN_PROMPT = "{input}"
    RAG_PROMPT = ChatPromptTemplate.from_messages(
        [("system", RAG_SYSTEM_PROMPT), ("human", RAG_HUMAN_PROMPT)]
    )

    rag_chain = {
        "context": retriever | format_docs,
        "input": RunnablePassthrough(),
    } | RAG_PROMPT | rag_llm | StrOutputParser()

    return rag_chain

async def get_contextual_response(question: str) -> str:
    """
    Get a contextual response for the given question.

    Args:
        question (str): The question to generate a response for.

    Returns:
        str: The generated response.
    """
    embed_model, rag_llm = initialize_models()

    # Load files and create a retriever
    retriever = load_files(FOLDERPATH, embed_model)

    # Set up the RAG chain
    rag_chain = setup_rag_chain(retriever, rag_llm)

    # Generate and return the response
    answer = await rag_chain.ainvoke(question)
    return answer
