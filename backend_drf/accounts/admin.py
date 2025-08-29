from django.contrib import admin
# 👇 1. Import the WithdrawalRequest model
from .models import UserProfile,  Transaction, DepositRequest, WithdrawalRequest,Contact,OTP,Matchess

# Register your models here.
admin.site.register(UserProfile)
# admin.site.register(Match)
# admin.site.register(Bet)
admin.site.register(Transaction)
admin.site.register(OTP)
@admin.register(Matchess)
class MatchessAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Matchess model.
    """
    # Fields to display in the list view of the admin panel
    list_display = ('match_name', 'Team1', 'Team2', 'date', 'time', 'match_status')
    
    # Fields that can be used to filter the matches
    list_filter = ('match_status', 'date')
    
    # Fields that can be searched
    search_fields = ('match_name', 'Team1', 'Team2')
    
    # Allows editing the status directly from the list view
    list_editable = ('match_status',)
@admin.register(DepositRequest)
class DepositRequestAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'amount', 'status', 'timestamp')
    list_filter = ('status',)
    search_fields = ('user_profile__user__username',)
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)

# 👇 2. Uncomment this entire block to register the model
@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'amount', 'status', 'timestamp')
    list_filter = ('status',)
    search_fields = ('user_profile__user__username',)
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'resolved')
    list_filter = ('resolved',)
    search_fields = ('user__username', 'message')
    readonly_fields = ('user', 'message', 'timestamp')

