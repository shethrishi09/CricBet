// src/components/BetModal.jsx

import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../AuthProvider'; // To get user balance

const BetModal = ({ isOpen, onClose, match, bettingOn }) => {
  const [stake, setStake] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, fetchUser } = useContext(AuthContext); // Get user and a way to refresh user data

    let potentialWinnings = 0;
  if (bettingOn?.team && stake > 0 && bettingOn.odds > 0) {
    if (bettingOn.team === match.fav_team) {
      // Original calculation for the FAVORITE team
      potentialWinnings = stake * (bettingOn.odds / 100);
    } else {
      // New calculation for the NON-FAVORITE team
      potentialWinnings = stake * (100 / bettingOn.odds);
    }
  }


  // Reset stake when the modal opens for a new bet
  useEffect(() => {
    if (isOpen) {
      setStake('');
      setError('');
    }
  }, [isOpen]);

  const handlePlaceBet = async () => {
    if (!stake || stake <= 0) {
      setError('Please enter a valid stake.');
      return;
    }
    if (stake > user.balance) {
      setError('Insufficient balance.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/bets/place/', {
        match_id: match.id,
        selected_team: bettingOn.team,
        odds: bettingOn.odds,
        stake: parseFloat(stake),
      });
      await fetchUser(); // Refresh user data to show new balance
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bet.');
      console.error('Bet placement failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Modal backdrop
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1050
    }}>
      {/* Modal content */}
      <div className="bg-dark text-light p-4 rounded border border-info" style={{ width: '90%', maxWidth: '400px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="text-warning mb-0">Place Your Bet</h4>
          <button onClick={onClose} className="btn-close btn-close-white"></button>
        </div>
        
        <p><strong>Match:</strong> {match.match_name}</p>
        <p><strong>Betting on:</strong> <span className="fw-bold fs-5">{bettingOn.team}</span></p>
        <p><strong>Odds:</strong> {bettingOn.odds}</p>
        <p><strong>Your Balance:</strong> ₹{user.balance?.toFixed(2)}</p>

        <div className="mb-3">
          <label htmlFor="stake" className="form-label">Your Stake (₹)</label>
          <input
            type="number"
            className="form-control bg-secondary text-light border-dark"
            id="stake"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="e.g., 100"
            min="1"
          />
        </div>

        <h5 className="mt-3">Potential Winnings: <span className="text-success">₹{potentialWinnings}</span></h5>
        
        {error && <p className="text-danger mt-3">{error}</p>}
        
        <button onClick={handlePlaceBet} className="btn btn-info w-100 mt-3" disabled={loading}>
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
};

export default BetModal;