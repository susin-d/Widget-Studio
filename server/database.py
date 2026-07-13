from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
try:
    from server.config import settings
except ModuleNotFoundError:
    from config import settings

# If DATABASE_URL starts with postgresql+asyncpg or sqlite+aiosqlite, convert it to synchronous
# SQLAlchemy drivers because the current dependencies use sync sessions inside FastAPI
# dependencies. A small pool is important for serverless instances, where many warm
# function instances may exist at the same time.
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql").replace("sqlite+aiosqlite", "sqlite")

engine_options = {
    "echo": False,
    "pool_pre_ping": True,
}

if db_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update({
        "pool_size": 1,
        "max_overflow": 0,
        "pool_recycle": 300,
    })

engine = create_engine(db_url, **engine_options)

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
