from django.urls import path
from .views import RegisterView, LoginView, LogoutView, ProfileView, UserListView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
