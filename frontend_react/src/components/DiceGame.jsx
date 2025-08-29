import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import * as Tone from 'tone';
import { Link } from 'react-router-dom';
import api from '../api';

// --- Reusable Die Component with Animation ---
const Die = ({ value, isRolling }) => {
    const dieFace = (
        <div className={`die-face face-${value}`}>
            {Array.from({ length: value }).map((_, i) => <span key={i} className="dot"></span>)}
        </div>
    );

    return (
        <div className={`die-container ${isRolling ? 'rolling' : ''}`}>
            {dieFace}
        </div>
    );
};

// --- Main Game Component ---
const DiceGame = () => {
    const { user, fetchUserData } = useContext(AuthContext);
    const [betAmount, setBetAmount] = useState(10);
    const [betChoice, setBetChoice] = useState('under'); // 'under', '7', 'over'
    const [die1, setDie1] = useState(1);
    const [die2, setDie2] = useState(6);
    const [gameState, setGameState] = useState('betting'); // 'betting', 'rolling', 'result'
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // --- Sound Design ---
    const sounds = {
        roll: new Tone.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.005, decay: 0.15, sustain: 0 } }).toDestination(),
        win: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
        lose: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.3 } }).toDestination(),
    };
    sounds.roll.volume.value = -20;
    sounds.win.volume.value = -10;
    sounds.lose.volume.value = -10;

    const handleRoll = async () => {
        if (gameState === 'rolling' || !user || user.balance < betAmount) {
            setError("Insufficient balance or invalid bet.");
            return;
        }
        
        setGameState('rolling');
        setError('');
        setResult(null);
        sounds.roll.triggerAttackRelease("0.2");

        try {
            // Backend call to deduct bet and get the result
            const response = await api.post('/casino/dice/bet/', {
                amount: betAmount,
                choice: betChoice
            });

            const { final_die1, final_die2, outcome, winnings } = response.data;

            // Animate the dice roll
            let rollCount = 0;
            const rollInterval = setInterval(() => {
                setDie1(Math.floor(Math.random() * 6) + 1);
                setDie2(Math.floor(Math.random() * 6) + 1);
                rollCount++;
                if (rollCount > 10) {
                    clearInterval(rollInterval);
                    setDie1(final_die1);
                    setDie2(final_die2);
                    
                    if (outcome === 'win') {
                        sounds.win.triggerAttackRelease('G5', '8n');
                        setResult({ type: 'win', message: `You rolled ${final_die1 + final_die2}! You won ₹${winnings.toFixed(2)}` });
                    } else {
                        sounds.lose.triggerAttackRelease('C3', '8n');
                        setResult({ type: 'loss', message: `You rolled ${final_die1 + final_die2}. You lost.` });
                    }
                    
                    fetchUserData(); // Refresh balance from server
                    setGameState('result');
                }
            }, 100);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to place bet.");
            setGameState('betting');
        }
    };

    const getButtonText = () => {
        if (gameState === 'rolling') return <FontAwesomeIcon icon={faSpinner} spin />;
        if (gameState === 'result') return 'Roll Again';
        return 'Roll Dice';
    };

    return (
        <>
            <style>{`
                .dice-board { background-color: #202A39; padding: 2rem; border-radius: 15px; display: flex; gap: 2rem; justify-content: center; align-items: center; min-height: 200px; }
                .die-container { width: 100px; height: 100px; perspective: 1000px; }
                .die-face { width: 100%; height: 100%; background-color: #fff; border-radius: 10px; display: grid; padding: 10px; box-sizing: border-box; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                .rolling .die-face { animation: roll 1s infinite linear; }
                .dot { width: 20px; height: 20px; background-color: #1a1a1a; border-radius: 50%; }
                .face-1 { grid-template-areas: ". . ." ". a ." ". . ."; } .face-1 .dot:nth-child(1) { grid-area: a; }
                .face-2 { grid-template-areas: "a . ." ". . ." ". . b"; } .face-2 .dot:nth-child(1) { grid-area: a; } .face-2 .dot:nth-child(2) { grid-area: b; }
                .face-3 { grid-template-areas: "a . ." ". b ." ". . c"; } .face-3 .dot:nth-child(1) { grid-area: a; } .face-3 .dot:nth-child(2) { grid-area: b; } .face-3 .dot:nth-child(3) { grid-area: c; }
                .face-4 { grid-template-areas: "a . b" ". . ." "c . d"; } .face-4 .dot:nth-child(1) { grid-area: a; } .face-4 .dot:nth-child(2) { grid-area: b; } .face-4 .dot:nth-child(3) { grid-area: c; } .face-4 .dot:nth-child(4) { grid-area: d; }
                .face-5 { grid-template-areas: "a . b" ". c ." "d . e"; } .face-5 .dot:nth-child(1) { grid-area: a; } .face-5 .dot:nth-child(2) { grid-area: b; } .face-5 .dot:nth-child(3) { grid-area: c; } .face-5 .dot:nth-child(4) { grid-area: d; } .face-5 .dot:nth-child(5) { grid-area: e; }
                .face-6 { grid-template-areas: "a . b" "c . d" "e . f"; } .face-6 .dot:nth-child(1) { grid-area: a; } .face-6 .dot:nth-child(2) { grid-area: b; } .face-6 .dot:nth-child(3) { grid-area: c; } .face-6 .dot:nth-child(4) { grid-area: d; } .face-6 .dot:nth-child(5) { grid-area: e; } .face-6 .dot:nth-child(6) { grid-area: f; }
                @keyframes roll { 0% { transform: rotateX(0deg) rotateY(0deg); } 100% { transform: rotateX(360deg) rotateY(360deg); } }
            `}</style>
            <div className="container text-light" style={{ marginTop: '2rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="display-4 fw-bold">Dice</h1>
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
                                <input type="number" className="form-control" id="betAmount" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} disabled={gameState === 'rolling'} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Prediction</label>
                                <div className="btn-group w-100">
                                    <button className={`btn ${betChoice === 'under' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setBetChoice('under')} disabled={gameState === 'rolling'}>Under 7 (2x)</button>
                                    <button className={`btn ${betChoice === '7' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setBetChoice('7')} disabled={gameState === 'rolling'}>Exactly 7 (5x)</button>
                                    <button className={`btn ${betChoice === 'over' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setBetChoice('over')} disabled={gameState === 'rolling'}>Over 7 (2x)</button>
                                </div>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <button className="btn btn-success btn-lg w-100" onClick={handleRoll} disabled={gameState === 'rolling'}>
                                {getButtonText()}
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-8 col-md-12 d-flex flex-column justify-content-center">
                        <div className="dice-board">
                            <Die value={die1} isRolling={gameState === 'rolling'} />
                            <Die value={die2} isRolling={gameState === 'rolling'} />
                        </div>
                        {result && (
                            <div className={`mt-3 text-center alert ${result.type === 'win' ? 'alert-success' : 'alert-danger'}`}>
                                {result.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DiceGame;
