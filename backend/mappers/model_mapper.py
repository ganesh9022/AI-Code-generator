from enum import Enum

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
    else:
        return "Model yet to be set up"
