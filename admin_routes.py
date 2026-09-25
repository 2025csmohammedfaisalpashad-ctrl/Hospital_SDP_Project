# ============================================================
# HOSPITAL SUPPORT REQUEST SYSTEM — ADMIN ROUTES
# ============================================================

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from auth import require_role

from constants import (
    ROLE_ADMIN,
    ROLE_DEPARTMENT_STAFF,
    ROLE_SUPPORT_ENGINEER,
    ROLE_TEAM_LEAD,
)

from database import (
    audit_collection,
    category_collection,
    comments_collection,
    department_collection,
    request_collection,
    user_collection,
)

from models import (
    DepartmentRecord,
    CategoryRecord,
    UserCreate,
    SupportRequest,
    UpdateSupportRequest,
    RequestStatusUpdate,
    RequestAssignment,
    CommentRecord,
)


# ============================================================
# ADMIN ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# DEPARTMENT MANAGEMENT
# ============================================================

@router.post("/departments")
def create_department(
    department: DepartmentRecord,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing = department_collection.find_one(
        {"name": department.name}
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department already exists",
        )

    department_collection.insert_one(
        {
            "name": department.name,
            "description": department.description,
            "created_at": datetime.utcnow(),
        }
    )

    return {
        "message": "Department created successfully",
        "department": department.name,
    }


@router.get("/departments")
def get_all_departments(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    departments = list(
        department_collection.find(
            {},
            {"_id": 0},
        )
    )

    return {
        "count": len(departments),
        "departments": departments,
    }


@router.get("/departments/{department_name}")
def get_department_by_name(
    department_name: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    department = department_collection.find_one(
        {"name": department_name},
        {"_id": 0},
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return department


@router.put("/departments/{department_name}")
def update_department(
    department_name: str,
    department: DepartmentRecord,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing = department_collection.find_one(
        {"name": department_name}
    )

    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    duplicate = department_collection.find_one(
        {"name": department.name}
    )

    if duplicate is not None and department.name != department_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name already exists",
        )

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

    return {
        "message": "Department updated successfully",
        "department": department.name,
    }


@router.delete("/departments/{department_name}")
def delete_department(
    department_name: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing = department_collection.find_one(
        {"name": department_name}
    )

    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    users_using_department = user_collection.count_documents(
        {"department": department_name}
    )

    if users_using_department > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Department cannot be deleted because "
                "users are still assigned to it"
            ),
        )

    department_collection.delete_one(
        {"name": department_name}
    )

    return {
        "message": "Department deleted successfully",
        "department": department_name,
    }


# ============================================================
# CATEGORY MANAGEMENT
# ============================================================

@router.post("/categories")
def create_category(
    category: CategoryRecord,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing = category_collection.find_one(
        {"name": category.name}
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists",
        )

    category_collection.insert_one(
        {
            "name": category.name,
            "description": category.description,
            "created_at": datetime.utcnow(),
        }
    )

    return {
        "message": "Category created successfully",
        "category": category.name,
    }


@router.get("/categories")
def get_all_categories(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    categories = list(
        category_collection.find(
            {},
            {"_id": 0},
        )
    )

    return {
        "count": len(categories),
        "categories": categories,
    }


@router.get("/categories/{category_name}")
def get_category_by_name(
    category_name: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    category = category_collection.find_one(
        {"name": category_name},
        {"_id": 0},
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category


@router.put("/categories/{category_name}")
def update_category(
    category_name: str,
    category: CategoryRecord,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing = category_collection.find_one(
        {"name": category_name}
    )

    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    duplicate = category_collection.find_one(
        {"name": category.name}
    )

    if duplicate is not None and category.name != category_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists",
        )

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

    return {
        "message": "Category updated successfully",
        "category": category.name,
    }


@router.delete("/categories/{category_name}")
def delete_category(
    category_name: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing = category_collection.find_one(
        {"name": category_name}
    )

    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    category_collection.delete_one(
        {"name": category_name}
    )

    return {
        "message": "Category deleted successfully",
        "category": category_name,
    }


# ============================================================
# USER MANAGEMENT
# ============================================================

@router.post("/users")
def create_user(
    user: UserCreate,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    existing_user_id = user_collection.find_one(
        {"user_id": user.user_id}
    )

    if existing_user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID already exists",
        )

    existing_username = user_collection.find_one(
        {"username": user.username}
    )

    if existing_username is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    allowed_roles = {
        ROLE_DEPARTMENT_STAFF,
        ROLE_SUPPORT_ENGINEER,
        ROLE_TEAM_LEAD,
        ROLE_ADMIN,
    }

    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role",
        )

    if user.department:
        department = department_collection.find_one(
            {"name": user.department}
        )

        if department is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    user_data = {
        "user_id": user.user_id,
        "name": user.name,
        "username": user.username,
        "role": user.role,
        "department": user.department,
        "password_hash": user.password,
        "created_at": datetime.utcnow(),
    }

    user_collection.insert_one(user_data)

    return {
        "message": "User created successfully",
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
    }


@router.get("/users")
def get_all_users(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    users = list(
        user_collection.find(
            {},
            {
                "_id": 0,
                "password_hash": 0,
            },
        )
    )

    return {
        "count": len(users),
        "users": users,
    }


@router.get("/users/{user_id}")
def get_user(
    user_id: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    user = user_collection.find_one(
        {"user_id": user_id},
        {
            "_id": 0,
            "password_hash": 0,
        },
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    user = user_collection.find_one(
        {"user_id": user_id}
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user_id == current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account",
        )

    user_collection.delete_one(
        {"user_id": user_id}
    )

    return {
        "message": "User deleted successfully",
        "user_id": user_id,
    }


# ============================================================
# REQUEST MANAGEMENT
# ============================================================

@router.get("/requests")
def get_all_requests(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    requests = list(
        request_collection.find(
            {},
            {"_id": 0},
        )
    )

    return {
        "count": len(requests),
        "requests": requests,
    }


@router.get("/requests/status/{status_value}")
def get_requests_by_status(
    status_value: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    requests = list(
        request_collection.find(
            {"status": status_value},
            {"_id": 0},
        )
    )

    return {
        "count": len(requests),
        "requests": requests,
    }


@router.get("/requests/department/{department}")
def get_requests_by_department(
    department: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    requests = list(
        request_collection.find(
            {"department": department},
            {"_id": 0},
        )
    )

    return {
        "count": len(requests),
        "requests": requests,
    }


@router.get("/requests/{request_id}")
def get_request_by_id(
    request_id: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    request = request_collection.find_one(
        {"request_id": request_id},
        {"_id": 0},
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    return request


@router.put("/requests/{request_id}/status")
def update_request_status(
    request_id: str,
    data: RequestStatusUpdate,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    request = request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "status": data.status,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "message": "Request status updated successfully",
        "request_id": request_id,
        "status": data.status,
    }


@router.put("/requests/{request_id}/assign")
def assign_request(
    request_id: str,
    data: RequestAssignment,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    request = request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    engineer = user_collection.find_one(
        {
            "user_id": data.engineer_id,
            "role": ROLE_SUPPORT_ENGINEER,
        }
    )

    if engineer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support engineer not found",
        )

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": data.engineer_id,
                "assigned_by": current_user.get("user_id"),
                "status": "ASSIGNED",
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "message": "Request assigned successfully",
        "request_id": request_id,
        "assigned_to": data.engineer_id,
    }


@router.put("/requests/{request_id}/reassign")
def reassign_request(
    request_id: str,
    data: RequestAssignment,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    request = request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    engineer = user_collection.find_one(
        {
            "user_id": data.engineer_id,
            "role": ROLE_SUPPORT_ENGINEER,
        }
    )

    if engineer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support engineer not found",
        )

    request_collection.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "assigned_to": data.engineer_id,
                "assigned_by": current_user.get("user_id"),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return {
        "message": "Request reassigned successfully",
        "request_id": request_id,
        "assigned_to": data.engineer_id,
    }


# ============================================================
# REQUEST COMMENTS
# ============================================================

@router.post("/requests/{request_id}/comments")
def add_request_comment(
    request_id: str,
    comment: CommentRecord,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    request = request_collection.find_one(
        {"request_id": request_id}
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    comment_data = {
        "request_id": request_id,
        "user_id": current_user.get("user_id"),
        "comment": comment.comment,
        "created_at": datetime.utcnow(),
    }

    comments_collection.insert_one(comment_data)

    return {
        "message": "Comment added successfully",
        "request_id": request_id,
    }


@router.get("/requests/{request_id}/comments")
def get_request_comments(
    request_id: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    comments = list(
        comments_collection.find(
            {"request_id": request_id},
            {"_id": 0},
        )
    )

    return {
        "count": len(comments),
        "comments": comments,
    }


# ============================================================
# SUPPORT ENGINEERS
# ============================================================

@router.get("/engineers")
def get_support_engineers(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    engineers = list(
        user_collection.find(
            {"role": ROLE_SUPPORT_ENGINEER},
            {
                "_id": 0,
                "password_hash": 0,
            },
        )
    )

    return {
        "count": len(engineers),
        "engineers": engineers,
    }


@router.get("/engineers/{engineer_id}")
def get_engineer(
    engineer_id: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    engineer = user_collection.find_one(
        {
            "user_id": engineer_id,
            "role": ROLE_SUPPORT_ENGINEER,
        },
        {
            "_id": 0,
            "password_hash": 0,
        },
    )

    if engineer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support engineer not found",
        )

    return engineer


@router.get("/engineers/{engineer_id}/requests")
def get_engineer_requests(
    engineer_id: str,
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    engineer = user_collection.find_one(
        {
            "user_id": engineer_id,
            "role": ROLE_SUPPORT_ENGINEER,
        }
    )

    if engineer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support engineer not found",
        )

    requests = list(
        request_collection.find(
            {"assigned_to": engineer_id},
            {"_id": 0},
        )
    )

    return {
        "engineer_id": engineer_id,
        "count": len(requests),
        "requests": requests,
    }


# ============================================================
# AUDIT LOGS
# ============================================================

@router.get("/audit-logs")
def get_audit_logs(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    logs = list(
        audit_collection.find(
            {},
            {"_id": 0},
        ).sort(
            "created_at",
            -1,
        )
    )

    return {
        "count": len(logs),
        "audit_logs": logs,
    }


# ============================================================
# ADMIN SUMMARY
# ============================================================

@router.get("/summary")
def get_admin_summary(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):

    total_users = user_collection.count_documents({})

    total_staff = user_collection.count_documents(
        {"role": ROLE_DEPARTMENT_STAFF}
    )

    total_engineers = user_collection.count_documents(
        {"role": ROLE_SUPPORT_ENGINEER}
    )

    total_team_leads = user_collection.count_documents(
        {"role": ROLE_TEAM_LEAD}
    )

    total_admins = user_collection.count_documents(
        {"role": ROLE_ADMIN}
    )

    total_departments = department_collection.count_documents({})

    total_categories = category_collection.count_documents({})

    total_requests = request_collection.count_documents({})

    new_requests = request_collection.count_documents(
        {"status": "NEW"}
    )

    assigned_requests = request_collection.count_documents(
        {"status": "ASSIGNED"}
    )

    in_progress_requests = request_collection.count_documents(
        {"status": "IN_PROGRESS"}
    )

    resolved_requests = request_collection.count_documents(
        {"status": "RESOLVED"}
    )

    confirmed_requests = request_collection.count_documents(
        {"status": "CONFIRMED"}
    )

    closed_requests = request_collection.count_documents(
        {"status": "CLOSED"}
    )

    return {
        "users": {
            "total": total_users,
            "staff": total_staff,
            "engineers": total_engineers,
            "team_leads": total_team_leads,
            "admins": total_admins,
        },
        "departments": total_departments,
        "categories": total_categories,
        "requests": {
            "total": total_requests,
            "NEW": new_requests,
            "ASSIGNED": assigned_requests,
            "IN_PROGRESS": in_progress_requests,
            "RESOLVED": resolved_requests,
            "CONFIRMED": confirmed_requests,
            "CLOSED": closed_requests,
        },
    }


# ============================================================
# ADMIN HEALTH CHECK
# ============================================================

@router.get("/health")
def admin_health_check(
    current_user: dict = Depends(require_role(ROLE_ADMIN)),
):
    return {
        "status": "healthy",
        "role": "ADMIN",
        "message": "Admin API is working",
    }