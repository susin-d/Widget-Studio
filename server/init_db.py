"""Create the SQLAlchemy schema once for a configured database.

Run this as a one-off job against the external PostgreSQL database used by the
Vercel deployment. It is intentionally separate from FastAPI startup so
serverless cold starts never compete to create tables.
"""

from server.database import Base, engine
from server import models  # noqa: F401  Ensures all model tables are registered.


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Widget Studio database schema is ready.")


if __name__ == "__main__":
    main()
