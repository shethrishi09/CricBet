import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// 👇 1. Import the new 'faCoins' icon
import { faBomb, faDice, faCoins } from '@fortawesome/free-solid-svg-icons';

const Casino = () => {
    // Inline styles for custom card effects
    const cardStyle = {
        background: 'linear-gradient(145deg, #2f353a, #262a2e)',
        border: '1px solid #495057',
        borderRadius: '15px',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '5px 5px 15px #1e2225, -5px -5px 15px #363c41'
    };

    const cardHoverStyle = {
        transform: 'translateY(-10px)',
        boxShadow: '0 20px 40px rgba(0, 255, 255, 0.2)'
    };

    const iconContainerStyle = {
        fontSize: '80px',
        color: '#0dcaf0', // Bootstrap 'info' color
        textShadow: '0 0 15px rgba(13, 202, 240, 0.7)'
    };

    return (
        <div className="container text-light" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold">Casino Games</h1>
                <p className="lead text-muted">Choose your game and test your luck.</p>
            </div>

            <div className="row justify-content-center g-4">
                {/* --- Dice Game Card --- */}
                <div className="col-lg-4 col-md-6">
                    <div 
                        className="card text-center p-4 h-100" 
                        style={cardStyle}
                        onMouseEnter={e => Object.assign(e.currentTarget.style, cardHoverStyle)}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, cardStyle)}
                    >
                        <div style={iconContainerStyle} className="my-4">
                            <FontAwesomeIcon icon={faDice} />
                        </div>
                        <h2 className="card-title">Dice</h2>
                        <p className="card-text text-muted">Predict the roll, set your target, and win big. A classic game of chance.</p>
                        <Link to="/casino/dice" className="btn btn-info btn-lg mt-auto">Play Now</Link>
                    </div>
                </div>

                {/* --- Mines Game Card --- */}
               

                {/* 👇 2. New Coin Flip Game Card */}
                <div className="col-lg-4 col-md-6">
                    <div 
                        className="card text-center p-4 h-100" 
                        style={cardStyle}
                        onMouseEnter={e => Object.assign(e.currentTarget.style, cardHoverStyle)}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, cardStyle)}
                    >
                        <div style={iconContainerStyle} className="my-4">
                            <FontAwesomeIcon icon={faCoins} />
                        </div>
                        <h2 className="card-title">Coin Flip</h2>
                        <p className="card-text text-muted">Heads or tails? A simple choice with a 50/50 chance to double your money.</p>
                        <Link to="/casino/coin-flip" className="btn btn-info btn-lg mt-auto">Play Now</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Casino;
