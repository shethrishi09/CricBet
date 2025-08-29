import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faGem, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import * as Tone from 'tone';
import { Link } from 'react-router-dom';
import api from '../api';

const GRID_SIZE = 25; // 5x5 grid

const MinesGame = () => {
    const { user, fetchUserData } = useContext(AuthContext);
    const [betAmount, setBetAmount] = useState(10);
    const [numMines, setNumMines] = useState(5);
    const [grid, setGrid] = useState([]);
    const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'lost', 'finished'
    const [gemsFound, setGemsFound] = useState(0);
    const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
    const [finalMultiplier, setFinalMultiplier] = useState(null); // State for the final result display
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Sound Design ---
    const sounds = {
        click: new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.1 } }).toDestination(),
        gem: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 } }).toDestination(),
        bomb: new Tone.MembraneSynth({ octaves: 10, pitchDecay: 0.1, envelope: { attack: 0.01, decay: 0.3, sustain: 0.01, release: 0.3 } }).toDestination(),
        cashout: new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 } }).toDestination(),
    };
    sounds.click.volume.value = -15;
    sounds.gem.volume.value = -10;
    sounds.bomb.volume.value = -5;
    sounds.cashout.volume.value = -8;

    useEffect(() => {
        initializeGrid();
    }, []);

    const initializeGrid = () => {
        const newGrid = Array.from({ length: GRID_SIZE }, (_, i) => ({
            id: i, isMine: false, isRevealed: false,
        }));
        setGrid(newGrid);
    };

    const calculateMultiplier = (gems, mines) => {
        if (gems === 0) return 1.0;
        const safeTiles = GRID_SIZE - mines;
        const probability = Array.from({ length: gems }).reduce((acc, _, i) => acc * ((safeTiles - i) / (GRID_SIZE - i)), 1);
        return parseFloat((0.95 / probability).toFixed(2));
    };

    const handleStartGame = async () => {
        if (!user || user.balance < betAmount) {
            setError("Insufficient balance.");
            return;
        }
        if (betAmount <= 0) {
            setError("Please enter a valid bet amount.");
            return;
        }

        setLoading(true);
        setError('');
        setFinalMultiplier(null); // Reset the final multiplier display
        try {
            const response = await api.post('/casino/mines/bet/', {
                amount: betAmount,
                mines: numMines
            });
            
            setGrid(response.data.grid);
            setGameState('playing');
            setGemsFound(0);
            setCurrentMultiplier(1.0);
            await fetchUserData();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to start game.");
        } finally {
            setLoading(false);
        }
    };

    const handleTileClick = (index) => {
        if (gameState !== 'playing' || grid[index].isRevealed) return;

        const newGrid = [...grid];
        const tile = newGrid[index];
        tile.isRevealed = true;

        if (tile.isMine) {
            sounds.bomb.triggerAttackRelease('C1', '4n');
            setGameState('lost');
            setFinalMultiplier(0); // Set final multiplier to 0 on loss
            newGrid.forEach(t => t.isRevealed = true);
        } else {
            sounds.gem.triggerAttackRelease('G5', '16n');
            const newGemsFound = gemsFound + 1;
            setGemsFound(newGemsFound);
            setCurrentMultiplier(calculateMultiplier(newGemsFound, numMines));
        }
        setGrid(newGrid);
    };

    const handleCashOut = async () => {
        if (gameState !== 'playing' || gemsFound === 0) return;
        
        setLoading(true);
        try {
            sounds.cashout.triggerAttackRelease(['C5', 'E5', 'G5'], '8n');
            const winnings = betAmount * currentMultiplier;

            await api.post('/casino/mines/cashout/', { winnings });
            
            const finalGrid = grid.map(tile => ({ ...tile, isRevealed: true }));
            setGrid(finalGrid);
            setFinalMultiplier(currentMultiplier); // Set the final multiplier for display
            
            await fetchUserData();
            setGameState('finished');
        } catch (err) {
            setError(err.response?.data?.error || "Failed to cash out.");
        } finally {
            setLoading(false);
        }
    };

    const renderTile = (tile, index) => {
        let content = null;
        let tileClass = 'tile';
        const isPlayable = gameState === 'playing' && !tile.isRevealed;

        if (tile.isRevealed) {
            if (tile.isMine) {
                content = <FontAwesomeIcon icon={faBomb} style={{ fontSize: '2.5rem' }} />;
                tileClass += ' revealed mine';
            } else {
                content = <FontAwesomeIcon icon={faGem} style={{ fontSize: '2.5rem' }} />;
                tileClass += ' revealed gem';
            }
        } else {
            tileClass += ' unrevealed';
            if (isPlayable) tileClass += ' playable';
        }

        return (
            <div 
                key={tile.id}
                className={tileClass}
                onClick={() => handleTileClick(index)}
            >
                {content}
            </div>
        );
    };

    const getButtonText = () => {
        if (gameState === 'lost' || gameState === 'finished') {
            return 'Play Again';
        }
        return 'Start Game';
    };

    return (
        <>
            <style>{`
                .game-grid-container { position: relative; }
                .game-grid { display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr); gap: 8px; aspect-ratio: 1 / 1; background-color: #202A39; padding: 8px; border-radius: 8px; }
                .tile { border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease, background-color 0.2s ease; }
                .unrevealed { background: linear-gradient(145deg, #2f353a, #262a2e); box-shadow: 3px 3px 8px #1a1f23, -3px -3px 8px #383f45; }
                .playable { cursor: pointer; }
                .playable:hover { transform: scale(1.05); background: linear-gradient(145deg, #3a4045, #2f353a); }
                .revealed.gem { background-color: #3498db; color: white; }
                .revealed.mine { background-color: #e74c3c; color: white; }
                .result-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.75); border-radius: 8px; text-align: center; pointer-events: none; }
            `}</style>
            <div className="container text-light" style={{ marginTop: '2rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="display-4 fw-bold">Mines</h1>
                    <Link to="/casino" className="btn btn-outline-info">
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Back to Casino
                    </Link>
                </div>
                <div className="row">
                    <div className="col-lg-4 col-md-12 mb-4">
                        <div className="bg-dark p-4 rounded h-100">
                            {/* 👇 This is the new Balance Display section */}
                            <div className="mb-3 text-center">
                                <p className="text-muted mb-0">Available Balance</p>
                                <h4 className="text-light">
                                    ₹{user && user.balance !== null ? parseFloat(user.balance).toFixed(2) : '0.00'}
                                </h4>
                            </div>
                            <hr />
                            <h4 className="mb-3">Game Settings</h4>
                            <div className="mb-3">
                                <label htmlFor="betAmount" className="form-label">Bet Amount (₹)</label>
                                <input
                                    type="number" className="form-control" id="betAmount"
                                    value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))}
                                    disabled={gameState === 'playing' || loading}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="numMines" className="form-label">Mines</label>
                                <div className="dropdown w-100">
                                    <button className="btn btn-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false" disabled={gameState === 'playing' || loading}>
                                        {numMines}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                            <li key={num}><button className="dropdown-item" onClick={() => setNumMines(num)}>{num}</button></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            {error && <div className="alert alert-danger">{error}</div>}

                            {gameState === 'playing' ? (
                                <button className="btn btn-warning btn-lg w-100" onClick={handleCashOut} disabled={gemsFound === 0 || loading}>
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : `Cash Out (₹${(betAmount * currentMultiplier).toFixed(2)})`}
                                </button>
                            ) : (
                                <button className="btn btn-success btn-lg w-100" onClick={handleStartGame} disabled={loading}>
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : getButtonText()}
                                </button>
                            )}
                            
                            {gameState === 'playing' && (
                                <div className="mt-3 text-center">
                                    <p className="mb-1">Gems Found: {gemsFound}</p>
                                    <p className="mb-0">Multiplier: {currentMultiplier.toFixed(2)}x</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-lg-8 col-md-12">
                        <div className="game-grid-container">
                            <div className="game-grid">
                                {grid.map((tile, index) => renderTile(tile, index))}
                            </div>
                            {(gameState === 'finished' || gameState === 'lost') && (
                                <div className="result-overlay">
                                    {gameState === 'finished' ? (
                                        <>
                                            <h2 className="text-warning">You Won!</h2>
                                            <h1 className="display-3 fw-bold text-white">{finalMultiplier}x</h1>
                                            <p className="lead text-white">Profit: ₹{(betAmount * finalMultiplier - betAmount).toFixed(2)}</p>
                                        </>
                                    ) : (
                                        <h1 className="display-3 fw-bold text-danger">Busted!</h1>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MinesGame;
