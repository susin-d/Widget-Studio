from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import secrets
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
import httpx
import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.future import select

try:
    from server.config import settings
    from server.database import engine, Base, get_db
    from server.models import User, Layout
    from server.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, LayoutSyncRequest, LayoutSyncResponse, ChatRequest, ChatResponse
    from server.auth import hash_password, verify_password, create_access_token, get_current_user
    from server.ai import complete_chat
except ModuleNotFoundError:
    from config import settings
    from database import engine, Base, get_db
    from models import User, Layout
    from schemas import UserCreate, UserLogin, UserResponse, TokenResponse, LayoutSyncRequest, LayoutSyncResponse, ChatRequest, ChatResponse
    from auth import hash_password, verify_password, create_access_token, get_current_user
    from ai import complete_chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema creation is opt-in. Vercel functions can cold-start concurrently,
    # so production schema changes should be applied by a migration or a one-off
    # database job rather than on every function startup.
    if settings.AUTO_CREATE_SCHEMA:
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Desktop Widgets Sync API",
    description="Backend API for sync, login, and Google OAuth.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
@app.get("/health", include_in_schema=False)
@app.get("/api/health", include_in_schema=False)
def health_check():
    return {"status": "ok"}


def _append_query_params(url: str, params: dict[str, str]) -> str:
    """Add OAuth parameters before a URL fragment such as ``#auth``."""
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update(params)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(payload: UserCreate, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    hashed_pwd = hash_password(payload.password)
    user = User(email=payload.email, password_hash=hashed_pwd)
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=access_token, email=user.email)

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    result = db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=access_token, email=user.email)

@app.get("/api/auth/google")
def google_login(client: str = "desktop"):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client ID is not configured on the backend."
        )
    if client not in {"desktop", "web"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth client.")

    oauth_state = create_access_token(
        data={"oauth_client": client, "nonce": secrets.token_urlsafe(16)},
        expires_delta=timedelta(minutes=10),
    )
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": oauth_state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)

@app.get("/api/auth/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth configuration is incomplete."
        )

    try:
        state_payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        oauth_client = state_payload.get("oauth_client")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OAuth state.")
    if oauth_client not in {"desktop", "web"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth client.")

    async with httpx.AsyncClient() as client:
        # Exchange authorization code for token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        token_res = await client.post(token_url, data=token_data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange OAuth code with Google.")
        
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # Fetch profile info
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        user_info_res = await client.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user profile from Google.")

        user_info = user_info_res.json()
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google response did not include email address.")

        # Create user if they do not exist
        result = db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            user = User(email=email)
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create session token
        jwt_token = create_access_token(data={"sub": email})
        redirect_target = settings.WEB_AUTH_REDIRECT_URI if oauth_client == "web" else settings.DEEP_LINK_REDIRECT
        redirect_url = _append_query_params(
            redirect_target,
            {"token": jwt_token, "email": email},
        )

        # Serve a modern web page that auto-opens the custom protocol link
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Logged In Successfully</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #090a0f;
                    color: #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 16px;
                }}
                .card {{
                    background: rgba(30, 41, 59, 0.4);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 400px;
                    width: 100%;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                }}
                .logo-ring {{
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ff4f87, #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    font-size: 24px;
                }}
                h1 {{
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    background: linear-gradient(to right, #ffffff, #cbd5e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }}
                p {{
                    color: #94a3b8;
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 0 0 28px 0;
                }}
                .button {{
                    background: linear-gradient(135deg, #ff4f87, #8b5cf6);
                    color: #ffffff;
                    padding: 12px 24px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    display: block;
                    transition: transform 0.2s, opacity 0.2s;
                    box-shadow: 0 4px 12px rgba(255, 79, 135, 0.3);
                }}
                .button:hover {{
                    transform: translateY(-1px);
                    opacity: 0.95;
                }}
            </style>
            <script>
                window.onload = function() {{
                    setTimeout(function() {{
                        window.location.replace("{redirect_url}");
                        setTimeout(function(){{ window.close(); }}, 700);
                    }}, 500);
                }}
            </script>
        </head>
        <body>
            <div class="card">
                <div class="logo-ring">🔑</div>
                <h1>Sign-in Complete</h1>
                <p>You have authenticated successfully. Redirecting you back to Widget Studio...</p>
                <a href="{redirect_url}" class="button">Open Widget Studio</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)

@app.get("/api/sync/layout", response_model=LayoutSyncResponse)
async def get_layout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.execute(select(Layout).where(Layout.user_id == user.id))
    layout = result.scalars().first()
    if not layout:
        # Initialize an empty layout structure
        layout = Layout(user_id=user.id, widgets=[], settings={})
        db.add(layout)
        db.commit()
        db.refresh(layout)
    return layout

@app.put("/api/sync/layout", response_model=LayoutSyncResponse)
async def update_layout(
    payload: LayoutSyncRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(select(Layout).where(Layout.user_id == user.id))
    layout = result.scalars().first()
    if not layout:
        layout = Layout(user_id=user.id)
        db.add(layout)
    elif payload.updated_at and layout.updated_at:
        current_updated_at = layout.updated_at
        requested_updated_at = payload.updated_at
        if current_updated_at.tzinfo is None:
            current_updated_at = current_updated_at.replace(tzinfo=timezone.utc)
        if requested_updated_at.tzinfo is None:
            requested_updated_at = requested_updated_at.replace(tzinfo=timezone.utc)
        if abs((current_updated_at - requested_updated_at).total_seconds()) > 0.001:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Layout changed on another device. Reload the cloud layout before saving again.",
            )
    
    layout.widgets = payload.widgets
    layout.settings = payload.settings
    db.commit()
    db.refresh(layout)
    return layout

@app.post("/api/chatbot/chat", response_model=ChatResponse)
async def chatbot_chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user)
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chat is not configured. Set OPENAI_API_KEY on the backend.",
        )

    try:
        return ChatResponse(reply=await complete_chat(payload))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider request failed: {str(e)}"
        )
