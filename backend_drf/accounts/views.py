# File: accounts/views.py

from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import F, Sum
import random
import decimal
from django.utils import timezone
from datetime import timedelta
# from django.core.exceptions import ValidationError
from decimal import Decimal
from django.db import transaction # Import transaction module
# from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .scraper import get_live_score

# Import all necessary models and serializers
from .models import (
    UserProfile, DepositRequest, WithdrawalRequest, Contact, CasinoBet,OTP,Transaction,Matchess
)
from .serializers import UserSerializer, TransactionSerializer,MatchessSerializer

# --- HELPER FUNCTIONS ---

def create_casino_bet_and_transactions(user_profile, game_name, bet_amount, winnings):
    """
    Create a CasinoBet record. Transactions will be auto-created by the signal.
    """
    multiplier = 0
    if bet_amount > 0:
        multiplier = decimal.Decimal(winnings) / decimal.Decimal(bet_amount)

    CasinoBet.objects.create(
        user_profile=user_profile,
        game_name=game_name,
        bet_amount=bet_amount,
        winnings=winnings,
        multiplier=multiplier
    )

# --- CORE VIEWS ---

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({"message": "Registration successful"}, status=status.HTTP_201_CREATED, headers=headers)

class GenerateOTPView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        otp_code = random.randint(100000, 999999)
        expiration_time = timezone.now() + timedelta(minutes=5)
        OTP.objects.filter(user=user).delete()
        OTP.objects.create(user=user, code=str(otp_code), expires_at=expiration_time)
        return Response({'message': 'OTP generated.', 'otp': otp_code}, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        return Response({'username': request.user.username, 'balance': profile.balance})

class UserExposureView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user_profile = request.user.profile
        total_exposure = WithdrawalRequest.objects.filter(
            user_profile=user_profile, status='pending'
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        return Response({'exposure': total_exposure})

class ProtectedView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        return Response({'status':"Request was permitted because you are authenticated."})

# --- DEPOSIT WORKFLOW ---

class VerifyOtpAndCreateRequestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user, otp_code, amount = request.user, request.data.get('otp'), request.data.get('amount')
        try:
            otp_instance = OTP.objects.get(user=user, code=otp_code)
            if otp_instance.expires_at < timezone.now():
                otp_instance.delete()
                return Response({'error': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except OTP.DoesNotExist:
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount_decimal = decimal.Decimal(amount)
            if amount_decimal <= 0: raise ValueError("Amount must be positive.")
        except (ValueError, decimal.InvalidOperation):
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
        DepositRequest.objects.create(
            user_profile=user.profile, amount=amount_decimal,
            status='pending', otp_provided=otp_code
        )
        otp_instance.delete()
        return Response({'message': 'Deposit request sent successfully.'}, status=status.HTTP_201_CREATED)

class RejectDepositView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        amount, transaction_id = request.data.get('amount'), request.data.get('otp')
        try:
            amount_decimal = decimal.Decimal(amount)
            DepositRequest.objects.create(
                user_profile=request.user.profile, amount=amount_decimal,
                status='rejected', otp_provided=transaction_id or 'N/A'
            )
            return Response({'message': 'Request marked as rejected.'})
        except (ValueError, decimal.InvalidOperation):
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

class DepositHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        requests = DepositRequest.objects.filter(user_profile=request.user.profile).order_by('-timestamp')
        data = [{'id': req.id, 'amount': req.amount, 'status': req.status, 'created_at': timezone.localtime(req.timestamp).strftime('%d %b %Y, %I:%M %p'), 'transaction_id': req.otp_provided} for req in requests]
        return Response(data)

# --- WITHDRAWAL WORKFLOW ---

class CreateWithdrawalRequestView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user, otp_code, amount = request.user, request.data.get('otp'), request.data.get('amount')
        try:
            otp_instance = OTP.objects.get(user=user, code=otp_code)
            if otp_instance.expires_at < timezone.now():
                otp_instance.delete()
                return Response({'error': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except OTP.DoesNotExist:
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount_decimal = decimal.Decimal(amount)
            profile = user.profile
            if amount_decimal <= 0: raise ValueError("Amount must be positive.")
            if profile.balance < amount_decimal:
                return Response({'error': 'Insufficient funds.'}, status=status.HTTP_400_BAD_REQUEST)
            profile.balance = F('balance') - amount_decimal
            profile.save()
            WithdrawalRequest.objects.create(
                user_profile=profile, amount=amount_decimal,
                status='pending', otp_provided=otp_code
            )
            otp_instance.delete()
            return Response({'message': 'Withdrawal request sent successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return Response({'error': 'An unexpected server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RejectWithdrawalView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        amount, transaction_id = request.data.get('amount'), request.data.get('otp')
        try:
            amount_decimal = decimal.Decimal(amount)
            WithdrawalRequest.objects.create(
                user_profile=request.user.profile, amount=amount_decimal,
                status='rejected', otp_provided=transaction_id or 'N/A'
            )
            return Response({'message': 'Request marked as rejected.'})
        except (ValueError, decimal.InvalidOperation):
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

class WithdrawalHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        requests = WithdrawalRequest.objects.filter(user_profile=request.user.profile).order_by('-timestamp')
        data = [{'id': req.id, 'amount': req.amount, 'status': req.status, 'created_at': timezone.localtime(req.timestamp).strftime('%d %b %Y, %I:%M %p'), 'transaction_id': req.otp_provided} for req in requests]
        return Response(data)

# --- SPORTS BETTING ---






            
class MinesBetView(APIView):
    """
    Handles the initial bet for a game of Mines.
    Deducts the bet amount and creates the game grid in the user's session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            bet_amount = Decimal(request.data.get('amount'))
            num_mines = int(request.data.get('mines'))

            if not (1 <= num_mines <= 24):
                return Response({'error': 'Number of mines must be between 1 and 24.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if bet_amount <= 0:
                 return Response({'error': 'Invalid bet amount.'}, status=status.HTTP_400_BAD_REQUEST)

            # Use a transaction to ensure balance deduction and bet creation are atomic
            with transaction.atomic():
                # Lock the user's profile to prevent race conditions
                user_profile = UserProfile.objects.select_for_update().get(user=request.user)

                if user_profile.balance < bet_amount:
                    return Response({'error': 'Insufficient funds.'}, status=status.HTTP_400_BAD_REQUEST)

                # 1. Deduct balance for the bet
                user_profile.balance -= bet_amount
                user_profile.save()

                # 2. Create the initial bet record (winnings are 0 for now)
                casino_bet = CasinoBet.objects.create(
                    user_profile=user_profile,
                    game_name='Mines',
                    bet_amount=bet_amount,
                    winnings=0, # Will be updated on cashout or loss
                    multiplier=0
                )

            # 3. Prepare the game grid
            grid = [{'id': i, 'isMine': False, 'isRevealed': False} for i in range(25)]
            mines_placed = 0
            while mines_placed < num_mines:
                index = random.randint(0, 24)
                if not grid[index]['isMine']:
                    grid[index]['isMine'] = True
                    mines_placed += 1

            # 4. Store game state in the session
            request.session['mines_game'] = {
                'bet_id': casino_bet.id,
                'grid': grid,
            }

            return Response({'grid': grid}, status=status.HTTP_200_OK)

        except (ValueError, TypeError, Decimal.InvalidOperation):
            return Response({'error': 'Invalid input data.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log the error for debugging: print(e) or import logging
            return Response({'error': 'An unexpected server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MinesCashOutView(APIView):
    """
    Handles the cashout process for an active Mines game.
    Updates the CasinoBet record and adds winnings to the user's balance.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        game_session = request.session.get('mines_game')
        if not game_session:
            return Response({'error': 'No active Mines game found.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bet_id = game_session['bet_id']
            winnings = Decimal(request.data.get('winnings', '0'))

            if winnings <= 0:
                 return Response({'error': 'Invalid winnings amount.'}, status=status.HTTP_400_BAD_REQUEST)

            # Use a transaction for updating the bet and the user's balance
            with transaction.atomic():
                # Lock the user profile to prevent race conditions
                user_profile = UserProfile.objects.select_for_update().get(user=request.user)
                
                # Get the original bet record to update it
                bet = get_object_or_404(CasinoBet, id=bet_id, user_profile=user_profile)
                
                # 1. Update the bet record with final winnings and multiplier
                bet.winnings = winnings
                bet.multiplier = (winnings / bet.bet_amount if bet.bet_amount > 0 else 0)
                bet.save()

                # 2. Add winnings to the user's balance
                user_profile.balance += winnings
                user_profile.save()

            # 3. Clear the game from the session after a successful transaction
            del request.session['mines_game']

            return Response({
                'message': 'Cashed out successfully!',
                'new_balance': f'{user_profile.balance:.2f}'
            }, status=status.HTTP_200_OK)
        
        except (KeyError, ValueError, Decimal.InvalidOperation):
            return Response({'error': 'Invalid session or winnings data.'}, status=status.HTTP_400_BAD_REQUEST)
        except CasinoBet.DoesNotExist:
             return Response({'error': 'Bet record not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'An unexpected server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MinesLossView(APIView):
    """
    Handles the end of a Mines game when a user hits a mine.
    This view simply clears the session, as the bet amount was already deducted.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if 'mines_game' in request.session:
            # The bet record already exists with winnings=0, so we just need
            # to clear the session to end the game.
            del request.session['mines_game']
            return Response({'message': 'Game loss recorded.'}, status=status.HTTP_200_OK)
        
        return Response({'error': 'No active game to lose.'}, status=status.HTTP_400_BAD_REQUEST)

class DiceBetView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        amount, choice, user_profile = request.data.get('amount'), request.data.get('choice'), request.user.profile
        try:
            amount_decimal = decimal.Decimal(amount)
            if user_profile.balance < amount_decimal:
                return Response({'error': 'Insufficient funds.'}, status=status.HTTP_400_BAD_REQUEST)
            user_profile.balance = F('balance') - amount_decimal
            user_profile.save()
            user_profile.refresh_from_db()
            die1, die2 = random.randint(1, 6), random.randint(1, 6)
            roll_sum = die1 + die2
            win, payout_multiplier = False, 0
            if choice == 'under' and roll_sum < 7: win, payout_multiplier = True, 2
            elif choice == 'over' and roll_sum > 7: win, payout_multiplier = True, 2
            elif choice == '7' and roll_sum == 7: win, payout_multiplier = True, 5
            winnings = 0
            if win:
                winnings = amount_decimal * payout_multiplier
                user_profile.balance = F('balance') + winnings
                user_profile.save()
            create_casino_bet_and_transactions(user_profile, 'Dice', amount_decimal, winnings)
            return Response({'final_die1': die1, 'final_die2': die2, 'outcome': 'win' if win else 'loss', 'winnings': winnings}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CoinFlipBetView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        amount, choice, user_profile = request.data.get('amount'), request.data.get('choice'), request.user.profile
        try:
            amount_decimal = decimal.Decimal(amount)
            if user_profile.balance < amount_decimal:
                return Response({'error': 'Insufficient funds.'}, status=status.HTTP_400_BAD_REQUEST)
            user_profile.balance = F('balance') - amount_decimal
            user_profile.save()
            user_profile.refresh_from_db()
            outcome = random.choice(['heads', 'tails'])
            win = (choice == outcome)
            winnings = 0
            if win:
                winnings = amount_decimal * 2
                user_profile.balance = F('balance') + winnings
                user_profile.save()
            create_casino_bet_and_transactions(user_profile, 'Coin Flip', amount_decimal, winnings)
            return Response({'outcome': outcome, 'winnings': winnings}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- HISTORY & OTHER VIEWS ---

class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        transactions = request.user.profile.transactions.filter(
            transaction_type__in=['deposit', 'withdraw', 'bet_placed', 'bet_won']
        ).order_by('-timestamp')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class ContactSubmissionView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        message = request.data.get('message')
        if not message or not message.strip():
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        Contact.objects.create(user=request.user, message=message)
        return Response({'message': 'Your query has been submitted successfully.'}, status=status.HTTP_201_CREATED)

class CasinoBetsHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        bets = CasinoBet.objects.filter(user_profile=request.user.profile).order_by('-timestamp')
        data = [{'game_name': b.game_name, 'bet_amount': b.bet_amount, 'winnings': b.winnings, 'multiplier': b.multiplier, 'timestamp': b.timestamp.strftime('%d %b %Y, %I:%M %p')} for b in bets]
        return Response(data)

class MatchListView(generics.ListAPIView):
    """
    API view to provide a list of upcoming matches.
    """
    # We only want to show matches that are upcoming
    queryset = Matchess.objects.all().order_by('date', 'time') 
    
    # Use the new serializer to format the data
    serializer_class = MatchessSerializer
    
    # Ensure only authenticated users can see the matches
    permission_classes = [IsAuthenticated]


       



class MatchDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, match_id):
        try:
            match = Matchess.objects.get(id=match_id)
        except Matchess.DoesNotExist:
            return Response({"error": "Match not found"}, status=404)

        # Call your scraper
        score_data = get_live_score(match.url, match.Team1, match.Team2)

        return Response({
            "id": match.id,
            "match_name": match.match_name,
            "team_one": match.Team1,
            "team_two": match.Team2,
            "start_time": match.start_time,
            "status": match.status,
            "live_score": score_data
        })
      
class LiveScoreAPIView(APIView):
    """
    API view to fetch live cricket scores by scraping a URL.
    """
    def get(self, request, *args, **kwargs):
        # Get parameters from the request URL (e.g., /api/live-score/?url=...&team1=...&team2=...)
        score_url = request.query_params.get('url', None)
        team1 = request.query_params.get('team1', None)
        team2 = request.query_params.get('team2', None)

        if not score_url:
            return Response(
                {"error": "URL parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Call the scraper function
        data = get_live_score(url=score_url, team_1=team1, team_2=team2)

        # Check if the scraper returned an error
        if "error" in data:
            return Response(data, status=status.HTTP_404_NOT_FOUND)

        # Return the scraped data as a successful JSON response
        return Response(data, status=status.HTTP_200_OK)

# def live_score_api(request, id):
#     match = get_object_or_404(Matchess, match_id=id)
#     live_score = get_live_score(match.url)
#     return JsonResponse(live_score)
class MatchLiveScoreAPIView(APIView):
    """
    API view to fetch live score for a specific match ID from the database.
    """
    def get(self, request, match_id, *args, **kwargs):
        # 1. Get the Match object from the database
        try:
            match = Matchess.objects.get(match_id=match_id)
        except Matchess.DoesNotExist:
            return Response(
                {"error": f"Match with ID {match_id} not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Check if the match object has a URL
        if not match.url:
            return Response(
                {"error": "This match does not have a score URL defined."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 3. Call the scraper function with the correct, capitalized field names
            data = get_live_score(url=match.url, team_1=match.Team1, team_2=match.Team2)

            # 4. Check for a scraper-specific error message
            if "error" in data:
                return Response(data, status=status.HTTP_404_NOT_FOUND)
            
            # 5. Return the scraped data successfully
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            # 6. Catch any other unexpected errors during scraping
            # This prevents your server from crashing if the external site is down or changes.
            return Response(
                {"error": "An unexpected error occurred while fetching the score.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )