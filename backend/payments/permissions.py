from rest_framework import permissions


class IsTransactionOwnerOrManager(permissions.BasePermission):
    message = "You do not have permission to view this transaction."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if role in ("ADMIN", "ACCOUNTANT"):
            return True

        if role == "LANDLORD":
            invoice = getattr(obj, "invoice", None)
            if not invoice:
                return False
            return invoice.lease.room.house.estate.landlord_id == user.id

        if role == "ESTATE_MANAGER":
            invoice = getattr(obj, "invoice", None)
            if not invoice:
                return False
            return invoice.lease.room.house.estate.manager_id == user.id

        if role in ("TENANT", "SUB_TENANT"):
            if obj.tenant_id == user.id:
                return True

            invoice = getattr(obj, "invoice", None)
            if not invoice:
                return False

            return invoice.lease.room.house.main_tenant_id == user.id

        return False