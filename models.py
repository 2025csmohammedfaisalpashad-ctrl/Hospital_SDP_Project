# ============================================================
# REQUEST MODELS
# ============================================================
# Each of these used to be declared 2-4 times across the original
# files (sometimes with different fields, e.g. "Assignment" with
# assigned_to vs "RequestAssignment" with engineer_id, for the same
# action). Declared once here and imported everywhere so every role
# speaks the same shape.

from pydantic import BaseModel


class SupportRequest(BaseModel):
    request_id: str
    title: str
    description: str
    category: str
    department: str
    priority: str


class UpdateSupportRequest(BaseModel):
    title: str
    description: str
    category: str
    priority: str


class RequestStatusUpdate(BaseModel):
    status: str


class RequestAssignment(BaseModel):
    engineer_id: str


class CommentRecord(BaseModel):
    # request_id is NOT included here on purpose — it comes from the
    # URL path, not the body, so the two can never disagree.
    user_id: str
    comment: str


class AuditLogRecord(BaseModel):
    user_id: str
    action: str
    description: str
    target_type: str
    target_id: str


class UserRecord(BaseModel):
    user_id: str
    name: str
    username: str
    role: str
    department: str


class DepartmentRecord(BaseModel):
    name: str
    description: str


class CategoryRecord(BaseModel):
    name: str
    description: str
