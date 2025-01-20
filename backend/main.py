import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_caching import Cache
from constants import FOLDERPATH
from db.sqlalchemy_orm import get_user_details
from mappers.model_mapper import map_models, map_chat_models
from config import get_cache_config
import nest_asyncio
from dotenv import load_dotenv
from helpers.request_helper import make_key
from scheduler.token_scheduler import token_scheduler
import logging
import atexit
from routes.github_routes import get_github_token_route, extract_repo_functions

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config.from_mapping(get_cache_config())
cache = Cache(app)

# Register scheduler shutdown on app exit
atexit.register(token_scheduler.stop)


@app.route("/train-model", methods=["POST"])
def train_model():
    uploaded_files = request.files.getlist("files")
    save_directory = os.path.join(FOLDERPATH)

    os.makedirs(save_directory, exist_ok=True)

    for file in uploaded_files:
        file_path = os.path.join(save_directory, file.filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        file.save(file_path)
        logger.info(f"Saved file: {file.filename} to {file_path}")
    return jsonify({"message": "Files received and saved successfully"}), 200

@app.route("/code-snippet", methods=["POST"])
@cache.cached(timeout=600, make_cache_key=make_key)
def generate_code_snippet():
    data = request.json
    prefix = data.get("prefix")
    currentLine = data.get("currentLine")
    suffix = data.get("suffix")
    language = data.get("language")
    model = data.get("model")
    enableContextualResponse = data.get("toggle")
    response = map_models(
        model, prefix, currentLine, suffix, language, enableContextualResponse
    )
    return response

@app.route("/ask-query", methods=["POST"])
@cache.cached(timeout=600, make_cache_key=make_key)
def provide_answer():
    data = request.json
    question = data.get("prompt")
    model = data.get("model")
    response = map_chat_models(model, question)
    return response

@app.route("/saveUser", methods=["POST"])
def save_user():
    data = request.json
    user_id = data.get("userId")
    userName = data.get("userName")
    email = data.get("email")
    response = get_user_details(user_id, userName, email)
    return response

app.route("/get-github-token", methods=["POST"])(get_github_token_route)
app.route("/extract-repo-functions", methods=["POST"])(extract_repo_functions)

if __name__ == "__main__":
    nest_asyncio.apply()
    try:
        app.run(debug=True, port=8000)
    finally:
        token_scheduler.stop()
