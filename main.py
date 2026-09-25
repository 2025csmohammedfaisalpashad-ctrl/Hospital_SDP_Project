# ============================================================
# HOSPITAL SUPPORT REQUEST SYSTEM — MAIN APP
# ============================================================
# There is exactly ONE FastAPI() instance in the whole project.
# Every role is a router included into this single app.
#
# Run with:  uvicorn main:app --reload

from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import admin_routes
import auth_routes
import engineer_routes
import staff_routes
import teamlead_routes
from auth import hash_password
from constants import ROLE_ADMIN, ROLE_DEPARTMENT_STAFF, ROLE_SUPPORT_ENGINEER, ROLE_TEAM_LEAD
from database import category_collection, department_collection, request_collection, user_collection

app = FastAPI(
    title="Hospital Support Request System",
    description="Login -> role-specific dashboard: Staff -> Support Engineer -> Team Lead -> Admin",
    version="2.0.0",
)

# Without this, the browser blocks every request coming from the React
# dev server (localhost:5173) because it's a different origin/port than
# this API (localhost:8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(staff_routes.router)
app.include_router(engineer_routes.router)
app.include_router(teamlead_routes.router)
app.include_router(admin_routes.router)


@app.get("/")
def home():
    return {"message": "Hospital Support Request System", "status": "running"}


# ------------------------------------------------------------
# Sample / demo data
# ------------------------------------------------------------
# Demo login credentials (change these before any real deployment):
#   admin    / Admin@123     -> ADMIN
#   teamlead / Teamlead@123  -> TEAM_LEAD
#   engineer / Engineer@123  -> SUPPORT_ENGINEER (Arun Kumar, Equipment dept)
#   vijay    / Vijay@123     -> SUPPORT_ENGINEER (Vijay Kumar, IT dept)
#   staff    / Staff@123     -> DEPARTMENT_STAFF (Nursing dept)
#
# Each demo user is written with update_one(..., upsert=True), so:
#   - re-running the server never creates duplicates
#   - if a user already exists from before this upgrade (no password_hash
#     yet), it gets patched with one instead of being skipped
def _seed_user(user_id, name, username, password, role, department):
    user_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "name": name,
                "username": username,
                "password_hash": hash_password(password),
                "role": role,
                "department": department,
            }
        },
        upsert=True,
    )


def initialize_sample_data():

    _seed_user("ADM001", "System Admin", "admin", "Admin@123", ROLE_ADMIN, "Administration")
    _seed_user("TL001", "Team Lead", "teamlead", "Teamlead@123", ROLE_TEAM_LEAD, "Hospital Support")
    _seed_user("ENG205", "Arun Kumar", "engineer", "Engineer@123", ROLE_SUPPORT_ENGINEER, "Equipment")
    _seed_user("ENG210", "Vijay Kumar", "vijay", "Vijay@123", ROLE_SUPPORT_ENGINEER, "IT")
    _seed_user("STF001", "Department Staff", "staff", "Staff@123", ROLE_DEPARTMENT_STAFF, "Nursing")

    if department_collection.find_one({"name": "Nursing"}) is None:
        department_collection.insert_one(
            {"name": "Nursing", "description": "Nursing department", "created_at": datetime.utcnow()}
        )

    if category_collection.find_one({"name": "EQUIPMENT_ISSUE"}) is None:
        category_collection.insert_one(
            {
                "name": "EQUIPMENT_ISSUE",
                "description": "Issues related to hospital equipment",
                "created_at": datetime.utcnow(),
            }
        )

    if request_collection.find_one({"request_id": "REQ101"}) is None:
        request_collection.insert_one(
            {
                "request_id": "REQ101",
                "title": "Ventilator is not working",
                "description": "Ventilator is not working",
                "category": "EQUIPMENT_ISSUE",
                "department": "Nursing",
                "priority": "HIGH",
                "status": "NEW",
                "assigned_to": None,
                "assigned_by": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )


initialize_sample_data()