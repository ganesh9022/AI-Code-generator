from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
db = create_engine(DATABASE_URL, echo=True)

Session = sessionmaker(bind=db)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    email = Column(String)
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"


def main() -> None:
    Base.metadata.create_all(db)
    user = User(username="test", email="test@email.com")

    with Session() as session:
        session.add(user)
        session.commit()
        print(session.query(User).all())


if __name__ == "__main__":
    main()
