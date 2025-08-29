import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // New state for confirm password visibility
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegistration = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");

        if (!agreedToTerms) {
            setErrors({ terms: 'You must agree to the terms and conditions to register.' });
            return;
        }

        // New validation check for matching passwords
        if (password !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        const userData = {
            username, email, password
        };

        try {
            await axios.post("http://127.0.0.1:8000/api/v1/register/", userData);
            setSuccessMessage("Registration Successful! Redirecting to login...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setLoading(false);
            if (error.response && error.response.data) {
                setErrors(error.response.data);
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        }
    };

    return (
        <div className='container'>
            <div className='row justify-content-center'>
                <div className='col-md-6 bg-light-dark p-5 rounded'>
                    <h3 className='text-light text-center mb-4'>Create an account</h3>
                    <form onSubmit={handleRegistration}>
                        <div className='mb-3'>
                            <input type="text" className={`form-control ${errors.username ? 'is-invalid' : ''}`} placeholder='Enter username' value={username} onChange={(e) => setUsername(e.target.value)} />
                            {errors.username && <div className='invalid-feedback'>{errors.username}</div>}
                        </div>
                        <div className='mb-3'>
                            <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder='Enter email address' value={email} onChange={(e) => setEmail(e.target.value)} />
                            {errors.email && <div className='invalid-feedback'>{errors.email}</div>}
                        </div>

                        <div className='mb-3'>
                            <div className="input-group">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                                    placeholder='Set password' 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                                <span className="input-group-text" onClick={() => setShowPassword(!showPassword)} style={{cursor: 'pointer'}}>
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </span>
                            </div>
                            {errors.password && <div className='invalid-feedback d-block'>{errors.password}</div>}
                        </div>

                        {/* New Confirm Password Field */}
                        <div className='mb-3'>
                            <div className="input-group">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} 
                                    placeholder='Confirm password' 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                />
                                <span className="input-group-text" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{cursor: 'pointer'}}>
                                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                </span>
                            </div>
                            {errors.confirmPassword && <div className='invalid-feedback d-block'>{errors.confirmPassword}</div>}
                        </div>

                        <div className='mb-3 p-3 border rounded border-secondary'>
                            <h5 className='text-light'>Terms & Conditions</h5>
                            <p className='text-muted small'>
                                By creating an account, you certify that you are 18 years of age or older and that you have read and agree to our terms of service. You acknowledge that this service involves real-money transactions and you agree to participate responsibly. All user data is managed according to our privacy policy.
                            </p>
                            <div className="form-check">
                                <input 
                                    className={`form-check-input ${errors.terms ? 'is-invalid' : ''}`}
                                    type="checkbox" 
                                    id="termsCheck"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                />
                                <label className="form-check-label text-light" htmlFor="termsCheck">
                                    I have read and agree to the terms and conditions.
                                </label>
                                {errors.terms && <div className='invalid-feedback d-block'>{errors.terms}</div>}
                            </div>
                        </div>
                        
                        {successMessage && <div className='alert alert-success'>{successMessage}</div>}
                        {errors.detail && <div className='alert alert-danger mt-3'>{errors.detail}</div>}
                        {errors.non_field_errors && <div className='alert alert-danger mt-3'>{errors.non_field_errors}</div>}
                        {errors.general && <div className='alert alert-danger mt-3'>{errors.general}</div>}

                        {loading ? (
                            <button type='submit' className='btn btn-info d-block mx-auto' disabled>
                                <FontAwesomeIcon icon={faSpinner} spin /> Please wait...
                            </button>
                        ) : (
                            <button type='submit' className='btn btn-info d-block mx-auto' disabled={!agreedToTerms}>
                                Register
                            </button>
                        )}
                    </form>

                    <div className='text-center mt-3'>
                        <p className='text-muted'>
                            Already have an account? <Link to="/login" className="text-info">Log in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
