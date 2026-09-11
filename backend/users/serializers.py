from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone_number",
            "alternate_phone",
            "national_id",
            "id_type",
            "kra_pin",
            "profile_pic",
            "date_of_birth",
            "emergency_contact_name",
            "emergency_contact_phone",
            "is_verified",
            "created_at",
        )
        read_only_fields = ("id", "role", "is_verified", "created_at")

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[
            User.Role.TENANT,
            User.Role.SUB_TENANT,
            User.Role.LANDLORD,
            User.Role.ESTATE_MANAGER,
            User.Role.CARETAKER,
            User.Role.AGENT,
        ],
        default=User.Role.SUB_TENANT,
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "password_confirm",
            "role",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def validate_phone_number(self, value):
        digits = "".join(ch for ch in str(value) if ch.isdigit())
        if digits.startswith("0"):
            digits = "254" + digits[1:]
        elif digits.startswith("7") or digits.startswith("1"):
            digits = "254" + digits
        if len(digits) != 12 or not digits.startswith("254"):
            raise serializers.ValidationError("Enter a valid Kenyan phone number.")
        if User.objects.filter(phone_number=digits).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return digits

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            "user": UserSerializer(instance).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError({"detail": "Invalid username or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account has been disabled."})

        refresh = RefreshToken.for_user(user)
        return {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class EstateManagerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)