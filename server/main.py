from contextlib import asynccontextmanager
from datetime import timedelta
from urllib.parse import urlencode
import httpx
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.future import select

from server.config import settings
from server.database import engine, Base, get_db
from server.models import User, Layout
from server.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, LayoutSyncRequest, LayoutSyncResponse, ChatRequest, ChatResponse
from server.auth import hash_password, verify_password, create_access_token, get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create database tables on startup
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
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client ID is not configured on the backend."
        )
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)

@app.get("/api/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth configuration is incomplete."
        )

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
        redirect_url = f"{settings.DEEP_LINK_REDIRECT}?token={jwt_token}&email={email}"

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
                        window.location.href = "{redirect_url}";
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
    
    layout.widgets = payload.widgets
    layout.settings = payload.settings
    db.commit()
    db.refresh(layout)
    return layout

@app.post("/api/chatbot/chat", response_model=ChatResponse)
def chatbot_chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user)
):
    if not settings.OPENAI_API_KEY:
        # Fallback if OPENAI_API_KEY is not configured
        fallback_responses = {
            "assistant": "Hello! I am your local assistant. To unlock real AI responses, please set the OPENAI_API_KEY in your server's .env file.",
            "motivator": "You are doing amazing! Set your OPENAI_API_KEY on the backend to supercharge this motivator with real AI advice!",
            "joker": "Why do programmers wear glasses? Because they can't C#! Set the OPENAI_API_KEY to hear more real AI jokes!",
            "coder": "Clean code is key. Rubber-duck debug with me by setting your OPENAI_API_KEY in the backend!"
        }
        reply = fallback_responses.get(payload.persona, fallback_responses["assistant"])
        return ChatResponse(reply=reply)

    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL if settings.OPENAI_BASE_URL else None
        )
        
        system_prompts = {
            "assistant": "You are a helpful companion for Widget Studio. Help the user manage clocks, weather, and notes widgets.",
            "motivator": "You are a high-energy motivational assistant. Help the user get stuff done!",
            "joker": "You are a developer joker. Respond with coding jokes or developer humor.",
            "coder": "You are a coding partner. Help the user write clean, optimized code and resolve bugs."
        }
        system_message = system_prompts.get(payload.persona, system_prompts["assistant"])
        
        messages = [{"role": "system", "content": system_message}]
        for msg in payload.messages:
            role = "assistant" if msg.role == "assistant" else "user"
            messages.append({"role": role, "content": msg.text})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=250
        )
        
        reply = response.choices[0].message.content.strip()
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI completion failed: {str(e)}"
        )
