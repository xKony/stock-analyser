import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from database.supabase_client import SupabaseClient
from config import SUPABASE_URL, SUPABASE_KEY

def check():
    print(f"Checking Supabase connection to: {SUPABASE_URL}")
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL or SUPABASE_KEY is missing!")
        return

    try:
        db = SupabaseClient()
        print("Supabase client initialized.")
        
        # Test a simple query
        print("Testing simple query on 'assets' table...")
        res = db.client.table("assets").select("count", count="exact").limit(1).execute()
        print(f"Assets count: {res.count}")
        
        # Test the RPC
        print("Testing RPC 'get_dashboard_stats'...")
        rpc_res = db.client.rpc("get_dashboard_stats").execute()
        print(f"RPC Response: {rpc_res.data}")
        
    except Exception as e:
        print(f"Exception occurred: {e}")

if __name__ == "__main__":
    check()
