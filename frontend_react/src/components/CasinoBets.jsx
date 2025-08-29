import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';

const CasinoBets = () => {
    const [bets, setBets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBets = async () => {
            try {
                const response = await api.get('/bets/casino/');
                if (Array.isArray(response.data)) {
                    setBets(response.data);
                } else {
                    setBets([]);
                }
            } catch (error) {
                console.error("Failed to fetch casino bets:", error);
                setBets([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBets();
    }, []);

    const parseNumber = (value) => {
        if (typeof value === 'string') {
            value = value.replace(/[^0-9.-]+/g, ''); // remove any non-numeric chars
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    const formatNumber = (num) => parseNumber(num).toFixed(2);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date) ? '-' : date.toLocaleString();
    };

    return (
        <div className="container text-light" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-4 fw-bold">Casino Bet History</h1>
                <Link to="/" className="btn btn-outline-info">
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to Main
                </Link>
            </div>

            <div className="table-responsive bg-dark p-3 rounded">
                <table className="table table-dark table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Game</th>
                            <th>Date</th>
                            <th>Bet Amount</th>
                            <th>Multiplier</th>
                            <th>Payout</th>
                            <th>Profit/Loss</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-5">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                                </td>
                            </tr>
                        ) : bets.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-5">
                                    You have not placed any casino bets yet.
                                </td>
                            </tr>
                        ) : (
                            bets.map((bet, index) => {
                                const betAmount = parseNumber(bet.bet_amount);
                                const winnings = parseNumber(bet.winnings);
                                const multiplier = parseNumber(bet.multiplier);
                                const profitLoss = winnings - betAmount;

                                return (
                                    <tr key={index}>
                                        <td>{bet.game_name || '-'}</td>
                                        <td>{formatDate(bet.timestamp)}</td>
                                        <td>₹{formatNumber(betAmount)}</td>
                                        <td>{formatNumber(multiplier)}x</td>
                                        <td>₹{formatNumber(winnings)}</td>
                                        <td className={profitLoss >= 0 ? 'text-success' : 'text-danger'}>
                                            {profitLoss >= 0 ? `+₹${formatNumber(profitLoss)}` : `-₹${formatNumber(Math.abs(profitLoss))}`}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CasinoBets;
