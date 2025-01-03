from enum import Enum

from llm.ollama_models import generate_code, ask_question
from operation_predictor.operation_predictor import operation
from groqclould.groq_response import get_groq_response, answer_user_query

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
        return generate_code(prompt=currentLine, suffix=suffix, language=language)
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