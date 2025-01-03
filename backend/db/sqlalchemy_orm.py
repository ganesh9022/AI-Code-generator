from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from flask import jsonify
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
db = create_engine(DATABASE_URL, echo=True)

Session = sessionmaker(bind=db)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, autoincrement=True)
    user_id = Column(String)
    username = Column(String)
    email = Column(String, primary_key=True)
    def __repr__(self) -> str:
        return f"<User(id={self.id}, user_id={self.user_id}, username={self.username}, email={self.email})>"


def get_user_details(user_id, userName, email) :
    Base.metadata.create_all(db)
    if not userName or not email or not user_id:
        return jsonify({"error": "Missing required fields"}), 400

    with Session() as session:
        existing_user = session.query(User).filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": f"User with the email {email} already exists"}), 400

        user = User(username=userName, user_id=user_id, email=email)
        session.add(user)
        session.commit()
        return jsonify({
            "message": "User saved successfully!",
            "user": {
                "user.id": user.user_id,
                "username": user.username,
                "email": user.email,
            }
        }), 200
