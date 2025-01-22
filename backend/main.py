import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_caching import Cache
from constants import FOLDERPATH
from db.sqlalchemy_orm import (
    save_chat_message,
    get_chat_messages_by_page,
    get_total_pages,
    get_user_details,
    Base,
    engine as db,
    delete_chat_page,
    SessionLocal,
    ChatMessage,
    get_all_chat_histories
)
from sqlalchemy import func
from mappers.model_mapper import map_models, map_chat_models
from config import get_cache_config
import nest_asyncio
from dotenv import load_dotenv
from helpers.request_helper import make_key
from scheduler.token_scheduler import token_scheduler
import logging
import atexit
from routes.github_routes import get_github_token_route, extract_repo_functions
from auth.clerk_auth import requires_auth

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database
Base.metadata.create_all(db)

app.config.from_mapping(get_cache_config())
cache = Cache(app)

def make_key():
    """Generate a cache key from request data"""
    user_data = request.get_json()
    sorted_items = sorted(user_data.items())
    endpoint = request.endpoint
    return f"{endpoint}:{','.join([f'{k}={v}' for k, v in sorted_items])}"
# Register scheduler shutdown on app exit
atexit.register(token_scheduler.stop)

@app.route("/train-model", methods=["POST"])
@requires_auth
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
@requires_auth
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
@requires_auth
@cache.cached(timeout=600, make_cache_key=make_key)
def provide_answer():
    data = request.json
    question = data.get("prompt")
    model = data.get("model")
    response = map_chat_models(model, question)
    return response

@app.route("/saveUser", methods=["POST"])
@requires_auth 
def save_user():
    data = request.json
    user_id = data.get("userId")
    userName = data.get("userName")
    email = data.get("email")
    response = get_user_details(user_id, userName, email)
    return response

@app.route("/total-pages", methods=["GET"])
@requires_auth
def total_pages():
    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        total = get_total_pages(user_id)
        return jsonify({"totalPages": total})
    except Exception as e:
        print(f"Error getting total pages: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/chat-history", methods=["GET"])
@requires_auth
def get_chat_history():
    user_id = request.args.get("userId")
    page_uuid = request.args.get("pageUuid")
    
    print(f"Received chat history request - userId: {user_id}, pageUuid: {page_uuid}")

    if not all([user_id, page_uuid]):
        print("Missing required fields")
        return jsonify({"error": "Missing required fields"}), 400

    try:
        messages = get_chat_messages_by_page(user_id, page_uuid)
        print(f"Retrieved {len(messages)} messages")
        return jsonify({"messages": messages})
    except Exception as e:
        print(f"Error getting chat history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/save-message", methods=["POST"])
@requires_auth
def save_message():
    data = request.json
    user_id = data.get("userId")
    message_id = data.get("messageId")
    content = data.get("content")
    message_type = data.get("type")
    page_uuid = data.get("pageUuid")

    if not all([user_id, message_id, content, message_type, page_uuid]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        print(f"Saving message: {data}")  # Debug log
        saved_message = save_chat_message(
            user_id=user_id,
            message_id=message_id,
            content=content,
            message_type=message_type,
            page_uuid=page_uuid
        )
        return jsonify(saved_message)
    except Exception as e:
        print(f"Error in save_message: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/delete-page", methods=["DELETE"])
@requires_auth
def delete_page():
    user_id = request.args.get("userId")
    page_uuid = request.args.get("pageUuid")

    if not all([user_id, page_uuid]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        delete_chat_page(user_id, page_uuid)
        total_pages = get_total_pages(user_id)
        return jsonify({
            "message": "Page deleted successfully",
            "totalPages": total_pages
        })
    except Exception as e:
        print(f"Error deleting page: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/all-chat-histories", methods=["POST"])
@requires_auth
def get_all_histories():
    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        histories = get_all_chat_histories(user_id)
        return jsonify({"histories": histories})
    except Exception as e:
        print(f"Error getting all chat histories: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/get-github-token", methods=["POST"])
@requires_auth
def github_token_route():
    return get_github_token_route()

@app.route("/extract-repo-functions", methods=["POST"])
@requires_auth
def extract_functions_route():
    return extract_repo_functions()

@app.route("/api/protected-resource", methods=["GET"])
@requires_auth
def protected_resource():
    """A protected endpoint that requires valid Clerk authentication"""
    return jsonify({
        "message": "You have successfully accessed the protected resource",
        "user": request.user
    }), 200

if __name__ == "__main__":
    nest_asyncio.apply()
    try:
        app.run(debug=True, port=8000)
    finally:
        token_scheduler.stop()
