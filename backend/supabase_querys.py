from supabase import create_client, Client
import os
from dotenv import load_dotenv
load_dotenv()

# ========== CONEXIÓN A SUPABASE ==========
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_agencia_from_profile(user_id):
    result = supabase.table("profiles").select("agencias(*)").eq("id", user_id).single().execute()
    return result.data["agencias"]

# get profile from user_id
def get_profile_from_user_id(user_id):
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data