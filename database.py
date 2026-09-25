# ============================================================
# SINGLE SHARED MONGODB CONNECTION
# ============================================================
# The connection string now comes from the MONGO_URL environment
# variable (loaded from a local .env file) instead of being
# hard-coded. This is what lets all 4 laptops point at the SAME
# MongoDB Atlas database instead of each using its own localhost
# MongoDB. Database name and collection names are unchanged.

import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()  # reads .env from the current working directory

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise RuntimeError(
        "MONGO_URL is not set. Create a .env file in the backend folder "
        "(copy .env.example -> .env and fill in your MongoDB Atlas "
        "connection string) before starting the server."
    )

client = MongoClient(MONGO_URL)
db = client["hospital_support"]

user_collection = db["users"]
department_collection = db["departments"]
category_collection = db["categories"]
request_collection = db["requests"]
comments_collection = db["comments"]
audit_collection = db["audit_logs"]