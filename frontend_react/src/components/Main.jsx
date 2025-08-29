import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { AuthContext } from '../AuthProvider';
import api from '../api';

// --- Main.jsx Component ---
const Main = () => {
  const { isLoggedIn, user } = React.useContext(AuthContext);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [liveScores, setLiveScores] = React.useState({});
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    let intervalId; // To hold the interval ID for cleanup

    // --- Function to fetch scores for a list of matches ---
    const updateScores = async (currentMatches) => {
      if (currentMatches.length === 0) return; // Don't run if there are no matches
      try {
        const scorePromises = currentMatches.map(async (match) => {
          const scoreResponse = await api.get(`/match-score/${match.match_id}/`);
          return { id: match.match_id, score: scoreResponse.data };
        });
        const scores = await Promise.all(scorePromises);
        const scoreMap = {};
        scores.forEach(s => { scoreMap[s.id] = s.score; });
        setLiveScores(scoreMap); // Update the state with new scores
      } catch (err) {
        console.error("Failed to update live scores:", err);
      }
    };
    
    // --- Main function to fetch initial data ---
    const fetchData = async () => {
      try {
        const matchesResponse = await api.get('/matches/');
        const fetchedMatches = matchesResponse.data;
        setMatches(fetchedMatches);
        
        // Fetch initial scores right after getting the matches
        await updateScores(fetchedMatches);
        
        // Set up the interval to re-fetch scores every 15 seconds
        intervalId = setInterval(() => updateScores(fetchedMatches), 5000);

      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // --- Cleanup function ---
    // This will run when you navigate away from the page, stopping the interval.
    return () => {
      clearInterval(intervalId);
    };

  }, [isLoggedIn]); // This effect runs once when the user logs in

  const mainContentStyle = {
    paddingTop: '2rem',
    paddingBottom: '2rem',
  };

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <style>{`
        /* Your styles are unchanged */
        @keyframes glow {
          0% { box-shadow: 0 0 5px #0dcaf0, 0 0 10px #0dcaf0; }
          50% { box-shadow: 0 0 15px #0dcaf0, 0 0 20px #0dcaf0; }
          100% { box-shadow: 0 0 5px #0dcaf0, 0 0 10px #0dcaf0; }
        }
        .btn-glow { animation: glow 2.5s infinite; }
        .match-card {
            background: linear-gradient(145deg, #2f353a, #262a2e);
            border: 1px solid #495057;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 5px 5px 15px #1e2225, -5px -5px 15px #363c41;
            color: white;
            transition: transform 0.2s ease-in-out;
            cursor: pointer;
        }
        .match-card:hover {
            transform: translateY(-5px);
        }
        .match-image {
            height: 80px;
            width: 80px;
            object-fit: contain;
            margin-bottom: 1rem;
        }
      `}</style>
      
      <div className='container' style={mainContentStyle}>
        {isLoggedIn && user ? (
          <div>
            <div className='p-4 text-center bg-dark rounded mb-4 border border-info'>
              <h1 className='text-light'>Hi {user.username}, Welcome to CricBet</h1>
              <p className='text-light lead'>Find a match or play our casino games.</p>
            </div>
            <div className="text-center mb-5 d-flex justify-content-center gap-3">
              <Link to="/casino" className="btn btn-info btn-lg btn-glow">
                Go to Casino
              </Link>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control form-control-lg bg-dark text-light border-secondary"
                placeholder="Search for matches or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <h2 className="text-light mb-4">All Matches</h2>
            {loading ? (
              <div className="text-center my-5"><div className="spinner-border text-info"></div></div>
            ) : (
              <div className="row">
                {matches.length > 0 ? (
                  matches.filter(match => 
                      match.match_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      match.Team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      match.Team2.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(match => (
                    <div key={match.match_id} className="col-md-6 col-lg-4 mb-4">
                      <div 
                        className="match-card h-100 d-flex flex-column align-items-center"
                        onClick={() => {navigate(`/match/${match.match_id}`);
                       console.log('Navigating with match_id:', match.match_id);}}
                      >
                        <img 
                          src={`http://127.0.0.1:8000${match.img}`} 
                          alt={match.match_name} 
                          className="w-full h-40 object-cover rounded-t-lg"
                          onError={(e) => { e.target.style.display = 'none' }} 
                        />    
                        <h5 className="text-center text-warning">{match.match_name}</h5>
                        <div className="d-flex justify-content-around align-items-center my-3 w-100">
                          <div className="text-center">
                            <h6 className="mt-2 mb-0">{match.Team1}</h6>
                          </div>
                          <span className="fw-bold fs-4 text-info">VS</span>
                          <div className="text-center">
                            <h6 className="mt-2 mb-0">{match.Team2}</h6>
                          </div>
                        </div>
                        {liveScores[match.match_id] ? (
                          liveScores[match.match_id].error ? (
                            <p className="text-center text-danger">
                              {liveScores[match.match_id].error}
                            </p>
                          ) : (
                            <div className="text-center text-light">
                              <p className="mb-1">
                                {liveScores[match.match_id].team1} ({liveScores[match.match_id].odd_1}) 
                                vs {liveScores[match.match_id].team2} ({liveScores[match.match_id].odd_2})
                              </p>
                              <p className="mb-1 fw-bold">
                                {liveScores[match.match_id].score} ({liveScores[match.match_id].over})
                              </p>
                              <p className="mb-0">{liveScores[match.match_id].main_message}</p>
                            </div>
                          )
                        ) : (
                          <p className="text-center text-muted">
                            Fetching live score...
                          </p>
                        )}
                        <p className="text-center text-muted small mt-auto">
                          {formatDateTime(match.date, match.time)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center text-muted">
                    <p>No matches available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className='p-5 text-center bg-dark rounded border border-info'>
            <h1 className='text-light'>SportsBook</h1>
            <h3 className='text-light'>"CricBet Portal"</h3>
            <p className='text-light lead'> Welcome to CricBet Portal</p>
            <p className='text-light lead'>"Place smart bets with real-time odds and live match updates. Turn your predictions into wins -- Sign up now"</p>
            <Button text="Login" class="btn-outline-info" url="/login" />
          </div>
        )}
      </div>
    </> 
  );
};

export default Main;