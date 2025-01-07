from flask import Flask, request
from flask_cors import CORS
from g4f.client import Client
from mappers.model_mapper import map_models,map_chat_models
from groqclould.groq_response import (
    answer_user_query,
 )
app = Flask(__name__)
CORS(app)

client = Client()

@app.route("/code-snippet", methods=["POST"])
def generate_code_snippet():
    data = request.json
    prefix = data.get("prefix")
    currentLine = data.get("currentLine")
    suffix = data.get("suffix")
    language = data.get("language")
    model = data.get("model")
    response = map_models(
        model,
        prefix,
        currentLine,
        suffix,
        language,
    )
    return response

@app.route("/ask-query", methods=["POST"])
def provide_answer():
    data = request.json
    question = data.get("prompt")
    model = data.get("model")
    response = map_chat_models(model,question)
    return response


if __name__ == "__main__":
    app.run(debug=True, port=8000)
