from flask import jsonify, request
import requests
from db.sqlalchemy_orm import get_github_token
from helpers.encryption_helper import encrypt_token, decrypt_token
from helpers.request_helper import decode_code
from multi_layer_operation_predictor.extract_functions_from_repo import FunctionExtractor
import os
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Load GitHub OAuth credentials
GITHUB_CLIENT_ID = os.getenv("OAUTH_APP_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("OAUTH_APP_CLIENT_SECRET")

def get_github_token_route():
    """Handle GitHub OAuth token generation"""
    encoded_code = request.json.get("code")
    email = request.json.get("email")
    
    if not encoded_code or not email:
        logger.warning("Missing required fields for GitHub token request")
        return jsonify({"status": "FAILED"}), 400

    try:
        code = decode_code(encoded_code)
        
        token_url = "https://github.com/login/oauth/access_token"
        payload = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        }
        headers = {"Accept": "application/json"}

        # Get access token
        logger.info("Requesting GitHub access token")
        response = requests.post(token_url, json=payload, headers=headers)
        response.raise_for_status()
        token_data = response.json()

        if "access_token" not in token_data:
            logger.error("GitHub token response missing access_token")
            return jsonify({"status": "FAILED"}), 400

        # Encrypt the access token before saving
        encrypted_token = encrypt_token(token_data["access_token"])
        logger.info("Successfully encrypted GitHub token")

        # Save encrypted token to database and get the response
        from db.sqlalchemy_orm import save_github_token
        save_result = save_github_token(email, encrypted_token)
        
        if save_result[1] == 200:
            token_info = save_result[0].get_json()
            logger.info(f"Successfully saved GitHub token for {email}")
            return jsonify({
                "status": "SUCCESS",
                "expires_at": token_info["token"]["expires_at"]
            }), 200
        
        logger.error(f"Failed to save GitHub token: {save_result[1]}")
        return jsonify({"status": "FAILED"}), save_result[1]
            
    except ValueError as e:
        logger.error(f"Invalid code format: {str(e)}")
        return jsonify({"status": "FAILED"}), 400
    except requests.exceptions.RequestException as e:
        logger.error(f"GitHub API request failed: {str(e)}", exc_info=True)
        return jsonify({"status": "FAILED"}), 500

def extract_repo_functions():
    """Handle repository function extraction"""
    data = request.get_json()
    repo_url = data.get("repo_url")
    email = data.get("email")
    
    if not repo_url or not email:
        logger.warning("Missing required fields for repo extraction")
        return jsonify({"status": "FAILED"}), 400
        
    try:
        logger.info(f"Starting repository function extraction for {repo_url}")
        # Get token from database
        token_obj = get_github_token(email)
        
        if not token_obj:
            logger.error(f"No valid token found for email: {email}")
            return jsonify({"status": "FAILED", "message": "No valid token found"}), 401
            
        # Decrypt the token
        try:
            access_token = decrypt_token(token_obj.access_token)
            logger.info("Successfully decrypted GitHub token")
        except Exception as e:
            logger.error(f"Token decryption failed: {str(e)}")
            return jsonify({"status": "FAILED", "message": "Token decryption failed"}), 401
        
        # Initialize function extractor
        extractor = FunctionExtractor(repo_url, access_token)
        
        # Fetch and process repository
        logger.info(f"Fetching repository: {repo_url}")
        if extractor.fetch_repository():
            saved_files = extractor.save_functions_to_json()
            logger.info("Successfully extracted and saved repository functions")
            return jsonify({"status": "SUCCESS"}), 200
        else:
            logger.error(f"Failed to fetch repository: {repo_url}")
            return jsonify({"status": "FAILED", "message": "Failed to fetch repository"}), 400
            
    except Exception as e:
        logger.error(f"Repository function extraction failed: {str(e)}", exc_info=True)
        return jsonify({"status": "FAILED", "message": str(e)}), 500 
