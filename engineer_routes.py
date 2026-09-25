# ============================================================
# SUPPORT ENGINEER ROUTES
# ============================================================
# Every route requires a valid SUPPORT_ENGINEER token, AND the
# {engineer_id} in the URL must match the token's own user_id.
# This is what stops engineer ENG205 from reading ENG210's
# assigned requests just by editing the URL.

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from auth import require_role
from constants import ROLE_SUPPORT_ENGINEER
from database import client, comments_collection, db, request_collection
from models import CommentRecord, RequestStatusUpdate

router = APIRouter(prefix="/engineer", tags=["Support Engineer"])

# A support engineer may only move a request through these statuses.
ENGINEER_ALLOWED_STATUSES = ["IN_PROGRESS", "ON_HOLD", "RESOLVED"]


def _verify_self(engineer_id: str, current_user: dict):
    """The URL's engineer_id must be the same engineer as the token.
    Without this, any engineer could read/edit any other engineer's
    requests just by changing the URL."""
    if engineer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only access your own assigned requests")


# ------------------------------------------------------------
# Assigned requests
# ------------------------------------------------------------
@router.get("/{engineer_id}/requests")
def get_assigned_requests(
    engineer_id: str,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    requests = list(
        request_collection.find({"assigned_to": engineer_id}, {"_id": 0}).sort("created_at", -1)
    )
    return {"engineer_id": engineer_id, "count": len(requests), "requests": requests}


@router.get("/{engineer_id}/requests/status/{status}")
def get_engineer_requests_by_status(
    engineer_id: str,
    status: str,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    requests = list(
        request_collection.find(
            {"assigned_to": engineer_id, "status": status.upper()}, {"_id": 0}
        ).sort("created_at", -1)
    )
    return {
        "engineer_id": engineer_id,
        "status": status.upper(),
        "count": len(requests),
        "requests": requests,
    }


@router.get("/{engineer_id}/requests/priority/{priority}")
def get_engineer_requests_by_priority(
    engineer_id: str,
    priority: str,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    requests = list(
        request_collection.find(
            {"assigned_to": engineer_id, "priority": priority}, {"_id": 0}
        ).sort("created_at", -1)
    )
    return {
        "engineer_id": engineer_id,
        "priority": priority,
        "count": len(requests),
        "requests": requests,
    }


@router.get("/{engineer_id}/requests/{request_id}")
def get_assigned_request(
    engineer_id: str,
    request_id: str,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    request = request_collection.find_one(
        {"request_id": request_id, "assigned_to": engineer_id}, {"_id": 0}
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found or not assigned to this engineer")
    return request


# ------------------------------------------------------------
# Update status
# ------------------------------------------------------------
@router.put("/{engineer_id}/requests/{request_id}/status")
def update_request_status(
    engineer_id: str,
    request_id: str,
    data: RequestStatusUpdate,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    existing_request = request_collection.find_one(
        {"request_id": request_id, "assigned_to": engineer_id}
    )
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found or not assigned to this engineer")

    if data.status not in ENGINEER_ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Support Engineer can set IN_PROGRESS, ON_HOLD, or RESOLVED",
        )

    request_collection.update_one(
        {"request_id": request_id, "assigned_to": engineer_id},
        {"$set": {"status": data.status, "updated_at": datetime.utcnow()}},
    )

    return {
        "message": "Request status updated successfully",
        "request_id": request_id,
        "status": data.status,
    }


# ------------------------------------------------------------
# Comments / resolution notes
# ------------------------------------------------------------
@router.post("/{engineer_id}/requests/{request_id}/comments")
def add_engineer_comment(
    engineer_id: str,
    request_id: str,
    data: CommentRecord,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    existing_request = request_collection.find_one(
        {"request_id": request_id, "assigned_to": engineer_id}
    )
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found or not assigned to this engineer")

    comments_collection.insert_one(
        {
            "request_id": request_id,
            "user_id": engineer_id,
            "comment": data.comment,
            "created_at": datetime.utcnow(),
        }
    )

    return {
        "message": "Comment added successfully",
        "request_id": request_id,
        "engineer_id": engineer_id,
    }


# ------------------------------------------------------------
# Workload summary
# ------------------------------------------------------------
@router.get("/{engineer_id}/summary")
def get_engineer_summary(
    engineer_id: str,
    current_user: dict = Depends(require_role(ROLE_SUPPORT_ENGINEER)),
):
    _verify_self(engineer_id, current_user)

    counts = {
        status: request_collection.count_documents({"assigned_to": engineer_id, "status": status})
        for status in ["ASSIGNED", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"]
    }

    return {
        "engineer_id": engineer_id,
        "total_requests": request_collection.count_documents({"assigned_to": engineer_id}),
        "requests": counts,
    }


# ------------------------------------------------------------
# Health check (kept public/unauthenticated on purpose)
# ------------------------------------------------------------
@router.get("/health")
def engineer_health_check():
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