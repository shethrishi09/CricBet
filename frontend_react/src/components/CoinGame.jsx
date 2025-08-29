import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import * as Tone from 'tone';
import { Link } from 'react-router-dom';
import api from '../api';

// --- Reusable Coin Component with Improved Animation ---
const Coin = ({ side, isFlipping }) => {
    return (
        <div className="coin-container">
            <div className={`coin ${isFlipping ? 'flipping' : ''}`} style={{ transform: side === 'tails' ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                <div className="face heads">H</div>
                <div className="face tails">T</div>
            </div>
        </div>
    );
};

// --- Main Game Component ---
const CoinGame = () => {
    const { user, fetchUserData } = useContext(AuthContext);
    const [betAmount, setBetAmount] = useState(10);
    const [choice, setChoice] = useState('heads');
    const [gameState, setGameState] = useState('betting'); // 'betting', 'flipping', 'result'
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Professional Sound Design ---
    const sounds = {
        flip: new Tone.MetalSynth({
            frequency: 150, envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
        }).toDestination(),
        win: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
        lose: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 } }).toDestination(),
    };
    sounds.flip.volume.value = -20;
    sounds.win.volume.value = -10;
    sounds.lose.volume.value = -10;

    const handleFlip = async () => {
        if (loading || !user || user.balance < betAmount) {
            setError("Insufficient balance or invalid bet.");
            return;
        }
        
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // 1. Tell the backend to place the bet and get the result
            const response = await api.post('/casino/coin-flip/bet/', {
                amount: betAmount,
                choice: choice
            });
            
            // 2. Refresh balance to show the deduction
            await fetchUserData();
            
            // 3. Start the flip animation
            setGameState('flipping');
            sounds.flip.triggerAttackRelease('C4', '16n');

            const { outcome, winnings } = response.data;

            // 4. Wait for the animation to finish, then show the result
            setTimeout(() => {
                setResult({ outcome, message: winnings > 0 ? `You won ₹${winnings.toFixed(2)}!` : 'You lost.' });
                
                if (winnings > 0) {
                    sounds.win.triggerAttackRelease('G5', '8n');
                } else {
                    sounds.lose.triggerAttackRelease('C3', '8n');
                }
                
                // 5. Refresh balance again to add any winnings
                fetchUserData();
                setGameState('result');
                setLoading(false);
            }, 2000); // Must match animation duration

        } catch (err) {
            setError(err.response?.data?.error || "Failed to place bet.");
            setLoading(false);
            setGameState('betting');
        }
    };

    const getButtonText = () => {
        if (loading) return <FontAwesomeIcon icon={faSpinner} spin />;
        if (gameState === 'result') return 'Flip Again';
        return 'Flip Coin';
    };

    return (
        <>
            <style>{`
                .coin-board { background-color: #202A39; padding: 2rem; border-radius: 15px; display: flex; justify-content: center; align-items: center; min-height: 250px; }
                .coin-container { width: 150px; height: 150px; perspective: 1000px; }
                .coin { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 1s; }
                .coin.flipping { animation: flip 2s ease-out forwards; }
                .face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: bold; }
                .heads { background: linear-gradient(145deg, #ffd700, #f0c400); color: #4a3a00; }
                .tails { background: linear-gradient(145deg, #c0c0c0, #a9a9a9); color: #333; transform: rotateY(180deg); }
                @keyframes flip { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1800deg); } }
            `}</style>
            <div className="container text-light" style={{ marginTop: '2rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="display-4 fw-bold">Coin Flip</h1>
                    <Link to="/casino" className="btn btn-outline-info">
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Back to Casino
                    </Link>
                </div>
                <div className="row">
                    <div className="col-lg-4 col-md-12 mb-4">
                        <div className="bg-dark p-4 rounded h-100">
                            <div className="mb-3 text-center">
                                <p className="text-muted mb-0">Available Balance</p>
                                <h4 className="text-light">₹{user && user.balance !== null ? parseFloat(user.balance).toFixed(2) : '0.00'}</h4>
                            </div>
                            <hr />
                            <h4 className="mb-3">Place Your Bet</h4>
                            <div className="mb-3">
                                <label htmlFor="betAmount" className="form-label">Bet Amount (₹)</label>
                                <input type="number" className="form-control" id="betAmount" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={loading} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Choose a Side (2x Payout)</label>
                                <div className="btn-group w-100">
                                    <button className={`btn ${choice === 'heads' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setChoice('heads')} disabled={loading}>Heads</button>
                                    <button className={`btn ${choice === 'tails' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setChoice('tails')} disabled={loading}>Tails</button>
                                </div>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <button className="btn btn-success btn-lg w-100" onClick={handleFlip} disabled={loading}>
                                {getButtonText()}
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-8 col-md-12 d-flex flex-column justify-content-center">
                        <div className="coin-board">
                            <Coin side={result ? result.outcome : 'heads'} isFlipping={gameState === 'flipping'} />
                        </div>
                        {result && (
                            <div className={`mt-3 text-center alert ${result.message.includes('won') ? 'alert-success' : 'alert-danger'}`}>
                                {result.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CoinGame;
