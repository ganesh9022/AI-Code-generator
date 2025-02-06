import uuid
from sqlalchemy import Column, Integer, String, create_engine, DateTime, inspect, Text, func, JSON, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, scoped_session
from flask import jsonify
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import pytz
import logging
from flask import jsonify
from db.database import Base, engine, SessionLocal
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT, JSONB
# Setup logging
logger = logging.getLogger(__name__)

load_dotenv()

# Default token expiration time (6 hours = 360 minutes)
DEFAULT_TOKEN_EXPIRATION = 360

# Get token expiration time from environment variable if set, otherwise use default
TOKEN_EXPIRATION_MINUTES = DEFAULT_TOKEN_EXPIRATION
if os.getenv("TOKEN_EXPIRATION_MINUTES"):
    try:
        TOKEN_EXPIRATION_MINUTES = int(os.getenv("TOKEN_EXPIRATION_MINUTES"))
        logger.info(f"Using configured token expiration time: {TOKEN_EXPIRATION_MINUTES} minutes")
    except ValueError as e:
        logger.warning(f"Invalid TOKEN_EXPIRATION_MINUTES value, using default of {DEFAULT_TOKEN_EXPIRATION} minutes")
else:
    logger.info(f"No token expiration time configured, using default of {DEFAULT_TOKEN_EXPIRATION} minutes")

DATABASE_URL = os.getenv("DATABASE_URL")

# Configure SQLAlchemy for optimal performance
engine = create_engine(
    DATABASE_URL,
    pool_size=5,  # Reduce pool size
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,  # Recycle connections every 30 minutes
    pool_pre_ping=True  # Enable connection health checks
)

# Create scoped session factory
SessionLocal = scoped_session(
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
)

Base = declarative_base()
ist_timezone = pytz.timezone('Asia/Kolkata')

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, unique=True)
    username = Column(String)
    email = Column(String, primary_key=True)
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, user_id={self.user_id}, username={self.username}, email={self.email})>"

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, nullable=False)
    page_uuid = Column(String, nullable=False)
    conversation_id = Column(Integer, nullable=False, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.message_id,
            "content": self.content,
            "type": self.type,
            "pageUuid": self.page_uuid,
            "conversationId": self.conversation_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

class ExtractedFile(Base):
    __tablename__ = 'extracted_files'

    id = Column(Integer, primary_key=True)
    file_name = Column(String(255), nullable=False)
    file_data = Column(JSON, nullable=False)
    repository_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.UTC))

    def __repr__(self):
        return f"<ExtractedFile(id={self.id}, file_name={self.file_name}, repository_url={self.repository_url})>"

class DocumentEmbedding(Base):
    """SQLAlchemy model for storing document embeddings."""
    __tablename__ = "document_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    embedding = Column(ARRAY(FLOAT), nullable=False)
    doc_metadata = Column(JSONB, nullable=True)
    source = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        """String representation of the model."""
        return f"<DocumentEmbedding(id={self.id}, source={self.source})>"

def get_user_details(user_id: str, userName: str, email: str):
    db = SessionLocal()
    try:
        if not all([user_id, userName, email]):
            return jsonify({"error": "Missing required fields"}), 400

        existing_user = db.query(User).filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": f"User with the email {email} already exists"}), 400

        user = User(username=userName, user_id=user_id, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)

        return jsonify({
            "message": "User saved successfully!",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

def get_chat_messages_by_page(user_id: str, page_uuid: str) -> list:
    db = SessionLocal()
    try:
        messages = db.query(ChatMessage)\
            .filter_by(user_id=user_id, page_uuid=page_uuid)\
            .order_by(ChatMessage.timestamp)\
            .all()
        return [message.to_dict() for message in messages]
    finally:
        db.close()

def get_next_conversation_id(db, user_id: str, page_uuid: str) -> int:
    max_conv_id = db.query(func.max(ChatMessage.conversation_id))\
        .filter_by(user_id=user_id, page_uuid=page_uuid)\
        .scalar()
    return (max_conv_id or 0) + 1

def save_chat_message(user_id: str, message_id: str, content: str, message_type: str, page_uuid: str = None):
    db = SessionLocal()
    try:
        # Generate new page_uuid if not provided
        if not page_uuid:
            page_uuid = str(uuid.uuid4())

        message = ChatMessage(
            message_id=message_id,
            user_id=user_id,
            content=content,
            type=message_type,
            page_uuid=page_uuid,
            conversation_id=get_next_conversation_id(db, user_id, page_uuid)
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message.to_dict()
    except Exception as e:
        print(f"Error saving message: {str(e)}")
        db.rollback()
        raise e
    finally:
        db.close()

def get_total_pages(user_id: str) -> int:
    db = SessionLocal()
    try:
        total_pages = db.query(func.count(func.distinct(ChatMessage.page_uuid)))\
            .filter_by(user_id=user_id)\
            .scalar()
        return total_pages or 0
    finally:
        db.close()

def delete_chat_page(user_id: str, page_uuid: str):
    db = SessionLocal()
    try:
        # Delete messages with the page_uuid
        db.query(ChatMessage)\
            .filter_by(user_id=user_id, page_uuid=page_uuid)\
            .delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_all_chat_histories(user_id: str) -> dict:
    db = SessionLocal()
    try:
        # Get all messages for the user, ordered by page_uuid and timestamp
        messages = (
            db.query(ChatMessage)
            .filter_by(user_id=user_id)
            .order_by(ChatMessage.page_uuid, ChatMessage.timestamp)
            .all()
        )

        # Group messages by page_uuid
        histories = {}
        for message in messages:
            if message.page_uuid not in histories:
                histories[message.page_uuid] = []
            histories[message.page_uuid].append(message.to_dict())

        return histories
    finally:
        db.close()

class TokenData(Base):
    __tablename__ = "token_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True)
    access_token = Column(String, nullable=True)  # Made nullable to allow keeping user data after token deletion
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(ist_timezone))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(ist_timezone), onupdate=lambda: datetime.now(ist_timezone))
    expires_at = Column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<TokenData(email={self.email})>"

    def is_expired(self) -> bool:
        """Check if token is expired"""
        current_time = datetime.now(ist_timezone)
        return current_time > self.expires_at

def get_user_details(user_id: str, userName: str, email: str) -> tuple:
    """Save user details to database"""
    Base.metadata.create_all(db)
    
    if not userName or not email or not user_id:
        return jsonify({"error": "Missing required fields"}), 400

    with SessionLocal() as session:
        try:
            existing_user = session.query(User).filter_by(email=email).first()
            if existing_user:
                return jsonify({"error": f"User with the email {email} already exists"}), 400

            user = User(username=userName, user_id=user_id, email=email)
            session.add(user)
            session.commit()
            
            return jsonify({
                "message": "User saved successfully!",
                "user": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email
                }
            }), 200
        except Exception as e:
            session.rollback()
            return jsonify({"error": f"Failed to save user: {str(e)}"}), 500

def save_github_token(email: str, access_token: str) -> tuple:
    """Save or update GitHub token"""
    if not email or not access_token:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Create table if it doesn't exist
        inspector = inspect(engine)
        if "token_data" not in inspector.get_table_names():
            TokenData.__table__.create(engine)
    except Exception as e:
        return jsonify({"error": "Database setup failed"}), 500

    with SessionLocal() as session:
        try:
            # Check if token already exists
            existing_token = session.query(TokenData).filter_by(email=email).first()
            current_time = datetime.now(ist_timezone)
            expiration_time = current_time + timedelta(minutes=TOKEN_EXPIRATION_MINUTES)
            
            if existing_token:
                # Update token and timestamps
                existing_token.access_token = access_token
                existing_token.updated_at = current_time
                existing_token.expires_at = expiration_time
                token = existing_token
            else:
                # Create new token
                token = TokenData(
                    email=email,
                    access_token=access_token,
                    created_at=current_time,
                    updated_at=current_time,
                    expires_at=expiration_time
                )
                session.add(token)
            
            session.commit()

            # Schedule token deletion
            from scheduler.token_scheduler import token_scheduler
            token_scheduler.schedule_token_deletion(email, expiration_time)

            return jsonify({
                "message": "Token data saved successfully",
                "token": {
                    "email": email,
                    "created_at": token.created_at.isoformat(),
                    "updated_at": token.updated_at.isoformat(),
                    "expires_at": token.expires_at.isoformat()
                }
            }), 200
            
        except Exception as e:
            session.rollback()
            return jsonify({"error": f"Failed to save token: {str(e)}"}), 500


def get_github_token(email: str) -> TokenData | None:
    """Get GitHub token for a user
    Args:
        email (str): User's email address
    Returns:
        TokenData | None: Token object if found and not expired, None otherwise
    """
    if not email:
        return None

    with SessionLocal() as session:
        try:
            token = session.query(TokenData).filter_by(email=email).first()
            if token:
                current_time = datetime.now(ist_timezone)
                if not token.is_expired():
                    return token
            return None
        except Exception as e:
            return None

# Create all tables
try:
    logger.info("Creating database tables")
    Base.metadata.create_all(engine)
    logger.info("Successfully created database tables")
except Exception as e:
    logger.error(f"Failed to create database tables: {str(e)}", exc_info=True)

def get_db():
    """Get database session with automatic cleanup"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

