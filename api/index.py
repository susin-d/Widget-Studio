"""Vercel entrypoint for the FastAPI application.

Vercel discovers an ASGI app exposed as ``app`` from this module and serves it
under the ``/api`` function path. The application keeps its explicit ``/api``
route prefixes so local Uvicorn and Vercel use the same URLs.
"""

from server.main import app

__all__ = ["app"]
