import React, { useContext, useState } from 'react';
import Button from './Button';
import { AuthContext } from '../AuthProvider';
import { Link } from 'react-router-dom';
import api from '../api';

const Main = () => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');

  const mainContentStyle = {
    paddingTop: '2rem',
    paddingBottom: '2rem',
  };

  return (
    <>
      <style>{`
        @keyframes glow {
          0% {
            box-shadow: 0 0 5px #0dcaf0, 0 0 10px #0dcaf0;
          }
          50% {
            box-shadow: 0 0 15px #0dcaf0, 0 0 20px #0dcaf0;
          }
          100% {
            box-shadow: 0 0 5px #0dcaf0, 0 0 10px #0dcaf0;
          }
        }
        .btn-glow {
          animation: glow 2.5s infinite;
        }
      `}</style>
      
      <div className='container' style={mainContentStyle}>
        {isLoggedIn && user ? (
          // --- LOGGED-IN VIEW ---
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

            <div className="mb-5">
              <input
                type="text"
                className="form-control form-control-lg bg-dark text-light border-secondary"
                placeholder="Search for matches or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        ) : (
          // --- LOGGED-OUT (GUEST) VIEW ---
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
