import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_caching import Cache
from constants import RequestStatus
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
from langchain.schema import Document
import gc
import resource

# Setup logging with file handler to reduce memory usage
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Set memory limit
def limit_memory():
    soft, hard = resource.getrlimit(resource.RLIMIT_AS)
    # Set soft limit to 450MB (leaving some headroom below 512MB)
    resource.setrlimit(resource.RLIMIT_AS, (450 * 1024 * 1024, hard))

try:
    limit_memory()
except Exception as e:
    logger.warning(f"Could not set memory limit: {e}")

load_dotenv()

app = Flask(__name__)

# Get allowed origins from environment variable, fallback to development URL if not set
CORS_ALLOWED_ORIGIN = os.getenv('CORS_ALLOWED_ORIGIN', 'http://localhost:5173').split(',')

# Configure CORS with specific settings
CORS(app,
     resources={r"/*": {
         "origins": CORS_ALLOWED_ORIGIN,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 86400  # Cache preflight requests for 24 hours
     }})

# Handle OPTIONS requests explicitly
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        # Ensure CORS headers are added to OPTIONS response
        if request.headers.get('Origin') in CORS_ALLOWED_ORIGIN:
            response.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '86400'
        return response

# Initialize database
Base.metadata.create_all(db)

app.config.from_mapping(get_cache_config())
cache = Cache(app)

# Register scheduler shutdown on app exit
atexit.register(token_scheduler.stop)

@app.route("/train-model", methods=["POST"])
@requires_auth
def train_model():
    try:
        uploaded_files = request.files.getlist("files")
        if not uploaded_files:
            return jsonify({
                "message": "No files uploaded",
                "status": RequestStatus.WARNING
            }), 200

        # Process files directly
        from groqclould.contextual_response import rag_manager
        import asyncio

        documents = []
        for file in uploaded_files:
            try:
                content = file.read().decode('utf-8')
                doc = Document(
                    page_content=content,
                    metadata={"source": file.filename}
                )
                documents.append(doc)
                logger.info(f"Processed file: {file.filename}")
            except Exception as e:
                logger.warning(f"Error processing file {file.filename}: {str(e)}")
                continue

        if not documents:
            return jsonify({
                "message": "No valid files could be processed",
                "status": RequestStatus.WARNING
            }), 200

        success = asyncio.run(rag_manager.process_documents(documents))
        
        if success:
            return jsonify({
                "message": "Files processed and embeddings created successfully",
                "status": RequestStatus.SUCCESS
            }), 200
        else:
            return jsonify({
                "message": "No content could be processed from the files",
                "status": RequestStatus.WARNING
            }), 200

    except Exception as e:
        logger.error(f"Error in train_model: {str(e)}")
        return jsonify({
            "message": f"Error processing files: {str(e)}",
            "status": RequestStatus.FAILED
        }), 500

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

@app.route("/chat-history", methods=["GET"])
@requires_auth
def get_chat_history():
    user_id = request.args.get("userId")
    page_uuid = request.args.get("pageUuid")
    
    if not all([user_id, page_uuid]):
        logger.info("Missing required fields")
        return jsonify({"error": "Missing required fields"}), 400

    try:
        messages = get_chat_messages_by_page(user_id, page_uuid)
        return jsonify({"messages": messages})
    except Exception as e:
        logger.info(f"Error getting chat history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/save-message", methods=["POST"])
@requires_auth
def save_message():
    data = request.json
    user_id = request.user['sub']  # Get user ID from JWT token
    message_id = data.get("messageId")
    content = data.get("content")
    message_type = data.get("type")
    page_uuid = data.get("pageUuid")

    if not all([message_id, content, message_type, page_uuid]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        saved_message = save_chat_message(
            user_id=user_id,
            message_id=message_id,
            content=content,
            message_type=message_type,
            page_uuid=page_uuid
        )
        return jsonify(saved_message)
    except Exception as e:
        logger.info(f"Error in save_message: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/delete-page", methods=["DELETE"])
@requires_auth
def delete_page():
    user_id = request.user['sub']  # Get user ID from JWT token
    page_uuid = request.args.get("pageUuid")

    if not page_uuid:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        delete_chat_page(user_id, page_uuid)
        total_pages = get_total_pages(user_id)
        return jsonify({
            "message": "Page deleted successfully",
            "totalPages": total_pages
        })
    except Exception as e:
        logger.info(f"Error deleting page: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/all-chat-histories", methods=["POST"])
@requires_auth
def get_all_histories():
    user_id = request.user['sub']  # Get user ID from JWT token

    try:
        histories = get_all_chat_histories(user_id)
        return jsonify({"histories": histories})
    except Exception as e:
        logger.info(f"Error getting all chat histories: {str(e)}")
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

@app.after_request
def cleanup(response):
    """Clean up resources after each request"""
    gc.collect()
    return response

if __name__ == "__main__":
    nest_asyncio.apply()
    try:
        port = int(os.environ.get("PORT", 10000))
        app.run(host="0.0.0.0", port=port, debug=False)  # Disable debug mode in production
    finally:
        token_scheduler.stop()
