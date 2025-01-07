import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from g4f.client import Client
from constants import FOLDERPATH
from db.sqlalchemy_orm import get_user_details
from mappers.model_mapper import map_models,map_chat_models
import nest_asyncio
from 
app = Flask(__name__)
CORS(app)

client = Client()


@app.route("/train-model", methods=["POST"])
def train_model():

    uploaded_files = request.files.getlist("files")
    save_directory = os.path.join(FOLDERPATH)

    os.makedirs(save_directory, exist_ok=True)

    for file in uploaded_files:
        file_path = os.path.join(save_directory, file.filename)

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        file.save(file_path)
        print(f"Saved file: {file.filename} to {file_path}")
    return jsonify({"message": "Files received and saved successfully"}), 200


@app.route("/code-snippet", methods=["POST"])
def generate_code_snippet():

    data = request.json
    prefix = data.get("prefix")
    currentLine = data.get("currentLine")
    suffix = data.get("suffix")
    language = data.get("language")
    model = data.get("model")
    enableContextualResponse = data.get("toggle")
    response = map_models(
        model,
        prefix,
        currentLine,
        suffix,
        language,
        enableContextualResponse
    )
    return response

@app.route("/ask-query", methods=["POST"])
def provide_answer():
    data = request.json
    question = data.get("prompt")
    model = data.get("model")
    response = map_chat_models(model,question)
    return response


@app.route("/saveUser", methods=["POST"])
def save_user():
    data = request.json
    user_id = data.get("userId")
    userName = data.get("userName")
    email = data.get("email")
    response = get_user_details(user_id, userName, email) 
    return response

if __name__ == "__main__":
    nest_asyncio.apply()
    app.run(debug=True, port=8000)
