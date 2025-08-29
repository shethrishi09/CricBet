import React, { useState } from 'react';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ContactUs = () => {
    const [category, setCategory] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!category) {
            setError('Please select a category for your issue.');
            setLoading(false);
            return;
        }
        if (!message.trim()) {
            setError('Please describe your issue before submitting.');
            setLoading(false);
            return;
        }

        try {
            const fullMessage = `Category: ${category}\n\nDetails:\n${message}`;
            const response = await api.post('/contact/', { message: fullMessage });
            
            // On success, show the message. The button will stay in its loading state.
            setSuccess(response.data.message);

            // After 3 seconds, reset the form and the button.
            setTimeout(() => {
                setSuccess('');
                setMessage('');
                setCategory('');
                setLoading(false); // Turn off the spinner after the delay
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
            setLoading(false); // Turn off the spinner immediately on error
        }
    };

    const getPlaceholderText = () => {
        switch (category) {
            case 'Deposit Issue':
                return 'Please describe your deposit issue. If possible, include the amount, date, and any transaction ID you received.';
            case 'Withdrawal Issue':
                return 'Please describe your withdrawal issue. If possible, include the amount and date of the request.';
            case 'Login Problem':
                return 'Please describe the problem you are facing while trying to log in. Include any error messages you are seeing.';
            case 'General Question':
                return 'Please type your general question here.';
            default:
                return 'Please select a category first.';
        }
    };

    return (
        <div className="container text-light" style={{ maxWidth: '700px', marginTop: '5rem' }}>
            <div className="text-center mb-4">
                <h1 className="display-4 fw-bold">Contact Support</h1>
                <p className="lead text-muted">We're here to help. Please select the topic that best describes your issue.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="category" className="form-label fs-5">What is your problem related to?</label>
                    <select 
                        className="form-select" 
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="" disabled>-- Select a Category --</option>
                        <option value="Deposit Issue">Deposit Issue</option>
                        <option value="Withdrawal Issue">Withdrawal Issue</option>
                        <option value="Login Problem">Login Problem</option>
                        <option value="General Question">General Question</option>
                    </select>
                </div>

                {category && (
                    <div className="mb-3">
                        <label htmlFor="message" className="form-label fs-5">Please provide details:</label>
                        <textarea 
                            className="form-control" 
                            id="message" 
                            rows="8"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={getPlaceholderText()}
                        ></textarea>
                    </div>
                )}

                {success && <div className="alert alert-success">{success}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {loading ? (
                    <button type="submit" className='btn btn-info w-100' disabled>
                        <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                    </button>
                ) : (
                    <button type="submit" className="btn btn-info w-100" disabled={!category || !message}>
                        Submit Query
                    </button>
                )}
            </form>
        </div>
    );
};

export default ContactUs;
