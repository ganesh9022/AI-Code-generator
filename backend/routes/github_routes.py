from constants import RequestStatus
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
        return jsonify({"status": RequestStatus.FAILED}), 400   

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
            return jsonify({"status": RequestStatus.FAILED}), 400

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
                "status": RequestStatus.SUCCESS,
                "expires_at": token_info["token"]["expires_at"]
            }), 200
        
        logger.error(f"Failed to save GitHub token: {save_result[1]}")
        return jsonify({"status": RequestStatus.FAILED}), save_result[1]
            
    except ValueError as e:
        logger.error(f"Invalid code format: {str(e)}")
        return jsonify({"status": RequestStatus.FAILED}), 400
    except requests.exceptions.RequestException as e:
        logger.error(f"GitHub API request failed: {str(e)}", exc_info=True)
        return jsonify({"status": RequestStatus.FAILED}), 500

def extract_repo_functions():
    """Handle repository function extraction"""
    data = request.get_json()
    repo_url = data.get("repo_url")
    email = data.get("email")
    enable_contextual = data.get("enable_contextual")
    if not repo_url or not email:
        logger.warning("Missing required fields for repo extraction")
        return jsonify({"status": RequestStatus.FAILED}), 400
        
    try:
        logger.info(f"Starting repository function extraction for {repo_url}")
        # Get token from database
        token_obj = get_github_token(email)
        
        if not token_obj:
            logger.error(f"No valid token found for email: {email}")
            return jsonify({"status": RequestStatus.FAILED, "message": "No valid token found"}), 401
            
        # Decrypt the token
        try:
            access_token = decrypt_token(token_obj.access_token)
            logger.info("Successfully decrypted GitHub token")
        except Exception as e:
            logger.error(f"Token decryption failed: {str(e)}")
            return jsonify({"status": RequestStatus.FAILED, "message": "Token decryption failed"}), 401
        
        # Initialize function extractor
        extractor = FunctionExtractor(repo_url, access_token)
        
        if extractor.fetch_repository():
            # Save functions to JSON for ML model
            saved_files = extractor.save_functions_to_database()
            
            logger.info(f"Successfully extracted and saved {saved_files} functions to database")
            if enable_contextual:
                # Get functions as documents and store embeddings directly
                from groqclould.contextual_response import rag_manager
                import asyncio
                
                documents = extractor.get_functions_as_documents()
                if documents:
                    logger.info(f"Extracted {len(documents)} functions from repository")
                    success = asyncio.run(rag_manager.process_documents(documents))
                    if not success:
                        logger.warning("Failed to store function embeddings")
                        return jsonify({
                            "status": RequestStatus.PARTIAL_SUCCESS,
                            "message": "Functions extracted but embeddings creation failed"
                        }), 200
                else:
                    logger.warning("No functions found in repository")
                    return jsonify({
                        "status": RequestStatus.FAILED,
                        "message": "No functions found in repository"
                    }), 400

            logger.info("Successfully extracted and saved repository functions")
            return jsonify({"status": RequestStatus.SUCCESS}), 200
        else:
            logger.error(f"Failed to fetch repository: {repo_url}")
            return jsonify({"status": RequestStatus.FAILED, "message": "Failed to fetch repository"}), 400
            
    except Exception as e:
        logger.error(f"Repository function extraction failed: {str(e)}", exc_info=True)
        return jsonify({"status": RequestStatus.FAILED, "message": str(e)}), 500 
