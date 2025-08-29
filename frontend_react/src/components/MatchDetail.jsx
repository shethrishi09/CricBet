import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import BetModal from './BetModal';

const MatchDetail = () => {
  const { matchId } = useParams(); 
  
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const [isModalOpen, setIsModalOpen] = useState(false);
  const [bettingOn, setBettingOn] = useState(null); // To store {team, odds}

  useEffect(() => {

    // 👇 THIS IS THE FIX: Only run the fetch logic if matchId exists.
    if (!matchId) {
      setLoading(false);
      setError('Match ID is missing.');
      return; 
    }

    const fetchScore = async () => {
      try {
        const response = await api.get(`/match-score/${matchId}/`);
        setScore(response.data);
        setError(''); 
      } catch (err) {
        console.error("Failed to fetch live score:", err); // This is where your error was coming from
        setError('Could not retrieve live score. The data may not be available for this match.');
      } finally {
        setLoading(false);
      }
    };

    fetchScore(); 
    const interval = setInterval(fetchScore, 5000);
    
    return () => clearInterval(interval);

  }, [matchId]); 
  const handleOpenModal = (team, odds) => {
    if (!team || !odds || odds === "00") return; 
    if (!team || !odds || odds === "01") return; 
    // Prevents opening modal for invalid odds
    setBettingOn({ team, odds: parseInt(odds) });
    setIsModalOpen(true);// Prevents opening modal for invalid odds
    setBettingOn({ team, odds: parseInt(odds) });
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBettingOn(null);
  };


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

  // The rest of your component for formatting the score is unchanged and correct.
  return (
    <div className="container my-4 text-light">
      <div className="p-4 bg-dark rounded border border-secondary" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        <div className="text-center mb-4">
          <h2 className="text-warning">{score.match_name}</h2>
          {score.main_message && <p className="lead text-info fw-bold">{score.main_message}</p>}
        </div>

        <div className="row justify-content-center mb-4">
          <div className="col-md-8">
            <div className="card bg-black text-white border-info">
              <div className="card-body text-center bg-dark">
                <h3 className="card-title display-4 fw-bold">{score.team_name}: {score.score}</h3>
                <p className="card-text fs-4 text-muted">Overs: {score.over}</p>
                {score.CRR && <p className="card-text">CRR: {score.CRR}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
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

   <div className="mt-4 pt-4 border-top border-secondary">
  <h4 className="text-info text-center">Match Odds</h4>
  <div className="d-flex justify-content-around align-items-center text-center">

    {/* Team 1 Odds - Now Clickable */}
    <div 
      onClick={() => handleOpenModal(score.team1, score.odd_1)} 
      style={{ cursor: 'pointer' }} 
      className="p-2"
    >
      <h5>{score.team1}</h5>
      <span className="badge bg-primary fs-5">{score.odd_1}</span>
    </div>

    {/* Favorite Team Display - Not Clickable */}
    <div className="text-warning">
      <p className="mb-0">Favorite</p>
      <h5 className="fw-bold">{score.fav_team}</h5>
    </div>

    {/* Team 2 Odds - Now Clickable */}
    <div 
      onClick={() => handleOpenModal(score.team2, score.odd_2)} 
      style={{ cursor: 'pointer' }} 
      className="p-2"
    >
      <h5>{score.team2}</h5>
      <span className="badge bg-primary fs-5">{score.odd_2}</span>
    </div>
    
  </div>
</div>
 
      </div>
      <div className="text-center mt-4">
        <Link to="/" className="btn btn-outline-info">‹ Back to All Matches</Link>
      </div>
       <BetModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        match={score}
        bettingOn={bettingOn}
      />
    </div>
    
  );
};

export default MatchDetail;