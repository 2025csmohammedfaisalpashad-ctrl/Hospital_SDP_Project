# ============================================================
# ADMIN ROUTES
# ============================================================

from datetime import datetime

from fastapi import APIRouter, HTTPException

from constants import REQUEST_STATUS, ROLE_SUPPORT_ENGINEER
from database import (
    audit_collection,
    category_collection,
    client,
    comments_collection,
    db,
    department_collection,
    request_collection,
    user_collection,
)
from models import (
    AuditLogRecord,
    CategoryRecord,
    CommentRecord,
    DepartmentRecord,
    RequestAssignment,
    RequestStatusUpdate,
    UserRecord,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# USERS
# ============================================================
@router.post("/users")
def create_user(user: UserRecord):
    if user_collection.find_one({"user_id": user.user_id}) is not None:
        raise HTTPException(status_code=400, detail="User ID already exists")

    if user_collection.find_one({"username": user.username}) is not None:
        raise HTTPException(status_code=400, detail="Username already exists")

    user_collection.insert_one(user.model_dump())

    return {"message": "User created successfully", "user_id": user.user_id}


@router.get("/users")
def get_all_users():
    users = list(user_collection.find({}, {"_id": 0}))
    return {"count": len(users), "users": users}


@router.get("/users/{user_id}")
def get_user_by_id(user_id: str):
    user = user_collection.find_one({"user_id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}")
def update_user(user_id: str, user: UserRecord):
    if user_collection.find_one({"user_id": user_id}) is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user_collection.find_one({"username": user.username, "user_id": {"$ne": user_id}}) is not None:
        raise HTTPException(status_code=400, detail="Username already belongs to another user")

    user_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "name": user.name,
                "username": user.username,
                "role": user.role,
                "department": user.department,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"message": "User updated successfully", "user_id": user_id}


@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    if user_collection.find_one({"user_id": user_id}) is None:
        raise HTTPException(status_code=404, detail="User not found")

    user_collection.delete_one({"user_id": user_id})
    return {"message": "User deleted successfully", "user_id": user_id}


# ============================================================
# DEPARTMENTS
# ============================================================
@router.post("/departments")
def create_department(department: DepartmentRecord):
    if department_collection.find_one({"name": department.name}) is not None:
        raise HTTPException(status_code=400, detail="Department already exists")

    department_collection.insert_one(
        {"name": department.name, "description": department.description, "created_at": datetime.utcnow()}
    )

    return {"message": "Department created successfully", "department": department.name}


@router.get("/departments")
def get_all_departments():
    departments = list(department_collection.find({}, {"_id": 0}))
    return {"count": len(departments), "departments": departments}


@router.get("/departments/{department_name}")
def get_department_by_name(department_name: str):
    department = department_collection.find_one({"name": department_name}, {"_id": 0})
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.put("/departments/{department_name}")
def update_department(department_name: str, department: DepartmentRecord):
    if department_collection.find_one({"name": department_name}) is None:
        raise HTTPException(status_code=404, detail="Department not found")

    # If renaming, make sure the new name isn't already taken by another department.
    # (Original code built this check with a duplicate dict key, which Python
    # silently collapses to just the last value — effectively dead code.)
    duplicate = department_collection.find_one({"name": department.name})
    if duplicate is not None and department.name != department_name:
        raise HTTPException(status_code=400, detail="Department name already exists")

    department_collection.update_one(
        {"name": department_name},
        {
            "$set": {
                "name": department.name,
                "description": department.description,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"message": "Department updated successfully", "department": department.name}


@router.delete("/departments/{department_name}")
def delete_department(department_name: str):
    if department_collection.find_one({"name": department_name}) is None:
        raise HTTPException(status_code=404, detail="Department not found")

    if user_collection.count_documents({"department": department_name}) > 0:
        raise HTTPException(
            status_code=400, detail="Department cannot be deleted because users are still assigned to it"
        )

    department_collection.delete_one({"name": department_name})
    return {"message": "Department deleted successfully", "department": department_name}


# ============================================================
# CATEGORIES
# ============================================================
@router.post("/categories")
def create_category(category: CategoryRecord):
    if category_collection.find_one({"name": category.name}) is not None:
        raise HTTPException(status_code=400, detail="Category already exists")

    category_collection.insert_one(
        {"name": category.name, "description": category.description, "created_at": datetime.utcnow()}
    )

    return {"message": "Category created successfully", "category": category.name}


@router.get("/categories")
def get_all_categories():
    categories = list(category_collection.find({}, {"_id": 0}))
    return {"count": len(categories), "categories": categories}


@router.put("/categories/{category_name}")
def update_category(category_name: str, category: CategoryRecord):
    if category_collection.find_one({"name": category_name}) is None:
        raise HTTPException(status_code=404, detail="Category not found")

    duplicate = category_collection.find_one({"name": category.name})
    if duplicate is not None and category.name != category_name:
        raise HTTPException(status_code=400, detail="Category name already exists")

    category_collection.update_one(
        {"name": category_name},
        {
            "$set": {
                "name": category.name,
                "description": category.description,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"message": "Category updated successfully", "category": category.name}


@router.delete("/categories/{category_name}")
def delete_category(category_name: str):
    if category_collection.find_one({"name": category_name}) is None:
        raise HTTPException(status_code=404, detail="Category not found")

    if request_collection.count_documents({"category": category_name}) > 0:
        raise HTTPException(
            status_code=400, detail="Category cannot be deleted because requests are using this category"
        )

    category_collection.delete_one({"name": category_name})
    return {"message": "Category deleted successfully", "category": category_name}


# ============================================================
# AUDIT LOGS
# ============================================================
@router.post("/audit-logs")
def create_audit_log(log: AuditLogRecord):
    audit_collection.insert_one({**log.model_dump(), "created_at": datetime.utcnow()})
    return {"message": "Audit log created successfully"}


# ============================================================
# REQUESTS (admin-level view/control)
# ============================================================
@router.get("/requests")
def get_all_requests():
    requests = list(request_collection.find({}, {"_id": 0}))
    return {"count": len(requests), "requests": requests}


@router.get("/requests/status/{status}")
def get_requests_by_status(status: str):
    requests = list(request_collection.find({"status": status.upper()}, {"_id": 0}))
    return {"status": status.upper(), "count": len(requests), "requests": requests}


@router.get("/requests/department/{department}")
def get_requests_by_department(department: str):
    requests = list(request_collection.find({"department": department}, {"_id": 0}))
    return {"department": department, "count": len(requests), "requests": requests}


@router.get("/requests/{request_id}")
def get_request_by_id(request_id: str):
    request = request_collection.find_one({"request_id": request_id}, {"_id": 0})
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


@router.put("/requests/{request_id}/status")
def update_request_status(request_id: str, data: RequestStatusUpdate):
    if request_collection.find_one({"request_id": request_id}) is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if data.status not in REQUEST_STATUS:
        raise HTTPException(status_code=400, detail="Invalid request status")

    request_collection.update_one(
        {"request_id": request_id},
        {"$set": {"status": data.status, "updated_at": datetime.utcnow()}},
    )

    return {"message": "Request status updated successfully", "request_id": request_id, "status": data.status}


@router.put("/requests/{request_id}/assign")
def assign_request(request_id: str, assignment: RequestAssignment):
    if request_collection.find_one({"request_id": request_id}) is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if user_collection.find_one({"user_id": assignment.engineer_id, "role": ROLE_SUPPORT_ENGINEER}) is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.engineer_id,
                "assigned_by": "ADMIN",
                "status": "ASSIGNED",
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"message": "Request assigned successfully", "request_id": request_id, "assigned_to": assignment.engineer_id}


@router.put("/requests/{request_id}/reassign")
def reassign_request(request_id: str, assignment: RequestAssignment):
    if request_collection.find_one({"request_id": request_id}) is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if user_collection.find_one({"user_id": assignment.engineer_id, "role": ROLE_SUPPORT_ENGINEER}) is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": assignment.engineer_id,
                "assigned_by": "ADMIN",
                "status": "ASSIGNED",
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {"message": "Request reassigned successfully", "request_id": request_id, "assigned_to": assignment.engineer_id}


@router.post("/requests/{request_id}/comments")
def add_request_comment(request_id: str, data: CommentRecord):
    if request_collection.find_one({"request_id": request_id}) is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if user_collection.find_one({"user_id": data.user_id}) is None:
        raise HTTPException(status_code=404, detail="User not found")

    comments_collection.insert_one(
        {"request_id": request_id, "user_id": data.user_id, "comment": data.comment, "created_at": datetime.utcnow()}
    )

    return {"message": "Comment added successfully", "request_id": request_id}


# ============================================================
# ENGINEERS (admin view)
# ============================================================
@router.get("/engineers")
def get_all_engineers():
    engineers = list(user_collection.find({"role": ROLE_SUPPORT_ENGINEER}, {"_id": 0}))
    return {"count": len(engineers), "engineers": engineers}


@router.get("/engineers/{engineer_id}")
def get_engineer_by_id(engineer_id: str):
    engineer = user_collection.find_one({"user_id": engineer_id, "role": ROLE_SUPPORT_ENGINEER}, {"_id": 0})
    if engineer is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")
    return engineer


@router.get("/engineers/{engineer_id}/requests")
def get_engineer_requests(engineer_id: str):
    if user_collection.find_one({"user_id": engineer_id, "role": ROLE_SUPPORT_ENGINEER}) is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    requests = list(request_collection.find({"assigned_to": engineer_id}, {"_id": 0}))
    return {"engineer_id": engineer_id, "count": len(requests), "requests": requests}


@router.get("/engineers/{engineer_id}/workload")
def get_engineer_workload(engineer_id: str):
    if user_collection.find_one({"user_id": engineer_id, "role": ROLE_SUPPORT_ENGINEER}) is None:
        raise HTTPException(status_code=404, detail="Support engineer not found")

    counts = {
        status: request_collection.count_documents({"assigned_to": engineer_id, "status": status})
        for status in REQUEST_STATUS
    }

    return {
        "engineer_id": engineer_id,
        "total_requests": request_collection.count_documents({"assigned_to": engineer_id}),
        **counts,
    }


# ============================================================
# SYSTEM SUMMARY
# ============================================================
@router.get("/summary")
def get_admin_summary():
    request_counts = {
        status: request_collection.count_documents({"status": status}) for status in REQUEST_STATUS
    }

    return {
        "system": "Hospital Support Request System",
        "users": user_collection.count_documents({}),
        "departments": department_collection.count_documents({}),
        "categories": category_collection.count_documents({}),
        "requests": {"total": sum(request_counts.values()), **request_counts},
    }


# ============================================================
# HEALTH CHECK
# ============================================================
@router.get("/health")
def admin_health_check():
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
