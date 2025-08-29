from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Transaction  ,Matchess
class UserSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True, min_length=8,style={'input_type':'password'})
    class Meta:
        model=User
        fields=['username','email','password']
        
    def create(self,validated_data):
        #
        user=User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
            
        )
        
        return user 
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['transaction_type', 'amount', 'timestamp']     

class MatchessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Matchess
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.img:
            representation['img'] = instance.img.url  # 👈 correct way
        return representation
