# Widget Studio Backend API

A FastAPI backend for Widget Studio, supporting signup, login, Google OAuth, and cloud-synchronized widget layouts.

## Setup Instructions

### 1. Prerequisites
Ensure you have Python 3.9+ and PostgreSQL installed.

### 2. Create Virtual Environment
In the `server` directory, create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
Install all package requirements:

```powershell
pip install -r requirements.txt
```

### 4. Database Setup & Configuration
Create a PostgreSQL database named `widgets` (or modify your connection string).
Create a `.env` file in the `server` directory to configure environment variables:

```env
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/widgets

# Secret key for JWT generation
SECRET_KEY=generate-a-secure-random-secret-key-for-jwt

# Google OAuth Credentials (obtain from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### 5. Running the Server
Launch the server using uvicorn:

```powershell
python -m uvicorn server.main:app --reload --port 8000
```

The API docs will be interactive and accessible at [http://localhost:8000/docs](http://localhost:8000/docs).
