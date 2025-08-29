// src/components/MatchDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const MatchDetail = () => {
  // FIXED: The route parameter is 'matchId', not 'id'
  const { matchId } = useParams(); 
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScore = async () => {
      try {
        // FIXED: This now calls the correct API endpoint
        const response = await api.get(`/match-score/${matchId}/`);
        setScore(response.data);
        setError(''); // Clear previous errors on success
      } catch (err) {
        console.error("Failed to fetch live score:", err);
        setError('Could not retrieve live score. The data may not be available for this match.');
      } finally {
        setLoading(false);
      }
    };

    fetchScore(); // Fetch score immediately
    const interval = setInterval(fetchScore, 15000); // Refresh every 15 seconds
    
    // Cleanup interval when the component unmounts
    return () => clearInterval(interval);

  }, [matchId]); // Effect dependency is now correct

  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }}></div></div>;
  }

  if (error || !score) {
    return (
      <div className="container text-center my-5">
        <h2 className="text-danger">Error</h2>
        <p className="text-light">{error || 'No live score available for this match.'}</p>
        <Link to="/" className="btn btn-info mt-3">Back to All Matches</Link>
      </div>
    );
  }

  // FIXED: Proper formatting for the score details
  return (
    <div className="container my-4 text-light">
      <div className="p-4 bg-dark rounded border border-secondary" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        
        {/* Match Name and Main Status */}
        <div className="text-center mb-4">
          <h2 className="text-warning">{score.match_name}</h2>
          {score.main_message && <p className="lead text-info fw-bold">{score.main_message}</p>}
        </div>

        {/* Core Score Box */}
        <div className="row justify-content-center mb-4">
          <div className="col-md-8">
            <div className="card bg-black text-white border-info">
              <div className="card-body text-center">
                <h3 className="card-title display-4 fw-bold">{score.team_name}: {score.score}</h3>
                <p className="card-text fs-4 text-muted">Overs: {score.over}</p>
                {score.CRR && <p className="card-text">CRR: {score.CRR}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Batting and Bowling Details */}
        <div className="row">
          {/* Batsmen */}
          <div className="col-md-6 mb-3">
            <h4 className="text-info">Batting</h4>
            <ul className="list-group list-group-flush">
              <li className="list-group-item bg-transparent text-light d-flex justify-content-between">
                <span>{score.batsman_1}*</span>
                <span>{score.batsman_1_score}</span>
              </li>
              <li className="list-group-item bg-transparent text-light d-flex justify-content-between">
                <span>{score.batsman_2}</span>
                <span>{score.batsman_2_score}</span>
              </li>
            </ul>
          </div>
          {/* Bowler */}
          <div className="col-md-6 mb-3">
            <h4 className="text-info">Bowling</h4>
            <ul className="list-group list-group-flush">
              <li className="list-group-item bg-transparent text-light d-flex justify-content-between">
                <span>{score.bowler}*</span>
                <span>{score.bowler_score}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Odds and Favorite Team */}
        <div className="mt-4 pt-4 border-top border-secondary">
          <h4 className="text-info text-center">Match Odds</h4>
          <div className="d-flex justify-content-around align-items-center text-center">
            <div>
              <h5>{score.team1}</h5>
              <span className="badge bg-primary fs-5">{score.odd_1}</span>
            </div>
            <div className="text-warning">
              <p className="mb-0">Favorite</p>
              <h5 className="fw-bold">{score.fav_team}</h5>
            </div>
            <div>
              <h5>{score.team2}</h5>
              <span className="badge bg-primary fs-5">{score.odd_2}</span>
            </div>
          </div>
        </div>
        
      </div>
      <div className="text-center mt-4">
        <Link to="/" className="btn btn-outline-info">‹ Back to All Matches</Link>
      </div>
    </div>
  );
};

export default MatchDetail;