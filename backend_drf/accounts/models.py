# File: accounts/models.py

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db.models import F
# from django.core.exceptions import ValidationError

# --- CORE MODELS ---

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.user.username

class DepositRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='deposit_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    otp_provided = models.CharField(max_length=10)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request by {self.user_profile.user.username} for {self.amount} - Status: {self.status}"

class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='withdrawal_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    timestamp = models.DateTimeField(auto_now_add=True)
    otp_provided = models.CharField(max_length=10, default='N/A')

    def __str__(self):
        return f"Withdrawal Request by {self.user_profile.user.username} for {self.amount} - Status: {self.status}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdraw', 'Withdraw'),
        ('withdraw_reversal', 'Withdrawal Reversal'),
        ('bet_placed', 'Bet Placed'),
        ('bet_won', 'Bet Won'),
    ]
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    deposit_request = models.OneToOneField(DepositRequest, on_delete=models.SET_NULL, null=True, blank=True)
    withdrawal_request = models.OneToOneField(WithdrawalRequest, on_delete=models.SET_NULL, null=True, blank=True)




class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"OTP for {self.user.username}"

class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contact_submissions')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    def __str__(self):
        return f"Query from {self.user.username}"

class CasinoBet(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='casino_bets')
    game_name = models.CharField(max_length=50)
    bet_amount = models.DecimalField(max_digits=10, decimal_places=2)
    winnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    multiplier = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.game_name} bet by {self.user_profile.user.username}"

# --- AUTOMATION SIGNALS ---

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    instance.profile.save()

@receiver(post_save, sender=DepositRequest)
def on_deposit_request_approved(sender, instance, created, **kwargs):
    if not created and instance.status == 'approved':
        if not Transaction.objects.filter(deposit_request=instance).exists():
            profile = instance.user_profile
            profile.balance = F('balance') + instance.amount
            profile.save()
            Transaction.objects.create(
                user_profile=profile,
                transaction_type='deposit',
                amount=instance.amount,
                deposit_request=instance
            )

@receiver(pre_save, sender=WithdrawalRequest)
def on_withdrawal_request_rejection(sender, instance, **kwargs):
    if instance.pk:
        try:
            original_instance = WithdrawalRequest.objects.get(pk=instance.pk)
        except WithdrawalRequest.DoesNotExist:
            return
        if original_instance.status == 'pending' and instance.status == 'rejected':
            profile = instance.user_profile
            profile.balance = F('balance') + instance.amount
            profile.save()
            Transaction.objects.create(
                user_profile=profile,
                transaction_type='withdraw_reversal',
                amount=instance.amount
            )

@receiver(post_save, sender=WithdrawalRequest)
def on_withdrawal_request_approved(sender, instance, created, **kwargs):
    if not created and instance.status == 'approved':
        if not Transaction.objects.filter(withdrawal_request=instance).exists():
            Transaction.objects.create(
                user_profile=instance.user_profile,
                transaction_type='withdraw',
                amount=instance.amount,
                withdrawal_request=instance
            )

# 🚨 THIS IS THE NEW SIGNAL THAT FIXES THE HISTORY 🚨
@receiver(post_save, sender=CasinoBet)
def create_casino_transactions(sender, instance, created, **kwargs):
    """
    This signal automatically creates transaction records every time a new
    CasinoBet is saved.
    """
    if created:
        # 1. Create the 'bet_placed' transaction
        Transaction.objects.create(
            user_profile=instance.user_profile,
            transaction_type='bet_placed',
            amount=instance.bet_amount
        )
        # 2. If there were winnings, create the 'bet_won' transaction
        if instance.winnings > 0:
            Transaction.objects.create(
                user_profile=instance.user_profile,
                transaction_type='bet_won',
                amount=instance.winnings
            )
class Matchess(models.Model):
    match_id = models.IntegerField(unique=True)
    match_name = models.CharField(max_length=100)
    Team1 = models.CharField(max_length=50)
    Team2 = models.CharField(max_length=50)
    TEAM_CHOICES = [('Team1', 'Team1'),('Team2', 'Team2'),]
    winner_team = models.CharField(max_length=10, choices=TEAM_CHOICES, blank=True, null=True)
    date = models.DateField()
    time = models.TimeField()
    STATUS_CHOICES = [('UpComing', 'UpComing'),('Active', 'Active'),('Completed', 'Completed'),]
    match_status = models.CharField(default='UpComing', choices=STATUS_CHOICES)
    img = models.ImageField(upload_to='images/')
    url = models.URLField()

    def __str__(self):
        return self.match_name
    
   
