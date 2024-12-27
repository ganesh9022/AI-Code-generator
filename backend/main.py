from flask import Flask, request, jsonify
from flask_cors import CORS
from g4f.client import Client
from mappers.model_mapper import map_models
from groqclould.groq_response import (
    answer_user_query,
)
from operation_predictor.operation_predictor import (
    load_data,
    train_model,
    load_model,
    predict_operation,
    get_absolute_path,
)
import os
from llm.ollama_models import ask_question, generate_code

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


@app.route("/ask-query", methods=["GET"])
def provide_answer():
    prompt = request.args.get("prompt")
    response = answer_user_query(question=prompt)
    return response


@app.route("/generate-code", methods=["GET"])
def get_generate_code():
    prompt = request.args.get("prompt")
    suffix = request.args.get("suffix")
    response = generate_code(
        prompt=prompt,
        suffix=suffix,
    )
    return response


@app.route("/ask-question", methods=["GET"])
def get_ask_question():
    prompt = request.args.get("prompt")
    response = ask_question(question=prompt)
    return response


@app.route("/complete", methods=["POST"])
def code_completion():
    data = request.json
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        completion = response.choices[0].message.content
        return jsonify({"completion": completion}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=8000)
