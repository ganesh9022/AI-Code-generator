from enum import Enum

from constants import FOLDERPATH
from llm.ollama_models import generate_code
from operation_predictor.operation_predictor import operation
from groqclould.groq_response import get_groq_response
from groqclould.contextual_response import get_contextual_response
import asyncio

class Model(Enum):
    Ollama = "ollama"
    Groq = "groq"
    ML = "ml"

def map_models(
    model: Model, prefix: str, currentLine: str, suffix: str, language: str, enableContextualResponse: bool
) -> Model:
    if model == Model.Groq.value:
        if enableContextualResponse and FOLDERPATH:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                return loop.create_task(get_contextual_response(currentLine, FOLDERPATH))
            else:
                return asyncio.run(get_contextual_response(currentLine, FOLDERPATH))
        else:
            return get_groq_response(prefix, currentLine, suffix, language)
    elif model == Model.Ollama.value:
        return generate_code(prompt=currentLine, suffix=suffix, language=language)
    elif model == Model.ML.value:
        return operation(currentLine)
    else:
        return "Model not found"
