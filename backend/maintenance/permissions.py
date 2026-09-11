from rest_framework import permissions


STAFF_ROLES = ("ADMIN", "LANDLORD", "ESTATE_MANAGER", "CARETAKER")
READONLY_ROLES = ("ADMIN", "LANDLORD", "ESTATE_MANAGER", "CARETAKER", "ACCOUNTANT", "AGENT")
TENANT_ROLES = ("TENANT", "SUB_TENANT")


class CanManageTicket(permissions.BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        role = getattr(user, "role", None)

        if request.method in permissions.SAFE_METHODS:
            return role in READONLY_ROLES + TENANT_ROLES

        if request.method == "POST":
            return role in STAFF_ROLES + TENANT_ROLES

        if request.method in ("PUT", "PATCH", "DELETE"):
            return role in STAFF_ROLES + TENANT_ROLES

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if role == "ADMIN":
            return True

        if role == "LANDLORD":
            return obj.estate and obj.estate.landlord_id == user.id

        if role == "ESTATE_MANAGER":
            return obj.estate and obj.estate.manager_id == user.id

        if role == "CARETAKER":
            return obj.estate and obj.estate.caretaker_id == user.id

        if role in ("ACCOUNTANT", "AGENT"):
            return request.method in permissions.SAFE_METHODS

        if role in TENANT_ROLES:
            if obj.tenant_id == user.id:
                return True
            if request.method in permissions.SAFE_METHODS and obj.house and obj.house.main_tenant_id == user.id:
                return True
            return False

        return False


class CanUpdateTicketStatus(permissions.BasePermission):
    message = "Only staff can update ticket status."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        return getattr(user, "role", None) in STAFF_ROLES

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if role == "ADMIN":
            return True

        if role == "LANDLORD":
            return obj.estate and obj.estate.landlord_id == user.id

        if role == "ESTATE_MANAGER":
            return obj.estate and obj.estate.manager_id == user.id

        if role == "CARETAKER":
            return obj.estate and obj.estate.caretaker_id == user.id

        return False