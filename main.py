# ============================================================
# HOSPITAL SUPPORT REQUEST SYSTEM — MAIN APP
# ============================================================
# There is exactly ONE FastAPI() instance in the whole project.
# The original code created three separate `app = FastAPI(...)`
# objects across the pasted-together files; each reassignment
# effectively orphaned the routes that had already been attached
# to the previous object, so most of the staff/engineer endpoints
# never actually mounted. Every role here is a router included
# into this single app instead.
#
# Run with:  uvicorn main:app --reload

from datetime import datetime

from fastapi import FastAPI

import admin_routes
import engineer_routes
import staff_routes
import teamlead_routes
from constants import ROLE_SUPPORT_ENGINEER, ROLE_TEAM_LEAD
from database import category_collection, department_collection, request_collection, user_collection

app = FastAPI(
    title="Hospital Support Request System",
    description="Staff -> Support Engineer -> Team Lead -> Admin escalation workflow",
    version="1.0.0",
)

app.include_router(staff_routes.router)
app.include_router(engineer_routes.router)
app.include_router(teamlead_routes.router)
app.include_router(admin_routes.router)


@app.get("/")
def home():
    return {"message": "Hospital Support Request System", "status": "running"}


# ------------------------------------------------------------
# Sample data
# ------------------------------------------------------------
def initialize_sample_data():

    if user_collection.find_one({"user_id": "ENG205"}) is None:
        user_collection.insert_one(
            {
                "user_id": "ENG205",
                "name": "Arun Kumar",
                "username": "arun",
                "role": ROLE_SUPPORT_ENGINEER,
                "department": "Equipment",
            }
        )

    if user_collection.find_one({"user_id": "ENG210"}) is None:
        user_collection.insert_one(
            {
                "user_id": "ENG210",
                "name": "Vijay Kumar",
                "username": "vijay",
                "role": ROLE_SUPPORT_ENGINEER,
                "department": "IT",
            }
        )

    if user_collection.find_one({"user_id": "TL001"}) is None:
        user_collection.insert_one(
            {
                "user_id": "TL001",
                "name": "Team Lead",
                "username": "teamlead",
                "role": ROLE_TEAM_LEAD,
                "department": "Hospital Support",
            }
        )

    # The original sample request pointed at a "Nursing" department and an
    # "EQUIPMENT_ISSUE" category that were never actually created anywhere —
    # so staff's own department/category checks would have rejected any
    # real request to either of them. Seeded here so the system is usable
    # out of the box.
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
