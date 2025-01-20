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
    ChatMessage
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

@app.route("/total-pages", methods=["GET"])
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

@app.route("/page-uuids", methods=["GET"])
def get_page_uuids():
    user_id = request.args.get("userId")
    db = SessionLocal()

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Get page UUIDs ordered by the first message timestamp in each page
        page_uuids = db.query(
            ChatMessage.page_uuid,
            func.min(ChatMessage.timestamp).label('first_message_time')
        )\
            .filter_by(user_id=user_id)\
            .group_by(ChatMessage.page_uuid)\
            .order_by('first_message_time')\
            .all()
        
        return jsonify({"pageUuids": [uuid[0] for uuid in page_uuids]})
    except Exception as e:
        print(f"Error getting page UUIDs: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
app.route("/get-github-token", methods=["POST"])(get_github_token_route)
app.route("/extract-repo-functions", methods=["POST"])(extract_repo_functions)

if __name__ == "__main__":
    nest_asyncio.apply()
    try:
        app.run(debug=True, port=8000)
    finally:
        token_scheduler.stop()
