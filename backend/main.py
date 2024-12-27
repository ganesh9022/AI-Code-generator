from flask import Flask, request, jsonify
from flask_cors import CORS
from g4f.client import Client
from groqclould.groq_response import generate_code_suggestion, answer_user_query
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


@app.route("/code-snippet", methods=["GET"])
def generate_code_snippet():
    prompt = request.args.get("prompt")
    suffix = request.args.get("suffix")
    response = generate_code_suggestion(
        prompt=prompt,
        suffix=suffix,
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


@app.route("/operation", methods=["GET"])
def operation():
    user_input = request.args.get("prompt")

    data = load_data()
    if os.path.exists("operation_predictor/operation_predictor_model.h5"):
        model = load_model("operation_predictor/operation_predictor_model.h5")
    else:
        model = train_model(data)

    input_examples = []
    for item in data:
        for example in item["input_examples"]:
            input_examples.append(example)

    predicted_function = predict_operation(user_input, model, input_examples, data)

    return predicted_function


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
