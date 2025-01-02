import os
from flask import Flask, json, jsonify, request
from flask_cors import CORS
from g4f.client import Client
from mappers.model_mapper import map_models

app = Flask(__name__)
CORS(app)

client = Client()

FOLDER_PATH = None
CONTEXTUAL_RESPONSES = False

@app.route("/train-model", methods=["POST"])
def train_model():
    global FOLDER_PATH
    global CONTEXTUAL_RESPONSES
    contextual_response = request.form.get("contextualResponse")

    if contextual_response is not None:
        contextual_response = contextual_response.lower() == 'true'

    uploaded_files = request.files.getlist("files")
    
    save_directory = os.path.join("files")

    os.makedirs(save_directory, exist_ok=True)

    for file in uploaded_files:
        file_path = os.path.join(save_directory, file.filename)

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        file.save(file_path)
        print(f"Saved file: {file.filename} to {file_path}")
    FOLDER_PATH = save_directory
    CONTEXTUAL_RESPONSES = contextual_response
    return jsonify({"message": "Files received and saved successfully"}), 200


@app.route("/code-snippet", methods=["POST"])
def generate_code_snippet():
    global FOLDER_PATH
    global CONTEXTUAL_RESPONSES

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
        FOLDER_PATH,
        CONTEXTUAL_RESPONSES
    )
    return response

if __name__ == "__main__":
    app.run(debug=True, port=8000)
