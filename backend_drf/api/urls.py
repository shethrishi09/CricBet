from django.urls import path
from accounts import views as UserViews
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # 🔐 Auth & User
    path('register/', UserViews.RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('protected-view/', UserViews.ProtectedView.as_view(), name='protected_view'),
    path('user-profile/', UserViews.UserProfileView.as_view(), name='user_profile'),
    path('user-exposure/', UserViews.UserExposureView.as_view(), name='user-exposure'),

    # 🔢 OTP & Contact
    path('generate-otp/', UserViews.GenerateOTPView.as_view(), name='generate_otp'),
    path('contact/', UserViews.ContactSubmissionView.as_view(), name='contact-submission'),

    # 💰 Deposits & Withdrawals
    path('deposit/verify/', UserViews.VerifyOtpAndCreateRequestView.as_view(), name='deposit-verify'),
    path('deposit/reject/', UserViews.RejectDepositView.as_view(), name='deposit-reject'),
    path('deposit/history/', UserViews.DepositHistoryView.as_view(), name='deposit-history'),
    path('withdraw/request/', UserViews.CreateWithdrawalRequestView.as_view(), name='withdraw-request'),
    path('withdraw/reject/', UserViews.RejectWithdrawalView.as_view(), name='withdraw-reject'),
    path('withdraw/history/', UserViews.WithdrawalHistoryView.as_view(), name='withdraw-history'),
    path('transaction-history/', UserViews.TransactionHistoryView.as_view(), name='transaction-history'),

    # 🎰 Casino
    path('casino/mines/bet/', UserViews.MinesBetView.as_view(), name='mines-bet'),
    path('casino/mines/cashout/', UserViews.MinesCashOutView.as_view(), name='mines-cashout'),
    path('casino/mines/loss/', UserViews.MinesLossView.as_view(), name='mines-loss'),
    path('casino/coin-flip/bet/', UserViews.CoinFlipBetView.as_view(), name='coin-flip-bet'),
    path('casino/dice/bet/', UserViews.DiceBetView.as_view(), name='dice-bet'),
    path('bets/casino/', UserViews.CasinoBetsHistoryView.as_view(), name='casino-bets-history'),
   path('live-score/', UserViews.LiveScoreAPIView.as_view(), name='live-score'),
    # 🏏 Matches (Unified under match-detail)
    path('matches/', UserViews.MatchListView.as_view(), name='match-list'),
    path('matches/<int:match_id>/detail/', UserViews.MatchDetailView.as_view(), name='match-detail'),
     path('match-score/<int:match_id>/', UserViews.MatchLiveScoreAPIView.as_view(), name='live-score-by-id')
]
