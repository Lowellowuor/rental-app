from django.db import transaction
from rest_framework import serializers

from .models import Estate, House, Room


class RoomSerializer(serializers.ModelSerializer):
    house_number = serializers.CharField(source="house.house_number", read_only=True)
    estate_id = serializers.IntegerField(source="house.estate_id", read_only=True)
    estate_name = serializers.CharField(source="house.estate.name", read_only=True)

    class Meta:
        model = Room
        fields = (
            "id",
            "room_name",
            "is_occupied",
            "house",
            "house_number",
            "estate_id",
            "estate_name",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class RoomListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ("id", "room_name", "is_occupied")


class HouseSerializer(serializers.ModelSerializer):
    rooms = RoomListSerializer(many=True, read_only=True)
    estate_name = serializers.CharField(source="estate.name", read_only=True)
    estate_id = serializers.IntegerField(source="estate.id", read_only=True)
    tenant_username = serializers.CharField(source="main_tenant.username", read_only=True, default=None)
    room_count = serializers.SerializerMethodField()

    class Meta:
        model = House
        fields = (
            "id",
            "house_number",
            "estate",
            "estate_name",
            "estate_id",
            "main_tenant",
            "tenant_username",
            "room_count",
            "rooms",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_room_count(self, obj):
        return obj.rooms.count()

    def validate(self, attrs):
        estate = attrs.get("estate") or getattr(self.instance, "estate", None)
        house_number = attrs.get("house_number") or getattr(self.instance, "house_number", None)

        if estate and house_number:
            qs = House.objects.filter(estate=estate, house_number=house_number)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    "house_number": "This house number already exists in this estate."
                })

        return attrs


class HouseListSerializer(serializers.ModelSerializer):
    estate_name = serializers.CharField(source="estate.name", read_only=True)
    tenant_username = serializers.CharField(source="main_tenant.username", read_only=True, default=None)

    class Meta:
        model = House
        fields = ("id", "house_number", "estate", "estate_name", "main_tenant", "tenant_username")


class EstateManagerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)


class EstateListSerializer(serializers.ModelSerializer):
    house_count = serializers.IntegerField(read_only=True)
    manager_name = serializers.CharField(source="manager.username", read_only=True, default=None)

    class Meta:
        model = Estate
        fields = (
            "id",
            "name",
            "location",
            "total_units",
            "house_count",
            "manager",
            "manager_name",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class EstateDetailSerializer(serializers.ModelSerializer):
    houses = HouseListSerializer(many=True, read_only=True)
    house_count = serializers.IntegerField(read_only=True)
    manager_name = serializers.CharField(source="manager.username", read_only=True, default=None)

    class Meta:
        model = Estate
        fields = (
            "id",
            "name",
            "location",
            "total_units",
            "house_count",
            "manager",
            "manager_name",
            "houses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class EstateCreateSerializer(serializers.ModelSerializer):
    house_count = serializers.IntegerField(
        write_only=True,
        required=False,
        default=0,
        min_value=0,
        max_value=1000,
    )
    units_per_house = serializers.IntegerField(
        write_only=True,
        required=False,
        default=0,
        min_value=0,
        max_value=50,
    )

    class Meta:
        model = Estate
        fields = (
            "id",
            "name",
            "location",
            "total_units",
            "manager",
            "house_count",
            "units_per_house",
        )
        extra_kwargs = {
            "name": {"max_length": 120, "trim_whitespace": True},
            "location": {"max_length": 200, "trim_whitespace": True},
            "total_units": {"min_value": 0, "max_value": 10000},
            "manager": {"required": False, "allow_null": True},
        }

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Use at least 3 characters.")
        return value.strip()

    def validate_manager(self, value):
        if value is not None and getattr(value, "role", None) != "ESTATE_MANAGER":
            raise serializers.ValidationError("Selected user is not an estate manager.")
        return value

    def validate(self, attrs):
        name = attrs["name"]
        location = attrs["location"]
        house_count = attrs.get("house_count", 0)

        if house_count > attrs["total_units"]:
            raise serializers.ValidationError({
                "house_count": f"Cannot exceed total units ({attrs['total_units']})."
            })

        qs = Estate.objects.filter(name__iexact=name, location__iexact=location)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({
                "name": "An estate with this name already exists in this location."
            })

        return attrs

    def create(self, validated_data):
        house_count = validated_data.pop("house_count", 0)
        units_per_house = validated_data.pop("units_per_house", 0)
        request = self.context["request"]

        with transaction.atomic():
            estate = Estate.objects.create(
                created_by=request.user if request.user.is_authenticated else None,
                **validated_data,
            )

            if house_count:
                houses = House.objects.bulk_create(
                    [
                        House(estate=estate, house_number=f"Unit {i}", main_tenant=None)
                        for i in range(1, house_count + 1)
                    ],
                    batch_size=500,
                )

                if units_per_house:
                    House.objects.bulk_create(houses, batch_size=500)
                    rooms = []
                    for house in houses:
                        for r in range(1, units_per_house + 1):
                            rooms.append(Room(house=house, room_name=f"Room {r}"))

                    Room.objects.bulk_create(rooms, batch_size=1000)

        return estate

    def update(self, instance, validated_data):
        validated_data.pop("house_count", None)
        validated_data.pop("units_per_house", None)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        return EstateDetailSerializer(instance, context=self.context).data