import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Deposit = () => {
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [transactionIdSent, setTransactionIdSent] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const [attempts, setAttempts] = useState(3);
    const [timer, setTimer] = useState(300);
    const [pastRequests, setPastRequests] = useState([]);
    const [isRejected, setIsRejected] = useState(false); // 👈 New state for the rejected flow

    const fetchHistory = async () => {
        try {
            const response = await api.get('/deposit/history/');
            setPastRequests(response.data);
        } catch (err) {
            console.error("Could not fetch deposit history", err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (transactionIdSent) {
            const interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        alert('Time has expired.');
                        navigate(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [transactionIdSent, navigate]);

    useEffect(() => {
        if (attempts <= 0) {
            const rejectRequest = async () => {
                try {
                    await api.post('/deposit/reject/', { amount, otp: transactionId });
                    setError('You have exceeded the maximum attempts. Your request has been marked as rejected.');
                    setIsRejected(true); // 👈 Trigger the "Try Again" screen
                    fetchHistory(); // Refresh history to show the rejected request
                } catch (err) {
                    alert('An error occurred while marking the request as rejected.');
                    navigate('/');
                }
            };
            rejectRequest();
        }
    }, [attempts, amount, transactionId, navigate]);

    const handleGenerateTransactionId = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount < 100 || numericAmount > 100000) {
            setError('Please enter a valid amount between ₹100 and ₹100,000.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/generate-otp/', { amount }); 
            setTransactionIdSent(true);
            setMessage(`Transaction ID generated successfully. For testing, use: ${response.data.otp}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate Transaction ID.');
        } finally {
            setLoading(false);
        }
    };
  
    const handleVerifyAndDeposit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/deposit/verify/', { amount, otp: transactionId });
            alert(response.data.message);
            setTransactionIdSent(false);
            setAmount('');
            setTransactionId('');
            setMessage('');
            setTimer(300);
            setAttempts(3);
            fetchHistory();
        } catch (err) {
            setAttempts(prev => prev - 1);
            setError(`${err.response?.data?.error || 'Verification failed.'} You have ${attempts - 1} attempts remaining.`);
        } finally {
            setLoading(false);
        }
    };

    // 👇 New handler to reset the form
    const handleTryAgain = () => {
        setIsRejected(false);
        setTransactionIdSent(false);
        setAmount('');
        setTransactionId('');
        setMessage('');
        setError('');
        setTimer(300);
        setAttempts(3);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const getStatusBadge = (status) => {
        if (status === 'approved' || status === 'completed') return <span className="badge bg-success">Approved</span>;
        if (status === 'rejected' || status === 'failed') return <span className="badge bg-danger">Rejected</span>;
        return <span className="badge bg-warning text-dark">Pending</span>;
    };

    return (
        <div className="container text-light" style={{ maxWidth: '700px', marginTop: '5rem' }}>
            <h2>Deposit Funds</h2>
            <hr />
            {message && <div className="alert alert-info">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* --- UI Logic --- */}
            {isRejected ? (
                // --- Show "Try Again" screen ---
                <div className="text-center">
                    <p>Please try the process again.</p>
                    <button className="btn btn-primary" onClick={handleTryAgain}>Try Again</button>
                </div>
            ) : !transactionIdSent ? (
                // --- Show initial amount form ---
                <form onSubmit={handleGenerateTransactionId}>
                    <div className="mb-3">
                        <label htmlFor="amount" className="form-label">Amount (INR)</label>
                        <input type="number" className="form-control" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" required />
                        <div className="form-text text-info mt-1">Min: ₹100, Max: ₹100,000</div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? 'Generating ID...' : 'Get Transaction ID'}</button>
                </form>
            ) : (
                // --- Show verification form ---
                <form onSubmit={handleVerifyAndDeposit}>
                    <div className="mb-3">
                        <label>Amount to Deposit:</label>
                        <h4>₹{amount}</h4>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="transactionId" className="form-label">Enter Transaction ID</label>
                        <input type="text" className="form-control" id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the 6-digit ID" required />
                    </div>
                    <div className="d-flex justify-content-between text-muted small mb-3">
                        <span>Time remaining: {formatTime(timer)}</span>
                        <span>Attempts left: {attempts}</span>
                    </div>
                    <button type="submit" className="btn btn-success w-100" disabled={loading || attempts <= 0}>
                        {loading ? 'Verifying...' : 'Verify & Submit Request'}
                    </button>
                </form>
            )}
            
            <div style={{ marginTop: '4rem' }}>
                <h3>Deposit History</h3>
                <hr />
                <div className="table-responsive">
                    <table className="table table-dark table-striped">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Transaction ID</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pastRequests.length > 0 ? pastRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.created_at}</td>
                                    <td>₹{parseFloat(req.amount).toFixed(2)}</td>
                                    <td>{req.transaction_id}</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center text-muted">No deposit history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Deposit;
