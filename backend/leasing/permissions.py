from rest_framework import permissions


MANAGEMENT_ROLES = ("ADMIN", "LANDLORD", "ESTATE_MANAGER")
FINANCE_ROLES = ("ADMIN", "LANDLORD", "ESTATE_MANAGER", "ACCOUNTANT")
READONLY_ROLES = ("ADMIN", "LANDLORD", "ESTATE_MANAGER", "CARETAKER", "ACCOUNTANT", "AGENT")
TENANT_ROLES = ("TENANT", "SUB_TENANT")


class CanManageLease(permissions.BasePermission):
    message = "Only admins, landlords, or estate managers can manage leases."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return getattr(user, "role", None) in READONLY_ROLES + TENANT_ROLES

        return getattr(user, "role", None) in MANAGEMENT_ROLES

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if request.method in permissions.SAFE_METHODS:
            if role == "ADMIN":
                return True
            if role == "LANDLORD":
                return obj.room.house.estate.landlord_id == user.id
            if role == "ESTATE_MANAGER":
                return obj.room.house.estate.manager_id == user.id
            if role == "CARETAKER":
                return obj.room.house.estate.caretaker_id == user.id
            if role in ("ACCOUNTANT", "AGENT"):
                return True
            if role in TENANT_ROLES:
                return obj.tenant_id == user.id or obj.room.house.main_tenant_id == user.id
            return False

        if role == "ADMIN":
            return True
        if role == "LANDLORD":
            return obj.room.house.estate.landlord_id == user.id
        if role == "ESTATE_MANAGER":
            return obj.room.house.estate.manager_id == user.id

        return False


class CanManageInvoice(permissions.BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return getattr(user, "role", None) in READONLY_ROLES + TENANT_ROLES

        return getattr(user, "role", None) in FINANCE_ROLES

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if request.method in permissions.SAFE_METHODS:
            if role == "ADMIN":
                return True
            if role == "LANDLORD":
                return obj.lease.room.house.estate.landlord_id == user.id
            if role == "ESTATE_MANAGER":
                return obj.lease.room.house.estate.manager_id == user.id
            if role == "CARETAKER":
                return obj.lease.room.house.estate.caretaker_id == user.id
            if role in ("ACCOUNTANT", "AGENT"):
                return True
            if role in TENANT_ROLES:
                return obj.lease.tenant_id == user.id
            return False

        if role == "ADMIN":
            return True
        if role == "LANDLORD":
            return obj.lease.room.house.estate.landlord_id == user.id
        if role == "ESTATE_MANAGER":
            return obj.lease.room.house.estate.manager_id == user.id
        if role == "ACCOUNTANT":
            return True

        return False