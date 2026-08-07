from rest_framework import serializers
from .models import Estate, House, Room

class RoomSerializer(serializers.ModelSerializer):
    house_number = serializers.CharField(source='house.house_number', read_only=True)
    
    class Meta:
        model = Room
        fields = ('id', 'room_name', 'is_occupied', 'house', 'house_number')

class HouseSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    estate_name = serializers.CharField(source='estate.name', read_only=True)
    estate_id = serializers.IntegerField(source='estate.id', read_only=True)
    
    class Meta:
        model = House
        fields = ('id', 'house_number', 'estate', 'estate_name', 'estate_id', 'main_tenant', 'rooms')

class EstateSerializer(serializers.ModelSerializer):
    houses = HouseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Estate
        fields = ('id', 'name', 'location', 'total_units', 'manager', 'houses')
