// File: src/components/LiveMatches.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

const LiveMatches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getMatches = async () => {
            try {
                const response = await api.get('/matches/');
                setMatches(response.data);
            } catch (error) {
                console.error("Failed to fetch matches", error);
            } finally {
                setLoading(false);
            }
        };
        getMatches();
    }, []);

    if (loading) {
        return <div className="text-light text-center">Loading matches...</div>;
    }

    return (
        <div className="container text-light">
            <h2 className="my-4">Upcoming Matches</h2>
            {matches.length === 0 ? (
                <p>No upcoming matches found.</p>
            ) : (
                matches.map(match => (
                    <div key={match.id} className="card bg-dark text-light mb-3">
                        <div className="card-body">
                            <h5 className="card-title">{match.team_one} vs {match.team_two}</h5>
                            <p className="card-text text-muted">
                                Starts: {new Date(match.start_time).toLocaleString()}
                            </p>
                            <div className="d-flex justify-content-around">
                                {/* This is a simplified display of odds. You would parse the live_odds JSON here. */}
                                <button className="btn btn-outline-info">
                                    {match.team_one} Wins (Odds: 2.10)
                                </button>
                                <button className="btn btn-outline-info">
                                    {match.team_two} Wins (Odds: 1.85)
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default LiveMatches;