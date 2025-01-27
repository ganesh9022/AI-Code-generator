from enum import Enum
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from typing import Optional
import contextvars
import functools

from multi_layer_operation_predictor.operation_predictor import get_operation_definition
from llm.ollama_models import generate_code, ask_question
from groqclould.groq_response import get_groq_response, answer_user_query
from groqclould.contextual_response import get_contextual_response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Model(Enum):
    Ollama = "ollama"
    Groq = "groq"
    MULTI_LAYER = "multi-layer-ml-model"

_executor = ThreadPoolExecutor(max_workers=3)

def to_thread(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_running_loop()
        ctx = contextvars.copy_context()
        func_call = functools.partial(ctx.run, func, *args, **kwargs)
        return await loop.run_in_executor(_executor, func_call)
    return wrapper

async def run_contextual_response(currentLine: str) -> str:
    """Run contextual response in a safe manner."""
    try:
        return await get_contextual_response(currentLine)
    except Exception as e:
        logger.error(f"Error in contextual response: {str(e)}")
        return f"Error generating contextual response: {str(e)}"

def map_models(
    model: Model,
    prefix: str,
    currentLine: str,
    suffix: str,
    language: str,
    enableContextualResponse: bool,
) -> str:
    """Map models with improved error handling and async management."""
    try:
        if model == Model.Groq.value:
            if enableContextualResponse:
                try:
                    return asyncio.run(run_contextual_response(currentLine))
                except RuntimeError:
                    # If event loop is already running, create a new one in a thread
                    @to_thread
                    def run_async():
                        return asyncio.run(run_contextual_response(currentLine))
                    return asyncio.get_event_loop().run_until_complete(run_async())
            else:
                return get_groq_response(prefix, currentLine, suffix, language)
        elif model == Model.Ollama.value:
            return generate_code(
                prompt=currentLine, suffix=suffix, prefix=prefix, language=language
            )
        elif model == Model.MULTI_LAYER.value:
            closest_match = get_operation_definition(currentLine, language)
            return closest_match.replace(currentLine, "")
        else:
            return "Model not found"
    except Exception as e:
        logger.error(f"Error in map_models: {str(e)}")
        return f"Error: {str(e)}"

def map_chat_models(model: Model, question: str) -> str:
    """Map chat models with error handling."""
    try:
        if model == Model.Groq.value:
            return answer_user_query(question=question)
        elif model == Model.Ollama.value:
            return ask_question(question=question)
        else:
            return "Model not found"
    except Exception as e:
        logger.error(f"Error in map_chat_models: {str(e)}")
        return f"Error: {str(e)}"

def cleanup():
    """Cleanup resources."""
    global _executor
    _executor.shutdown(wait=True)
