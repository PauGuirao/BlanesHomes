from jose import jwt, JWTError
from fastapi import Header, HTTPException
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client, Client
import os

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"  # Supabase usa HMAC SHA256 por defecto

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], audience="authenticated")
        return payload  # Aquí tienes datos como 'sub', 'email', etc.
    except JWTError as e:
        print(e)
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
