from rest_framework import permissions


PROPERTY_ADMINS = ("ADMIN", "LANDLORD", "ESTATE_MANAGER")
PROPERTY_VIEWERS = ("ADMIN", "LANDLORD", "ESTATE_MANAGER", "CARETAKER", "AGENT", "ACCOUNTANT")
TENANT_ROLES = ("TENANT", "SUB_TENANT")


class IsEstateManagerOrReadOnly(permissions.BasePermission):
    message = "Only estate managers, landlords, or admins can perform this action."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not (user and user.is_authenticated):
            return False

        return getattr(user, "role", None) in PROPERTY_ADMINS

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not (user and user.is_authenticated):
            return False

        role = getattr(user, "role", None)

        if role == "ADMIN":
            return True

        estate = getattr(obj, "estate", obj)

        if role == "LANDLORD":
            return estate.landlord_id == user.id

        if role == "ESTATE_MANAGER":
            return estate.manager_id == user.id

        return False


class CanViewProperty(permissions.BasePermission):
    message = "You do not have permission to view this property."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return getattr(user, "role", None) in PROPERTY_VIEWERS + TENANT_ROLES

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if role == "ADMIN":
            return True

        estate = getattr(obj, "estate", obj)

        if role == "LANDLORD":
            return estate.landlord_id == user.id

        if role == "ESTATE_MANAGER":
            return estate.manager_id == user.id

        if role == "CARETAKER":
            return estate.caretaker_id == user.id

        if role in ("AGENT", "ACCOUNTANT"):
            return True

        if role in TENANT_ROLES:
            house = getattr(obj, "house", None)
            if house is None:
                house = getattr(getattr(obj, "estate", None), "house", None)
            if house and house.main_tenant_id == user.id:
                return True
            return obj.main_tenant_id == user.id if hasattr(obj, "main_tenant_id") else False

        return False


class CanManageHouse(permissions.BasePermission):
    message = "Only estate managers, landlords, or admins can modify houses."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return getattr(user, "role", None) in PROPERTY_VIEWERS + TENANT_ROLES

        return getattr(user, "role", None) in PROPERTY_ADMINS


class CanManageRoom(permissions.BasePermission):
    message = "Only estate managers, landlords, or admins can modify rooms."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return getattr(user, "role", None) in PROPERTY_VIEWERS + TENANT_ROLES

        return getattr(user, "role", None) in PROPERTY_ADMINS


class IsAdminOrLandlord(permissions.BasePermission):
    message = "Only admins and landlords can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return getattr(user, "role", None) in ("ADMIN", "LANDLORD")


class IsCaretaker(permissions.BasePermission):
    message = "Only caretakers can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return getattr(user, "role", None) == "CARETAKER"