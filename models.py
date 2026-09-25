# ============================================================
# REQUEST MODELS
# ============================================================
# Shared Pydantic models used by the FastAPI backend.
# Keeping each model in one place ensures that all role-based
# routes use the same request/response structure.
# ============================================================

from pydantic import BaseModel


# ============================================================
# SUPPORT REQUEST
# ============================================================

class SupportRequest(BaseModel):
    request_id: str
    title: str
    description: str
    category: str
    department: str
    priority: str


# ============================================================
# UPDATE SUPPORT REQUEST
# ============================================================

class UpdateSupportRequest(BaseModel):
    title: str
    description: str
    category: str
    priority: str


# ============================================================
# REQUEST STATUS UPDATE
# ============================================================

class RequestStatusUpdate(BaseModel):
    status: str


# ============================================================
# REQUEST ASSIGNMENT
# ============================================================

class RequestAssignment(BaseModel):
    engineer_id: str


# ============================================================
# COMMENT
# ============================================================

class CommentRecord(BaseModel):
    # request_id comes from the URL path.
    # It is intentionally not included in the body.
    user_id: str
    comment: str


# ============================================================
# AUDIT LOG
# ============================================================

class AuditLogRecord(BaseModel):
    user_id: str
    action: str
    description: str
    target_type: str
    target_id: str


# ============================================================
# USER RECORD
# ============================================================
# Used when updating an existing user.
# Password is intentionally not included here because this
# model does not modify passwords.
# ============================================================

class UserRecord(BaseModel):
    user_id: str
    name: str
    username: str
    role: str
    department: str


# ============================================================
# USER CREATE
# ============================================================
# Used by Admin when creating a user.
# ============================================================

class UserCreate(UserRecord):
    password: str


# ============================================================
# REGISTER REQUEST
# ============================================================
# Used by the public registration page.
#
# Department is optional because a user can register without
# being permanently tied to one department.
#
# The department can be selected later when creating a
# support request.
# ============================================================

class RegisterRequest(BaseModel):
    user_id: str
    name: str
    username: str
    password: str
    role: str
    department: str | None = None


# ============================================================
# LOGIN REQUEST
# ============================================================

class LoginRequest(BaseModel):
    username: str
    password: str


# ============================================================
# TOKEN RESPONSE
# ============================================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    name: str
    department: str | None = None


# ============================================================
# DEPARTMENT
# ============================================================

class DepartmentRecord(BaseModel):
    name: str
    description: str


# ============================================================
# CATEGORY
# ============================================================

class CategoryRecord(BaseModel):
    name: str
    description: str