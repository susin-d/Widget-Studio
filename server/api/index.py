"""Vercel entrypoint for the FastAPI backend.

The Vercel project root is ``server/``. This import supports both the
Vercel top-level ``main`` module and local package imports from the repository
root.
"""

try:
    from server.main import app
except ModuleNotFoundError:
    from main import app

__all__ = ["app"]
