from enum import Enum

from backend.llm.ollama_models import generate_code
from backend.operation_predictor.operation_predictor import operation
from groqclould.groq_response import get_groq_response


class Model(Enum):
    Ollama = "ollama"
    Groq = "groq"
    ML = "ml"


def map_models(
    model: Model, prefix: str, currentLine: str, suffix: str, language: str
) -> Model:
    if model == Model.Groq.value:
        return get_groq_response(prefix, currentLine, suffix, language)
    elif model == Model.Ollama.value:
        return generate_code(currentLine, suffix) 
    elif model == Model.ML.value:
        return operation(currentLine)  
    else:
        return "Model not found"