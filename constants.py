# ============================================================
# SHARED CONSTANTS
# Used by staff / engineer / team lead / admin routers alike,
# so every role agrees on the same category/status/role spellings.
# ============================================================

REQUEST_CATEGORIES = [
    "EQUIPMENT_ISSUE",
    "MAINTENANCE",
    "IT_ISSUE",
    "FACILITY_REQUEST",
]

REQUEST_STATUS = [
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "RESOLVED",
    "CLOSED",
    "CANCELLED",
]

# Roles are stored and checked in UPPERCASE everywhere in this system.
# Renamed STAFF -> DEPARTMENT_STAFF to match the 4 required roles exactly.
ROLE_DEPARTMENT_STAFF = "DEPARTMENT_STAFF"
ROLE_SUPPORT_ENGINEER = "SUPPORT_ENGINEER"
ROLE_TEAM_LEAD = "TEAM_LEAD"
ROLE_ADMIN = "ADMIN"

ALL_ROLES = [ROLE_DEPARTMENT_STAFF, ROLE_SUPPORT_ENGINEER, ROLE_TEAM_LEAD, ROLE_ADMIN]