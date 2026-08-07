from rest_framework import permissions

class IsMainTenantOrLeaseHolder(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Main tenants can manage leases for their houses
        if request.user.role == 'MAIN_TENANT':
            return obj.room.house.main_tenant == request.user
        
        # Sub-tenants can only view their own lease
        if request.user.role == 'SUB_TENANT':
            return obj.sub_tenant == request.user
        
        # Estate managers and super admins have full access
        return request.user.role in ['ESTATE_MANAGER', 'SUPER_ADMIN']

    def has_permission(self, request, view):
        # Allow authenticated users to view, but only specific roles to create
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Only MAIN_TENANT, ESTATE_MANAGER, or SUPER_ADMIN can create leases
        return request.user.is_authenticated and request.user.role in ['MAIN_TENANT', 'ESTATE_MANAGER', 'SUPER_ADMIN']
