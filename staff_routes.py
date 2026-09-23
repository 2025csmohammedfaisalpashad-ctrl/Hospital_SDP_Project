# ============================================================
# STAFF ROUTES
# ============================================================

from datetime import datetime

from fastapi import APIRouter, HTTPException

from database import (
    category_collection,
    client,
    comments_collection,
    db,
    department_collection,
    request_collection,
    user_collection,
)
from models import CommentRecord, SupportRequest, UpdateSupportRequest

router = APIRouter(prefix="/staff", tags=["Staff"])


# ------------------------------------------------------------
# Create support request
# ------------------------------------------------------------
@router.post("/requests")
def create_support_request(request: SupportRequest):

    if request_collection.find_one({"request_id": request.request_id}) is not None:
        raise HTTPException(status_code=400, detail="Request ID already exists")

    if department_collection.find_one({"name": request.department}) is None:
        raise HTTPException(status_code=404, detail="Department not found")

    if category_collection.find_one({"name": request.category}) is None:
        raise HTTPException(status_code=404, detail="Category not found")

    request_data = {
        "request_id": request.request_id,
        "title": request.title,
        "description": request.description,
        "category": request.category,
        "department": request.department,
        "priority": request.priority,
        "status": "NEW",
        "assigned_to": None,
        "assigned_by": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    request_collection.insert_one(request_data)

    return {
        "message": "Support request created successfully",
        "request_id": request.request_id,
        "status": "NEW",
    }


# ------------------------------------------------------------
# Get requests by department
# ------------------------------------------------------------
@router.get("/requests/department/{department}")
def get_department_requests(department: str):

    if department_collection.find_one({"name": department}) is None:
        raise HTTPException(status_code=404, detail="Department not found")

    requests = list(
        request_collection.find({"department": department}, {"_id": 0}).sort("created_at", -1)
    )

    return {"department": department, "count": len(requests), "requests": requests}


# ------------------------------------------------------------
# Get requests by status / priority
# ------------------------------------------------------------
@router.get("/requests/status/{status}")
def get_requests_by_status(status: str):
    requests = list(
        request_collection.find({"status": status.upper()}, {"_id": 0}).sort("created_at", -1)
    )
    return {"status": status.upper(), "count": len(requests), "requests": requests}


@router.get("/requests/priority/{priority}")
def get_requests_by_priority(priority: str):
    requests = list(
        request_collection.find({"priority": priority}, {"_id": 0}).sort("created_at", -1)
    )
    return {"priority": priority, "count": len(requests), "requests": requests}


# ------------------------------------------------------------
# Get single request
# ------------------------------------------------------------
@router.get("/requests/{request_id}")
def get_request_by_id(request_id: str):
    request = request_collection.find_one({"request_id": request_id}, {"_id": 0})
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


# ------------------------------------------------------------
# Update request
# ------------------------------------------------------------
@router.put("/requests/{request_id}")
def update_support_request(request_id: str, request: UpdateSupportRequest):

    existing_request = request_collection.find_one({"request_id": request_id})
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if existing_request.get("status") == "CLOSED":
        raise HTTPException(status_code=400, detail="Closed request cannot be updated")

    if category_collection.find_one({"name": request.category}) is None:
        raise HTTPException(status_code=404, detail="Category not found")

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "title": request.title,
                "description": request.description,
                "category": request.category,
                "priority": request.priority,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"message": "Support request updated successfully", "request_id": request_id}


# ------------------------------------------------------------
# Delete / cancel request (only while still NEW)
# ------------------------------------------------------------
@router.delete("/requests/{request_id}")
def delete_support_request(request_id: str):

    existing_request = request_collection.find_one({"request_id": request_id})
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if existing_request.get("status") != "NEW":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only NEW requests can be deleted. Requests already assigned "
                "or being processed cannot be deleted."
            ),
        )

    request_collection.delete_one({"request_id": request_id})

    return {"message": "Support request deleted successfully", "request_id": request_id}


# ------------------------------------------------------------
# Comments
# ------------------------------------------------------------
@router.post("/requests/{request_id}/comments")
def add_request_comment(request_id: str, data: CommentRecord):

    if request_collection.find_one({"request_id": request_id}) is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if user_collection.find_one({"user_id": data.user_id}) is None:
        raise HTTPException(status_code=404, detail="User not found")

    comments_collection.insert_one(
        {
            "request_id": request_id,
            "user_id": data.user_id,
            "comment": data.comment,
            "created_at": datetime.utcnow(),
        }
    )

    return {"message": "Comment added successfully", "request_id": request_id}


@router.get("/requests/{request_id}/comments")
def get_request_comments(request_id: str):

    if request_collection.find_one({"request_id": request_id}) is None:
        raise HTTPException(status_code=404, detail="Request not found")

    comments = list(
        comments_collection.find({"request_id": request_id}, {"_id": 0}).sort("created_at", 1)
    )

    return {"request_id": request_id, "count": len(comments), "comments": comments}


# ------------------------------------------------------------
# Department summary
# ------------------------------------------------------------
@router.get("/summary/{department}")
def get_department_summary(department: str):

    if department_collection.find_one({"name": department}) is None:
        raise HTTPException(status_code=404, detail="Department not found")

    counts = {
        status: request_collection.count_documents({"department": department, "status": status})
        for status in ["NEW", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "CANCELLED"]
    }

    return {
        "department": department,
        "total_requests": sum(counts.values()),
        "requests": counts,
    }


# ------------------------------------------------------------
# Health check
# ------------------------------------------------------------
@router.get("/health")
def staff_health_check():
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
