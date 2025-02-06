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
import queue
import signal

# Setup logging
logger = logging.getLogger(__name__)

class TokenScheduler:
    def __init__(self):
        self.ist_timezone = pytz.timezone('Asia/Kolkata')
        self.task_queue = queue.PriorityQueue()
        self.running = True
        self.lock = threading.Lock()
        self.worker_thread = None
        logger.info("Initializing TokenScheduler")
        self._start_worker()
        self.initialize_from_db()
    
    def _start_worker(self):
        """Start the background worker thread"""
        if self.worker_thread is None or not self.worker_thread.is_alive():
            self.worker_thread = threading.Thread(target=self._process_queue)
            self.worker_thread.daemon = True
            self.worker_thread.start()
    
    def _process_queue(self):
        """Process tasks from the queue"""
        while self.running:
            try:
                # Get the next task with a 1-second timeout
                try:
                    priority, task_time, email = self.task_queue.get(timeout=1)
                    current_time = time.time()
                    
                    # If it's not time for this task yet, put it back in the queue
                    if priority > current_time:
                        self.task_queue.put((priority, task_time, email))
                        time.sleep(1)
                        continue
                    
                    # Process the task
                    self._process_token_deletion(email)
                    
                except queue.Empty:
                    continue
                    
            except Exception as e:
                logger.error(f"Error in queue processing: {str(e)}")
                time.sleep(1)
    
    def initialize_from_db(self):
        """Initialize scheduler with existing non-expired tokens from database"""
        db = SessionLocal()
        try:
            current_time = datetime.now(self.ist_timezone)
            
            # Handle expired tokens
            expired_tokens = db.query(TokenData).filter(
                TokenData.expires_at <= current_time,
                TokenData.access_token.isnot(None)
            ).all()
            
            # Schedule expired tokens for immediate deletion
            for token in expired_tokens:
                self.schedule_token_deletion(token.email, current_time)
            
            if expired_tokens:
                logger.info(f"Scheduled {len(expired_tokens)} expired tokens for deletion")
            
            # Schedule future deletions
            active_tokens = db.query(TokenData).filter(
                TokenData.expires_at > current_time,
                TokenData.access_token.isnot(None)
            ).all()
            
            for token in active_tokens:
                self.schedule_token_deletion(token.email, token.expires_at)
            
            if active_tokens:
                logger.info(f"Scheduled {len(active_tokens)} active tokens for future deletion")
                
        except Exception as e:
            logger.error(f"Error initializing from database: {str(e)}", exc_info=True)
        finally:
            db.close()

    def schedule_token_deletion(self, email: str, deletion_time: datetime):
        """Schedule a token for deletion"""
        try:
            # Ensure deletion_time is in IST timezone
            if deletion_time.tzinfo is None:
                deletion_time = self.ist_timezone.localize(deletion_time)
            elif deletion_time.tzinfo != self.ist_timezone:
                deletion_time = deletion_time.astimezone(self.ist_timezone)
            
            # Convert to timestamp for priority queue
            priority = deletion_time.timestamp()
            
            # Add to queue
            self.task_queue.put((priority, deletion_time, email))
            logger.info(f"Scheduled token deletion for {email} at {deletion_time} IST")
            
        except Exception as e:
            logger.error(f"Error scheduling token deletion: {str(e)}")

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
        """Process token deletion"""
        db = SessionLocal()
        try:
            token = db.query(TokenData).filter_by(email=email).first()
            if token and token.access_token:
                logger.info(f"Processing token deletion for {email}")
                decrypted_token = decrypt_token(token.access_token)
                if self.delete_github_token(decrypted_token):
                    token.access_token = None
                    db.commit()
                    logger.info(f"Successfully cleared token for {email} from database")
                else:
                    logger.error(f"Failed to delete GitHub token for {email}")
            
        except Exception as e:
            logger.error(f"Error processing token deletion for {email}: {str(e)}", exc_info=True)
        finally:
            db.close()

    def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping token scheduler")
        self.running = False
        if self.worker_thread and self.worker_thread.is_alive():
            self.worker_thread.join(timeout=5)
        logger.info("Token scheduler stopped")

# Create singleton instance
token_scheduler = TokenScheduler()

# Register signal handlers for graceful shutdown
def handle_shutdown(signum, frame):
    token_scheduler.stop()

signal.signal(signal.SIGTERM, handle_shutdown)
signal.signal(signal.SIGINT, handle_shutdown) 
