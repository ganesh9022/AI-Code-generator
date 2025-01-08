from enum import Enum
import asyncio
from concurrent.futures import ThreadPoolExecutor

from llm.ollama_models import generate_code, ask_question
from operation_predictor.operation_predictor import operation
from groqclould.groq_response import get_groq_response,  answer_user_query
from groqclould.contextual_response import get_contextual_response

class Model(Enum):
    Ollama = "ollama"
    Groq = "groq"
    ML = "ml"


def get_event_loop():
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop

def map_models(
    model: Model, prefix: str, currentLine: str, suffix: str, language: str, enableContextualResponse: bool
):
    if model == Model.Groq.value:
        if enableContextualResponse:
            loop = get_event_loop()
            try:
                return loop.run_until_complete(get_contextual_response(currentLine))
            except RuntimeError:
                # If event loop is closed, create a new one
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                try:
                    return new_loop.run_until_complete(get_contextual_response(currentLine))
                finally:
                    new_loop.close()
        else:
            return get_groq_response(prefix, currentLine, suffix, language)
    elif model == Model.Ollama.value:
        return generate_code(prompt=currentLine, suffix=suffix, prefix=prefix, language=language)
    elif model == Model.ML.value:
        return operation(currentLine)
    else:
        return "Model not found"

def map_chat_models(model:Model,question:str)->Model:
    if model == Model.Groq.value:
        return answer_user_query(question=question)
    elif model == Model.Ollama.value:
        return ask_question(question=question)
    else:
        return "Model not found"
