from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from server.config import settings

# If DATABASE_URL starts with postgresql+asyncpg or sqlite+aiosqlite, convert it to synchronous
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql").replace("sqlite+aiosqlite", "sqlite")

engine = create_engine(db_url, echo=True)

session_maker = sessionmaker(
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    session = session_maker()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
