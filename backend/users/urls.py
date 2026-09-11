from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    EstateManagerListView,
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    UserListView,
)

app_name = "users"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("verify/", TokenVerifyView.as_view(), name="token-verify"),

    path("profile/", ProfileView.as_view(), name="profile"),
    path("me/", ProfileView.as_view(), name="me"),

    path("list/", UserListView.as_view(), name="user-list"),
    path("managers/", EstateManagerListView.as_view(), name="estate-manager-list"),
]