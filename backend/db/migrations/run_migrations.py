import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from db.sqlalchemy_orm import Base, User, ChatMessage

def run_migration():
    # Get database URL from environment variable
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")

    # Create engine
    engine = create_engine(DATABASE_URL)

    try:
        # Create all tables based on the models
        Base.metadata.drop_all(engine)  # Drop existing tables
        Base.metadata.create_all(engine)  # Create new tables
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
