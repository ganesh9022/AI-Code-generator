from datetime import datetime, timedelta
import threading
import time
from typing import Dict
import os
from db.sqlalchemy_orm import SessionLocal, TokenData
import requests
from helpers.encryption_helper import decrypt_token
import base64
from requests.auth import HTTPBasicAuth
import pytz
import logging

# Setup logging
logger = logging.getLogger(__name__)

class TokenScheduler:
    def __init__(self):
        self.scheduled_tokens: Dict[str, threading.Timer] = {}
        self.lock = threading.Lock()
        self.ist_timezone = pytz.timezone('Asia/Kolkata')
        logger.info("Initializing TokenScheduler")
        self.initialize_from_db()
    
    def initialize_from_db(self):
        """Initialize scheduler with existing non-expired tokens from database and handle expired ones"""
        db = SessionLocal()
        try:
            current_time = datetime.now(self.ist_timezone)
            
            # Handle expired tokens first
            expired_tokens = db.query(TokenData).filter(
                TokenData.expires_at <= current_time,
                TokenData.access_token.isnot(None)
            ).all()
            
            # Immediately process expired tokens
            for token in expired_tokens:
                self._process_token_deletion(token.email)
            
            if expired_tokens:
                logger.info(f"Processed {len(expired_tokens)} expired tokens on startup")
            
            # Schedule future deletions for non-expired tokens
            active_tokens = db.query(TokenData).filter(
                TokenData.expires_at > current_time,
                TokenData.access_token.isnot(None)
            ).all()
            
            # Schedule deletion for each valid token
            for token in active_tokens:
                self.schedule_token_deletion(token.email, token.expires_at)
            
            if active_tokens:
                logger.info(f"Initialized {len(active_tokens)} active tokens for scheduled deletion")
                
        except Exception as e:
            logger.error(f"Error initializing tokens from database: {str(e)}", exc_info=True)
        finally:
            db.close()

    def schedule_token_deletion(self, email: str, deletion_time: datetime):
        """Schedule a token for deletion at specific time"""
        with self.lock:
            # Cancel existing timer if any
            if email in self.scheduled_tokens:
                self.scheduled_tokens[email].cancel()
                logger.debug(f"Cancelled existing deletion timer for {email}")
            
            # Ensure deletion_time is in IST timezone
            if deletion_time.tzinfo is None:
                deletion_time = self.ist_timezone.localize(deletion_time)
            elif deletion_time.tzinfo != self.ist_timezone:
                deletion_time = deletion_time.astimezone(self.ist_timezone)
            
            # Calculate delay in seconds using IST timezone
            now = datetime.now(self.ist_timezone)
            delay = (deletion_time - now).total_seconds()
            if delay < 0:
                delay = 0
            
            # Create and start timer
            timer = threading.Timer(delay, self._process_token_deletion, args=[email])
            timer.daemon = True
            self.scheduled_tokens[email] = timer
            timer.start()
            logger.info(f"Scheduled token deletion for {email} at {deletion_time} IST")

    def delete_github_token(self, access_token: str) -> bool:
        """Delete token from GitHub"""
        try:
            client_id = os.getenv("OAUTH_APP_CLIENT_ID")
            client_secret = os.getenv("OAUTH_APP_CLIENT_SECRET")
            url = f"https://api.github.com/applications/{client_id}/token"
            
            headers = {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
            
            data = {"access_token": access_token}
            response = requests.delete(
                url,
                headers=headers,
                json=data,
                auth=HTTPBasicAuth(client_id, client_secret)
            )
            if response.status_code in [204, 422]:
                logger.info("Successfully deleted GitHub token")
                return True
            logger.warning(f"Failed to delete GitHub token. Status code: {response.status_code}")
            return False
        except Exception as e:
            logger.error(f"Error deleting GitHub token: {str(e)}", exc_info=True)
            return False

    def _process_token_deletion(self, email: str):
        """Process single token deletion"""
        db = SessionLocal()
        try:
            # Get token from database
            token = db.query(TokenData).filter_by(email=email).first()
            if token and token.access_token:
                logger.info(f"Processing token deletion for {email}")
                # Decrypt and delete from GitHub
                decrypted_token = decrypt_token(token.access_token)
                if self.delete_github_token(decrypted_token):
                    # Clear the token but keep the record
                    token.access_token = None
                    db.commit()
                    logger.info(f"Successfully cleared token for {email} from database")
                else:
                    logger.error(f"Failed to delete GitHub token for {email}")
            
            # Remove timer from scheduled tokens
            with self.lock:
                self.scheduled_tokens.pop(email, None)
            
        except Exception as e:
            logger.error(f"Error processing token deletion for {email}: {str(e)}", exc_info=True)
        finally:
            db.close()

    def stop(self):
        """Stop all scheduled token deletions"""
        with self.lock:
            for timer in self.scheduled_tokens.values():
                timer.cancel()
            self.scheduled_tokens.clear()
            logger.info("Token scheduler stopped")

# Create singleton instance
token_scheduler = TokenScheduler() 
