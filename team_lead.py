# ============================================================
# HOSPITAL SUPPORT REQUEST SYSTEM
# TEAM LEAD BACKEND
# ============================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime


# ============================================================
# 1. FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Hospital Support Request System",
    description="Backend APIs for Team Lead operations",
    version="1.0.0"
)


# ============================================================
# 2. MONGODB CONNECTION
# ============================================================

MONGO_URL = "mongodb://localhost:27017/"

client = MongoClient(MONGO_URL)

db = client["MyDB"]


# ============================================================
# 3. MONGODB COLLECTIONS
# ============================================================

# Stores hospital support requests
service_request_collection = db["service_requests"]

# Stores all system users
user_collection = db["users"]


# ============================================================
# 4. REQUEST CATEGORIES
# ============================================================

# The hospital support request categories

REQUEST_CATEGORIES = [
    "EQUIPMENT_ISSUE",
    "MAINTENANCE",
    "IT_ISSUE",
    "FACILITY_REQUEST"
]


# ============================================================
# 5. REQUEST STATUS
# ============================================================

REQUEST_STATUS = [
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "RESOLVED",
    "CLOSED"
]


# ============================================================
# 6. PYDANTIC MODELS
# ============================================================

# Used when Team Lead assigns or reassigns
# a request to a support engineer.

class Assignment(BaseModel):
    assigned_to: str


# ============================================================
# 7. BASIC RESPONSE MODEL
# ============================================================

class MessageResponse(BaseModel):
    message: str


# ============================================================
# 8. SERVER TEST ENDPOINT
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Hospital Support Request System - Team Lead Backend",
        "status": "running"
    }

# ============================================================
# 9. GET ALL SUPPORT REQUESTS
# ============================================================

@app.get("/teamlead/requests")
def get_all_requests():

    # Get all requests from MongoDB
    requests = list(
        service_request_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 10. GET ONE SUPPORT REQUEST
# ============================================================

@app.get("/teamlead/requests/{request_id}")
def get_request_by_id(request_id: str):

    # Find request using request_id
    request = service_request_collection.find_one(
        {"request_id": request_id},
        {"_id": 0}
    )

    # If request does not exist
    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )

    return request


# ============================================================
# 11. GET ALL SUPPORT ENGINEERS
# ============================================================

@app.get("/teamlead/engineers")
def get_support_engineers():

    # Find users whose role is support_engineer
    engineers = list(
        user_collection.find(
            {"role": "support_engineer"},
            {
                "_id": 0,
                "password": 0
            }
        )
    )

    return {
        "count": len(engineers),
        "engineers": engineers
    }

# ============================================================
# 12. ASSIGN REQUEST TO SUPPORT ENGINEER
# ============================================================

@app.put("/teamlead/requests/{request_id}/assign")
def assign_request(request_id: str, assignment: Assignment):

    # --------------------------------------------------------
    # Step 1: Check whether the request exists
    # --------------------------------------------------------

    request = service_request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    # --------------------------------------------------------
    # Step 2: Check whether the engineer exists
    # --------------------------------------------------------

    engineer = user_collection.find_one(
        {
            "user_id": assignment.assigned_to,
            "role": "support_engineer"
        }
    )

    if engineer is None:
        raise HTTPException(
            status_code=404,
            detail="Support engineer not found"
        )


    # --------------------------------------------------------
    # Step 3: Check whether request is already assigned
    # --------------------------------------------------------

    if request.get("assigned_to") is not None:

        raise HTTPException(
            status_code=400,
            detail="Request is already assigned. Use reassign API."
        )


    # --------------------------------------------------------
    # Step 4: Assign engineer
    # --------------------------------------------------------

    result = service_request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.assigned_to,
                "assigned_by": "TEAM_LEAD",
                "status": "ASSIGNED",
                "updated_at": datetime.now()
            }
        }
    )


    # --------------------------------------------------------
    # Step 5: Check whether update was successful
    # --------------------------------------------------------

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    return {
        "message": "Request assigned successfully",
        "request_id": request_id,
        "assigned_to": assignment.assigned_to,
        "status": "ASSIGNED"
    }


# ============================================================
# 13. REASSIGN REQUEST TO ANOTHER ENGINEER
# ============================================================

@app.put("/teamlead/requests/{request_id}/reassign")
def reassign_request(request_id: str, assignment: Assignment):

    # --------------------------------------------------------
    # Step 1: Check whether the request exists
    # --------------------------------------------------------

    request = service_request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    # --------------------------------------------------------
    # Step 2: Check whether request is currently assigned
    # --------------------------------------------------------

    if request.get("assigned_to") is None:

        raise HTTPException(
            status_code=400,
            detail="Request is not currently assigned. Use assign API."
        )


    # --------------------------------------------------------
    # Step 3: Check whether new engineer exists
    # --------------------------------------------------------

    engineer = user_collection.find_one(
        {
            "user_id": assignment.assigned_to,
            "role": "support_engineer"
        }
    )

    if engineer is None:
        raise HTTPException(
            status_code=404,
            detail="Support engineer not found"
        )


    # --------------------------------------------------------
    # Step 4: Prevent assigning to the same engineer
    # --------------------------------------------------------

    if request.get("assigned_to") == assignment.assigned_to:

        raise HTTPException(
            status_code=400,
            detail="Request is already assigned to this engineer"
        )


    # --------------------------------------------------------
    # Step 5: Reassign request
    # --------------------------------------------------------

    result = service_request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.assigned_to,
                "assigned_by": "TEAM_LEAD",
                "status": "ASSIGNED",
                "updated_at": datetime.now()
            }
        }
    )


    # --------------------------------------------------------
    # Step 6: Check update
    # --------------------------------------------------------

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    return {
        "message": "Request reassigned successfully",
        "request_id": request_id,
        "assigned_to": assignment.assigned_to,
        "status": "ASSIGNED"
    }

# ============================================================
# 14. CANCEL SUPPORT REQUEST
# ============================================================

@app.delete("/teamlead/requests/{request_id}")
def cancel_request(request_id: str):

    # --------------------------------------------------------
    # Step 1: Find the request
    # --------------------------------------------------------

    request = service_request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    # --------------------------------------------------------
    # Step 2: Check whether request is already closed
    # --------------------------------------------------------

    if request.get("status") == "CLOSED":

        raise HTTPException(
            status_code=400,
            detail="Closed request cannot be cancelled"
        )


    # --------------------------------------------------------
    # Step 3: Cancel the request
    # --------------------------------------------------------

    result = service_request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "status": "CANCELLED",
                "updated_at": datetime.now()
            }
        }
    )


    # --------------------------------------------------------
    # Step 4: Check whether update was successful
    # --------------------------------------------------------

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    return {
        "message": "Support request cancelled successfully",
        "request_id": request_id,
        "status": "CANCELLED"
    }


# ============================================================
# 15. TEAM LEAD REQUEST SUMMARY
# ============================================================

@app.get("/teamlead/summary")
def get_request_summary():

    # Count requests according to their current status

    new_count = service_request_collection.count_documents(
        {"status": "NEW"}
    )

    assigned_count = service_request_collection.count_documents(
        {"status": "ASSIGNED"}
    )

    in_progress_count = service_request_collection.count_documents(
        {"status": "IN_PROGRESS"}
    )

    on_hold_count = service_request_collection.count_documents(
        {"status": "ON_HOLD"}
    )

    resolved_count = service_request_collection.count_documents(
        {"status": "RESOLVED"}
    )

    closed_count = service_request_collection.count_documents(
        {"status": "CLOSED"}
    )

    cancelled_count = service_request_collection.count_documents(
        {"status": "CANCELLED"}
    )


    # Return complete summary

    return {
        "NEW": new_count,
        "ASSIGNED": assigned_count,
        "IN_PROGRESS": in_progress_count,
        "ON_HOLD": on_hold_count,
        "RESOLVED": resolved_count,
        "CLOSED": closed_count,
        "CANCELLED": cancelled_count
    }

# ============================================================
# 16. GET REQUESTS BY STATUS
# ============================================================

@app.get("/teamlead/requests/status/{status}")
def get_requests_by_status(status: str):

    # Convert status to uppercase
    status = status.upper()

    # Check whether the status is valid
    if status not in REQUEST_STATUS and status != "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Invalid request status"
        )

    # Find requests having the given status
    requests = list(
        service_request_collection.find(
            {"status": status},
            {"_id": 0}
        )
    )

    return {
        "status": status,
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 17. GET REQUESTS BY DEPARTMENT
# ============================================================

@app.get("/teamlead/requests/department/{department}")
def get_requests_by_department(department: str):

    # Find requests raised by the specified department
    requests = list(
        service_request_collection.find(
            {
                "department": department
            },
            {
                "_id": 0
            }
        )
    )

    return {
        "department": department,
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 18. GET REQUESTS ASSIGNED TO A PARTICULAR ENGINEER
# ============================================================

@app.get("/teamlead/engineers/{engineer_id}/requests")
def get_engineer_requests(engineer_id: str):

    # Check whether engineer exists
    engineer = user_collection.find_one(
        {
            "user_id": engineer_id,
            "role": "support_engineer"
        },
        {
            "_id": 0,
            "password": 0
        }
    )

    if engineer is None:
        raise HTTPException(
            status_code=404,
            detail="Support engineer not found"
        )

    # Find requests assigned to this engineer
    requests = list(
        service_request_collection.find(
            {
                "assigned_to": engineer_id
            },
            {
                "_id": 0
            }
        )
    )

    return {
        "engineer_id": engineer_id,
        "engineer_name": engineer.get("name"),
        "count": len(requests),
        "requests": requests
    }

# ============================================================
# HOSPITAL SUPPORT REQUEST SYSTEM
# TEAM LEAD BACKEND
# ============================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime


# ============================================================
# 1. FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Hospital Support Request System",
    description="Backend APIs for Team Lead",
    version="1.0.0"
)


# ============================================================
# 2. MONGODB CONNECTION
# ============================================================

MONGO_URL = "mongodb://localhost:27017/"

client = MongoClient(MONGO_URL)

db = client["MyDB"]


# ============================================================
# 3. COLLECTIONS
# ============================================================

service_request_collection = db["service_requests"]

user_collection = db["users"]


# ============================================================
# 4. REQUEST CATEGORIES
# ============================================================

REQUEST_CATEGORIES = [
    "EQUIPMENT_ISSUE",
    "MAINTENANCE",
    "IT_ISSUE",
    "FACILITY_REQUEST"
]


# ============================================================
# 5. REQUEST STATUS
# ============================================================

REQUEST_STATUS = [
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "RESOLVED",
    "CLOSED",
    "CANCELLED"
]


# ============================================================
# 6. PYDANTIC MODELS
# ============================================================

class Assignment(BaseModel):
    assigned_to: str


# ============================================================
# 7. HOME API
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Hospital Support Request System - Team Lead Backend",
        "status": "running"
    }


# ============================================================
# 8. GET ALL SUPPORT REQUESTS
# ============================================================

@app.get("/teamlead/requests")
def get_all_requests():

    requests = list(
        service_request_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 9. GET REQUESTS BY STATUS
# ============================================================

@app.get("/teamlead/requests/status/{status}")
def get_requests_by_status(status: str):

    status = status.upper()

    if status not in REQUEST_STATUS:

        raise HTTPException(
            status_code=400,
            detail="Invalid request status"
        )

    requests = list(
        service_request_collection.find(
            {"status": status},
            {"_id": 0}
        )
    )

    return {
        "status": status,
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 10. GET REQUESTS BY DEPARTMENT
# ============================================================

@app.get("/teamlead/requests/department/{department}")
def get_requests_by_department(department: str):

    requests = list(
        service_request_collection.find(
            {"department": department},
            {"_id": 0}
        )
    )

    return {
        "department": department,
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 11. GET ALL SUPPORT ENGINEERS
# ============================================================

@app.get("/teamlead/engineers")
def get_support_engineers():

    engineers = list(
        user_collection.find(
            {"role": "support_engineer"},
            {
                "_id": 0,
                "password": 0
            }
        )
    )

    return {
        "count": len(engineers),
        "engineers": engineers
    }


# ============================================================
# 12. GET REQUESTS ASSIGNED TO ENGINEER
# ============================================================

@app.get("/teamlead/engineers/{engineer_id}/requests")
def get_engineer_requests(engineer_id: str):

    engineer = user_collection.find_one(
        {
            "user_id": engineer_id,
            "role": "support_engineer"
        },
        {
            "_id": 0,
            "password": 0
        }
    )

    if engineer is None:

        raise HTTPException(
            status_code=404,
            detail="Support engineer not found"
        )

    requests = list(
        service_request_collection.find(
            {"assigned_to": engineer_id},
            {"_id": 0}
        )
    )

    return {
        "engineer_id": engineer_id,
        "engineer_name": engineer.get("name"),
        "count": len(requests),
        "requests": requests
    }


# ============================================================
# 13. GET REQUEST SUMMARY
# ============================================================

@app.get("/teamlead/summary")
def get_request_summary():

    summary = {}

    for status in REQUEST_STATUS:

        summary[status] = (
            service_request_collection.count_documents(
                {"status": status}
            )
        )

    return summary


# ============================================================
# 14. GET ONE SUPPORT REQUEST
# ============================================================

@app.get("/teamlead/requests/{request_id}")
def get_request_by_id(request_id: str):

    request = service_request_collection.find_one(
        {"request_id": request_id},
        {"_id": 0}
    )

    if request is None:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )

    return request


# ============================================================
# 15. ASSIGN REQUEST TO SUPPORT ENGINEER
# ============================================================

@app.put("/teamlead/requests/{request_id}/assign")
def assign_request(
    request_id: str,
    assignment: Assignment
):

    # --------------------------------------------------------
    # Check request
    # --------------------------------------------------------

    request = service_request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    # --------------------------------------------------------
    # Check engineer
    # --------------------------------------------------------

    engineer = user_collection.find_one(
        {
            "user_id": assignment.assigned_to,
            "role": "support_engineer"
        }
    )

    if engineer is None:

        raise HTTPException(
            status_code=404,
            detail="Support engineer not found"
        )


    # --------------------------------------------------------
    # Check existing assignment
    # --------------------------------------------------------

    if request.get("assigned_to") is not None:

        raise HTTPException(
            status_code=400,
            detail="Request is already assigned. Use reassign API."
        )


    # --------------------------------------------------------
    # Assign
    # --------------------------------------------------------

    result = service_request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.assigned_to,
                "assigned_by": "TEAM_LEAD",
                "status": "ASSIGNED",
                "updated_at": datetime.now()
            }
        }
    )


    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    return {
        "message": "Request assigned successfully",
        "request_id": request_id,
        "assigned_to": assignment.assigned_to,
        "status": "ASSIGNED"
    }


# ============================================================
# 16. REASSIGN REQUEST
# ============================================================

@app.put("/teamlead/requests/{request_id}/reassign")
def reassign_request(
    request_id: str,
    assignment: Assignment
):

    # --------------------------------------------------------
    # Check request
    # --------------------------------------------------------

    request = service_request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    # --------------------------------------------------------
    # Check current assignment
    # --------------------------------------------------------

    if request.get("assigned_to") is None:

        raise HTTPException(
            status_code=400,
            detail="Request is not assigned. Use assign API."
        )


    # --------------------------------------------------------
    # Check new engineer
    # --------------------------------------------------------

    engineer = user_collection.find_one(
        {
            "user_id": assignment.assigned_to,
            "role": "support_engineer"
        }
    )

    if engineer is None:

        raise HTTPException(
            status_code=404,
            detail="Support engineer not found"
        )


    # --------------------------------------------------------
    # Prevent same engineer
    # --------------------------------------------------------

    if request.get("assigned_to") == assignment.assigned_to:

        raise HTTPException(
            status_code=400,
            detail="Request is already assigned to this engineer"
        )


    # --------------------------------------------------------
    # Reassign
    # --------------------------------------------------------

    result = service_request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.assigned_to,
                "assigned_by": "TEAM_LEAD",
                "status": "ASSIGNED",
                "updated_at": datetime.now()
            }
        }
    )


    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    return {
        "message": "Request reassigned successfully",
        "request_id": request_id,
        "assigned_to": assignment.assigned_to,
        "status": "ASSIGNED"
    }


# ============================================================
# 17. CANCEL REQUEST
# ============================================================

@app.delete("/teamlead/requests/{request_id}")
def cancel_request(request_id: str):

    request = service_request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    if request.get("status") == "CLOSED":

        raise HTTPException(
            status_code=400,
            detail="Closed request cannot be cancelled"
        )


    result = service_request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "status": "CANCELLED",
                "updated_at": datetime.now()
            }
        }
    )


    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Support request not found"
        )


    return {
        "message": "Support request cancelled successfully",
        "request_id": request_id,
        "status": "CANCELLED"
    }

# ============================================================
# 4. INITIAL SAMPLE DATA
# ============================================================

def initialize_sample_data():

    # --------------------------------------------------------
    # Create sample Support Engineers
    # --------------------------------------------------------

    engineer1 = user_collection.find_one(
        {"user_id": "ENG205"}
    )

    if engineer1 is None:

        user_collection.insert_one({
            "user_id": "ENG205",
            "name": "Arun Kumar",
            "username": "arun",
            "role": "support_engineer",
            "department": "Equipment"
        })


    engineer2 = user_collection.find_one(
        {"user_id": "ENG210"}
    )

    if engineer2 is None:

        user_collection.insert_one({
            "user_id": "ENG210",
            "name": "Vijay Kumar",
            "username": "vijay",
            "role": "support_engineer",
            "department": "IT"
        })


    # --------------------------------------------------------
    # Create sample Team Lead
    # --------------------------------------------------------

    team_lead = user_collection.find_one(
        {"user_id": "TL001"}
    )

    if team_lead is None:

        user_collection.insert_one({
            "user_id": "TL001",
            "name": "Team Lead",
            "username": "teamlead",
            "role": "team_lead",
            "department": "Hospital Support"
        })


    # --------------------------------------------------------
    # Create sample support request
    # --------------------------------------------------------

    request = service_request_collection.find_one(
        {"request_id": "REQ101"}
    )

    if request is None:

        service_request_collection.insert_one({
            "request_id": "REQ101",
            "employee_name": "Rahul",
            "employee_id": "EMP101",
            "department": "Nursing",
            "task": "Ventilator is not working",
            "category": "EQUIPMENT_ISSUE",
            "status": "NEW",
            "assigned_to": None,
            "assigned_by": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })


# Run sample data initialization
initialize_sample_data()