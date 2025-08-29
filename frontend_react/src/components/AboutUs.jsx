import React from 'react';
import { Link } from 'react-router-dom'; // 👈 Import Link

const AboutUs = () => {
// Styles for the scrollable text container
const scrollableContainerStyle = {
height: '65vh', // Sets the container height to 65% of the viewport height
overflowY: 'auto', // Enables vertical scrolling
backgroundColor: '#2B3035', // A slightly lighter dark shade
padding: '2rem', // Adds space inside the container
borderRadius: '0.5rem', // Softer corners
border: '1px solid #495057', // A subtle border
};

return (
<div className="container text-light" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
{/* --- Page Header --- */}
<div className="text-center mb-4">
<h1 className="display-4 fw-bold">About & Terms of Service</h1>
<p className="lead text-muted">Your agreement to these terms is required to use our services.</p>
</div>

{/* --- Scrollable Text Container --- */}
<div style={scrollableContainerStyle}>
<h4 className="text-info">1. Introduction & Acceptance of Terms</h4>
<p>
Welcome to CricBet. By creating an account, accessing our website, or using any of our services, you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service and our Privacy Policy. If you do not agree with any of these terms, you are prohibited from using or accessing this site. You must be at least 18 years of age to use our services.
</p>
<h4 className="text-info mt-4">2. User Account and Responsibilities</h4>
<p>
To place a bet, you must register for a personal account. You are responsible for maintaining the confidentiality of your account credentials (username and password) and for all activities that occur under your account. You agree to provide accurate and complete information during registration and to keep this information updated. You must be of legal gambling age in your jurisdiction (18 years or older) to create an account.
</p>

<h4 className="text-info mt-4">3. Deposits and Withdrawals</h4>
<p>
All financial transactions on CricBet are processed in Indian Rupees (₹). Deposits must be made from a payment source for which you are the legal account holder. Withdrawals will be processed to the same method used for the initial deposit where possible. We reserve the right to request additional documentation to verify your identity before processing any withdrawal request to prevent fraudulent activity.
</p>

<h4 className="text-info mt-4">4. Fair Play and Betting Rules</h4>
<p>
CricBet is committed to ensuring a fair and transparent betting environment. All bets are settled based on the official results as declared by the governing body of the respective sport or event. We reserve the right to void any bet placed at obviously incorrect odds or in the event of any technical error, cheating, or fraudulent activity.
</p>

<h4 className="text-info mt-4">5. Limitation of Liability</h4>
<p>
Under no circumstances shall CricBet, its directors, or its employees be liable for any direct or indirect damages—including, but not limited to, loss of data or profit, or business interruption—arising from the use or inability to use our services. This limitation applies even if CricBet has been notified of the possibility of such damage.
</p>
<h4 className="text-info mt-4">6. Governing Law</h4>
<p>
Any claim relating to CricBet's website shall be governed by the laws of the State of Gujarat, India, without regard to its conflict of law provisions. You agree that any legal action or proceeding shall be brought exclusively in a court of competent jurisdiction located in Ahmedabad, Gujarat, India.
</p>

<h4 className="text-info mt-4">7. Prohibited Activities</h4>
<p>
Users are strictly prohibited from engaging in fraudulent activities, including but not limited to, using stolen financial information, engaging in collusion with other users, or using automated software (bots) to place bets. Any user found engaging in such activities will have their account terminated immediately, funds forfeited, and may be reported to the relevant legal authorities.
</p>

<h4 className="text-info mt-4">8. Intellectual Property</h4>
<p>
All content on this site, including text, graphics, logos, and software, is the property of CricBet or its content suppliers and is protected by international copyright laws. You may not reproduce, modify, or distribute any part of this website without our express written consent.
</p>
<h4 className="text-info mt-4">9. Changes to Terms</h4>
<p>
CricBet reserves the right, at its sole discretion, to modify or replace these Terms at any time. If a revision is material, we will make reasonable efforts to provide at least 30 days' notice before any new terms take effect. It is your responsibility to review these Terms periodically for changes.
</p>

{/* 👇 This section has been replaced with a button */}
<div className="text-center mt-5">
<h4 className="text-info">Have Questions?</h4>
<p>If you have any questions about these Terms of Service, please don't hesitate to reach out.</p>
<Link to="/contact" className="btn btn-info btn-lg">Contact Us</Link>
</div>
</div>
</div>
);
};
export default AboutUs