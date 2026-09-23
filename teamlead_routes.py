# ============================================================
# TEAM LEAD ROUTES
# ============================================================
# NOTE: This now reads/writes the SAME `request_collection` that
# staff and admin use (originally this role had its own separate
# "MyDB.service_requests" collection, so nothing it did was ever
# visible anywhere else).

from datetime import datetime

from fastapi import APIRouter, HTTPException

from constants import REQUEST_STATUS, ROLE_SUPPORT_ENGINEER
from database import client, db, request_collection, user_collection
from models import RequestAssignment

router = APIRouter(prefix="/teamlead", tags=["Team Lead"])


# ------------------------------------------------------------
# Requests
# ------------------------------------------------------------
@router.get("/requests")
def get_all_requests():
    requests = list(request_collection.find({}, {"_id": 0}))
    return {"count": len(requests), "requests": requests}


@router.get("/requests/status/{status}")
def get_requests_by_status(status: str):
    status = status.upper()
    if status not in REQUEST_STATUS:
        raise HTTPException(status_code=400, detail="Invalid request status")

    requests = list(request_collection.find({"status": status}, {"_id": 0}))
    return {"status": status, "count": len(requests), "requests": requests}


@router.get("/requests/department/{department}")
def get_requests_by_department(department: str):
    requests = list(request_collection.find({"department": department}, {"_id": 0}))
    return {"department": department, "count": len(requests), "requests": requests}


@router.get("/requests/{request_id}")
def get_request_by_id(request_id: str):
    request = request_collection.find_one({"request_id": request_id}, {"_id": 0})
    if request is None:
        raise HTTPException(status_code=404, detail="Support request not found")
    return request


# ------------------------------------------------------------
# Engineers
# ------------------------------------------------------------
@router.get("/engineers")
def get_support_engineers():
    engineers = list(user_collection.find({"role": ROLE_SUPPORT_ENGINEER}, {"_id": 0}))
    return {"count": len(engineers), "engineers": engineers}


@router.get("/engineers/{engineer_id}/requests")
def get_engineer_requests(engineer_id: str):
    engineer = user_collection.find_one(
        {"user_id": engineer_id, "role": ROLE_SUPPORT_ENGINEER}, {"_id": 0}
    )
    if engineer is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    requests = list(request_collection.find({"assigned_to": engineer_id}, {"_id": 0}))
    return {
        "engineer_id": engineer_id,
        "engineer_name": engineer.get("name"),
        "count": len(requests),
        "requests": requests,
    }


# ------------------------------------------------------------
# Assign / reassign
# ------------------------------------------------------------
@router.put("/requests/{request_id}/assign")
def assign_request(request_id: str, assignment: RequestAssignment):

    request = request_collection.find_one({"request_id": request_id})
    if request is None:
        raise HTTPException(status_code=404, detail="Support request not found")

    engineer = user_collection.find_one(
        {"user_id": assignment.engineer_id, "role": ROLE_SUPPORT_ENGINEER}
    )
    if engineer is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    if request.get("assigned_to") is not None:
        raise HTTPException(status_code=400, detail="Request is already assigned. Use reassign API.")

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.engineer_id,
                "assigned_by": "TEAM_LEAD",
                "status": "ASSIGNED",
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "message": "Request assigned successfully",
        "request_id": request_id,
        "assigned_to": assignment.engineer_id,
        "status": "ASSIGNED",
    }


@router.put("/requests/{request_id}/reassign")
def reassign_request(request_id: str, assignment: RequestAssignment):

    request = request_collection.find_one({"request_id": request_id})
    if request is None:
        raise HTTPException(status_code=404, detail="Support request not found")

    if request.get("assigned_to") is None:
        raise HTTPException(status_code=400, detail="Request is not currently assigned. Use assign API.")

    engineer = user_collection.find_one(
        {"user_id": assignment.engineer_id, "role": ROLE_SUPPORT_ENGINEER}
    )
    if engineer is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    if request.get("assigned_to") == assignment.engineer_id:
        raise HTTPException(status_code=400, detail="Request is already assigned to this engineer")

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.engineer_id,
                "assigned_by": "TEAM_LEAD",
                "status": "ASSIGNED",
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "message": "Request reassigned successfully",
        "request_id": request_id,
        "assigned_to": assignment.engineer_id,
        "status": "ASSIGNED",
    }


# ------------------------------------------------------------
# Cancel
# ------------------------------------------------------------
@router.delete("/requests/{request_id}")
def cancel_request(request_id: str):

    request = request_collection.find_one({"request_id": request_id})
    if request is None:
        raise HTTPException(status_code=404, detail="Support request not found")

    if request.get("status") == "CLOSED":
        raise HTTPException(status_code=400, detail="Closed request cannot be cancelled")

    request_collection.update_one(
        {"request_id": request_id},
        {"$set": {"status": "CANCELLED", "updated_at": datetime.utcnow()}},
    )

    return {
        "message": "Support request cancelled successfully",
        "request_id": request_id,
        "status": "CANCELLED",
    }


# ------------------------------------------------------------
# Summary
# ------------------------------------------------------------
@router.get("/summary")
def get_request_summary():
    return {status: request_collection.count_documents({"status": status}) for status in REQUEST_STATUS}


# ------------------------------------------------------------
# Health check
# ------------------------------------------------------------
@router.get("/health")
def teamlead_health_check():
    try:
        client.admin.command("ping")
        collections = db.list_collection_names()
        return {
            "status": "healthy",
            "database": db.name,
            "mongodb": "connected",
            "collections": {
                name: name in collections
                for name in ["users", "departments", "categories", "requests", "comments", "audit_logs"]
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
