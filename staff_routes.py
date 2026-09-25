# ============================================================
# STAFF ROUTES
# ============================================================
#
# Staff users do NOT have a fixed department.
#
# A staff member can:
#
#   1. View all available departments
#   2. View all available categories
#   3. Create a support request for ANY department
#   4. View only requests created by themselves
#   5. Update only their own requests
#   6. Delete/cancel only their own NEW requests
#   7. Add/view comments on their own requests
#
# Request workflow:
#
#   NEW
#     ↓
#   ASSIGNED
#     ↓
#   IN_PROGRESS
#     ↓
#   RESOLVED
#     ↓
#   CONFIRMED
#     ↓
#   CLOSED
#
# ============================================================


from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from auth import require_role

from constants import ROLE_DEPARTMENT_STAFF

from database import (
    category_collection,
    client,
    comments_collection,
    db,
    department_collection,
    request_collection,
    user_collection,
)

from models import (
    CommentRecord,
    SupportRequest,
    UpdateSupportRequest,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/staff",
    tags=["Staff"]
)


# ============================================================
# HELPER
# ============================================================

def get_staff_user_id(current_user: dict) -> str:
    """
    Get the logged-in Staff user's ID.

    The JWT created during login contains user_id.
    """

    user_id = current_user.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authenticated user ID not found"
        )

    return user_id


# ============================================================
# DEPARTMENTS
# ============================================================

@router.get("/departments")
def get_departments(
    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    departments = list(
        department_collection.find(
            {},
            {
                "_id": 0
            }
        ).sort(
            "name",
            1
        )
    )

    return {
        "count": len(departments),
        "departments": departments,
    }


# ============================================================
# CATEGORIES
# ============================================================

@router.get("/categories")
def get_categories(
    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    categories = list(
        category_collection.find(
            {},
            {
                "_id": 0
            }
        ).sort(
            "name",
            1
        )
    )

    return {
        "count": len(categories),
        "categories": categories,
    }


# ============================================================
# CREATE SUPPORT REQUEST
# ============================================================

@router.post("/requests")
def create_support_request(
    request: SupportRequest,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    # --------------------------------------------------------
    # Logged-in Staff user
    # --------------------------------------------------------

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Check duplicate request ID
    # --------------------------------------------------------

    if request_collection.find_one(
        {
            "request_id":
                request.request_id
        }
    ) is not None:

        raise HTTPException(
            status_code=400,
            detail="Request ID already exists"
        )


    # --------------------------------------------------------
    # Department selected by Staff
    #
    # IMPORTANT:
    # Staff can select ANY department.
    # We DO NOT use current_user["department"].
    # --------------------------------------------------------

    department = request.department


    # --------------------------------------------------------
    # Check selected department exists
    # --------------------------------------------------------

    if department_collection.find_one(
        {
            "name":
                department
        }
    ) is None:

        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )


    # --------------------------------------------------------
    # Check category exists
    # --------------------------------------------------------

    if category_collection.find_one(
        {
            "name":
                request.category
        }
    ) is None:

        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )


    # --------------------------------------------------------
    # Create request
    # --------------------------------------------------------

    request_data = {

        "request_id":
            request.request_id,

        "title":
            request.title,

        "description":
            request.description,

        "category":
            request.category,

        # Department selected for THIS request
        "department":
            department,

        "priority":
            request.priority,

        # Initial status
        "status":
            "NEW",

        # No engineer assigned initially
        "assigned_to":
            None,

        "assigned_by":
            None,

        # IMPORTANT:
        # This identifies who created the request.
        "created_by":
            staff_user_id,

        "created_at":
            datetime.utcnow(),

        "updated_at":
            datetime.utcnow(),
    }


    # --------------------------------------------------------
    # Save request
    # --------------------------------------------------------

    request_collection.insert_one(
        request_data
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "message":
            "Support request created successfully",

        "request_id":
            request.request_id,

        "status":
            "NEW",

        "department":
            department,

        "created_by":
            staff_user_id,
    }


# ============================================================
# GET MY REQUESTS BY DEPARTMENT
# ============================================================
#
# This endpoint is retained for compatibility.
#
# BUT:
#
# It no longer checks:
#
#     current_user["department"]
#
# Instead it checks:
#
#     created_by == current user's ID
#
# ============================================================

@router.get(
    "/requests/department/{department}"
)
def get_department_requests(
    department: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Check department exists
    # --------------------------------------------------------

    if department_collection.find_one(
        {
            "name":
                department
        }
    ) is None:

        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )


    # --------------------------------------------------------
    # Get ONLY requests created by this Staff user
    # in the selected department.
    # --------------------------------------------------------

    requests = list(
        request_collection.find(
            {
                "created_by":
                    staff_user_id,

                "department":
                    department,
            },
            {
                "_id": 0
            }
        ).sort(
            "created_at",
            -1
        )
    )


    return {

        "department":
            department,

        "count":
            len(requests),

        "requests":
            requests,
    }


# ============================================================
# GET MY REQUESTS BY STATUS
# ============================================================

@router.get(
    "/requests/status/{status}"
)
def get_requests_by_status(
    status: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    requests = list(
        request_collection.find(
            {
                "created_by":
                    staff_user_id,

                "status":
                    status.upper(),
            },
            {
                "_id": 0
            }
        ).sort(
            "created_at",
            -1
        )
    )


    return {

        "status":
            status.upper(),

        "count":
            len(requests),

        "requests":
            requests,
    }


# ============================================================
# GET MY REQUESTS BY PRIORITY
# ============================================================

@router.get(
    "/requests/priority/{priority}"
)
def get_requests_by_priority(
    priority: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    requests = list(
        request_collection.find(
            {
                "created_by":
                    staff_user_id,

                "priority":
                    priority.upper(),
            },
            {
                "_id": 0
            }
        ).sort(
            "created_at",
            -1
        )
    )


    return {

        "priority":
            priority.upper(),

        "count":
            len(requests),

        "requests":
            requests,
    }


# ============================================================
# GET MY REQUESTS
# ============================================================
#
# This is the important endpoint for the Staff frontend.
#
# It returns every request created by the logged-in Staff user,
# regardless of which department was selected.
#
# Example:
#
# Staff user 0001 creates:
#
#   REQ001 -> OPD
#   REQ002 -> Emergency
#   REQ003 -> Cardiology
#   REQ004 -> ICU
#
# /staff/requests/my
#
# returns all four.
#
# ============================================================

@router.get(
    "/requests/my"
)
def get_my_requests(
    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    requests = list(
        request_collection.find(
            {
                "created_by":
                    staff_user_id,
            },
            {
                "_id": 0
            }
        ).sort(
            "created_at",
            -1
        )
    )


    return {

        "count":
            len(requests),

        "requests":
            requests,
    }


# ============================================================
# GET SINGLE REQUEST
# ============================================================

@router.get(
    "/requests/{request_id}"
)
def get_request_by_id(
    request_id: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Find request
    # --------------------------------------------------------

    request = request_collection.find_one(
        {
            "request_id":
                request_id
        },
        {
            "_id": 0
        }
    )


    if request is None:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    # --------------------------------------------------------
    # Security:
    # Staff can only view requests they created.
    # --------------------------------------------------------

    if request.get(
        "created_by"
    ) != staff_user_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You can only view your own "
                "support requests"
            )
        )


    return request


# ============================================================
# UPDATE REQUEST
# ============================================================

@router.put(
    "/requests/{request_id}"
)
def update_support_request(
    request_id: str,

    request: UpdateSupportRequest,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Find request
    # --------------------------------------------------------

    existing_request = request_collection.find_one(
        {
            "request_id":
                request_id
        }
    )


    if existing_request is None:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    # --------------------------------------------------------
    # Security:
    # Only creator can update.
    # --------------------------------------------------------

    if existing_request.get(
        "created_by"
    ) != staff_user_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You can only edit your own "
                "support requests"
            )
        )


    # --------------------------------------------------------
    # Closed requests cannot be updated
    # --------------------------------------------------------

    if existing_request.get(
        "status"
    ) == "CLOSED":

        raise HTTPException(
            status_code=400,
            detail="Closed request cannot be updated"
        )


    # --------------------------------------------------------
    # Check category
    # --------------------------------------------------------

    if category_collection.find_one(
        {
            "name":
                request.category
        }
    ) is None:

        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )


    # --------------------------------------------------------
    # Update
    # --------------------------------------------------------

    request_collection.update_one(

        {
            "request_id":
                request_id
        },

        {
            "$set": {

                "title":
                    request.title,

                "description":
                    request.description,

                "category":
                    request.category,

                "priority":
                    request.priority,

                "updated_at":
                    datetime.utcnow(),
            }
        }
    )


    return {

        "message":
            "Support request updated successfully",

        "request_id":
            request_id,
    }


# ============================================================
# DELETE / CANCEL REQUEST
# ============================================================

@router.delete(
    "/requests/{request_id}"
)
def delete_support_request(
    request_id: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Find request
    # --------------------------------------------------------

    existing_request = request_collection.find_one(
        {
            "request_id":
                request_id
        }
    )


    if existing_request is None:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    # --------------------------------------------------------
    # Security:
    # Only creator can delete.
    # --------------------------------------------------------

    if existing_request.get(
        "created_by"
    ) != staff_user_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You can only delete your own "
                "support requests"
            )
        )


    # --------------------------------------------------------
    # Only NEW requests can be deleted
    # --------------------------------------------------------

    if existing_request.get(
        "status"
    ) != "NEW":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only NEW requests can be deleted. "
                "Requests already assigned or being "
                "processed cannot be deleted."
            )
        )


    # --------------------------------------------------------
    # Delete
    # --------------------------------------------------------

    request_collection.delete_one(
        {
            "request_id":
                request_id
        }
    )


    return {

        "message":
            "Support request deleted successfully",

        "request_id":
            request_id,
    }


# ============================================================
# COMMENTS
# ============================================================

# ------------------------------------------------------------
# Add comment
# ------------------------------------------------------------

@router.post(
    "/requests/{request_id}/comments"
)
def add_request_comment(
    request_id: str,

    data: CommentRecord,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Find request
    # --------------------------------------------------------

    existing_request = request_collection.find_one(
        {
            "request_id":
                request_id
        }
    )


    if existing_request is None:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    # --------------------------------------------------------
    # Security:
    # Only creator can comment.
    # --------------------------------------------------------

    if existing_request.get(
        "created_by"
    ) != staff_user_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You can only comment on your own "
                "support requests"
            )
        )


    # --------------------------------------------------------
    # Check user
    # --------------------------------------------------------

    if user_collection.find_one(
        {
            "user_id":
                data.user_id
        }
    ) is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    # --------------------------------------------------------
    # Insert comment
    # --------------------------------------------------------

    comments_collection.insert_one(
        {

            "request_id":
                request_id,

            "user_id":
                data.user_id,

            "comment":
                data.comment,

            "created_at":
                datetime.utcnow(),
        }
    )


    return {

        "message":
            "Comment added successfully",

        "request_id":
            request_id,
    }


# ------------------------------------------------------------
# Get comments
# ------------------------------------------------------------

@router.get(
    "/requests/{request_id}/comments"
)
def get_request_comments(
    request_id: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Find request
    # --------------------------------------------------------

    existing_request = request_collection.find_one(
        {
            "request_id":
                request_id
        }
    )


    if existing_request is None:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    # --------------------------------------------------------
    # Security
    # --------------------------------------------------------

    if existing_request.get(
        "created_by"
    ) != staff_user_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You can only view comments on "
                "your own support requests"
            )
        )


    # --------------------------------------------------------
    # Get comments
    # --------------------------------------------------------

    comments = list(
        comments_collection.find(
            {
                "request_id":
                    request_id
            },
            {
                "_id": 0
            }
        ).sort(
            "created_at",
            1
        )
    )


    return {

        "request_id":
            request_id,

        "count":
            len(comments),

        "comments":
            comments,
    }


# ============================================================
# DEPARTMENT SUMMARY
# ============================================================
#
# The department is selected by the Staff user.
#
# This summary therefore shows requests created by the
# logged-in Staff user for that selected department.
#
# ============================================================

@router.get(
    "/summary/{department}"
)
def get_department_summary(
    department: str,

    current_user: dict = Depends(
        require_role(ROLE_DEPARTMENT_STAFF)
    ),
):

    staff_user_id = get_staff_user_id(
        current_user
    )


    # --------------------------------------------------------
    # Check department
    # --------------------------------------------------------

    if department_collection.find_one(
        {
            "name":
                department
        }
    ) is None:

        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )


    # --------------------------------------------------------
    # Statuses
    # --------------------------------------------------------

    statuses = [

        "NEW",

        "ASSIGNED",

        "IN_PROGRESS",

        "ON_HOLD",

        "RESOLVED",

        "CONFIRMED",

        "CLOSED",

        "CANCELLED",

    ]


    # --------------------------------------------------------
    # Count only this Staff user's requests
    # --------------------------------------------------------

    counts = {

        status:

            request_collection.count_documents(
                {

                    "created_by":
                        staff_user_id,

                    "department":
                        department,

                    "status":
                        status,

                }
            )

        for status in statuses
    }


    return {

        "department":
            department,

        "total_requests":
            sum(
                counts.values()
            ),

        "requests":
            counts,
    }


# ============================================================
# HEALTH CHECK
# ============================================================
#
# Public / unauthenticated on purpose.
# Useful for checking API + MongoDB connection.
#
# ============================================================

@router.get(
    "/health"
)
def staff_health_check():

    try:

        client.admin.command(
            "ping"
        )


        collections = (
            db.list_collection_names()
        )


        return {

            "status":
                "healthy",

            "database":
                db.name,

            "mongodb":
                "connected",

            "collections": {

                name:
                    name in collections

                for name in [

                    "users",

                    "departments",

                    "categories",

                    "requests",

                    "comments",

                    "audit_logs",

                ]

            },

        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Database connection failed: "
                f"{str(e)}"
            )
        )