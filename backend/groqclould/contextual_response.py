import nest_asyncio
import os
from langchain_groq import ChatGroq
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from typing import List
from dotenv import load_dotenv

from groqclould.system_prompt import RAG_SYSTEM_PROMPT

load_dotenv()

nest_asyncio.apply()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set.")

os.environ["GROQ_API_KEY"] = GROQ_API_KEY

def initialize_models():
    embed_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    rag_llm = ChatGroq(model="llama3-8b-8192")
    return embed_model, rag_llm

def load_files(directory: str, embed_model):
    loader = DirectoryLoader(directory, use_multithreading=True, loader_cls=TextLoader)
    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", " ", ""],
        chunk_size=3000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    documents = loader.load_and_split(text_splitter=text_splitter)
    vectorstore = Chroma.from_documents(
        documents, embedding=embed_model, collection_name="groq_rag"
    )
    retriever = vectorstore.as_retriever()
    return retriever

def setup_rag_chain(retriever, rag_llm):

    RAG_HUMAN_PROMPT = "{input}"

    RAG_PROMPT = ChatPromptTemplate.from_messages(
        [("system", RAG_SYSTEM_PROMPT), ("human", RAG_HUMAN_PROMPT)]
    )

    def format_docs(docs: List[Document]):
        if not docs:
            return None

        return "\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {
            "context": retriever | format_docs,
            "input": RunnablePassthrough(),
        }
        | RAG_PROMPT
        | rag_llm
        | StrOutputParser()
    )
    return rag_chain

async def main(question: str):
    embed_model, rag_llm = initialize_models()
    retriever = load_files(
        "your_directory_path",
        embed_model,
    )
    rag_chain = setup_rag_chain(retriever, rag_llm)

    answer = await rag_chain.ainvoke(question)
    return answer
