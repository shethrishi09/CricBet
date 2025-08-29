// File: src/components/TransactionHistory.jsx

import React, { useContext } from 'react';
import { AuthContext } from '../AuthProvider';

const TransactionHistory = () => {
  // 👇 THE FIX: Get 'transactions' directly from the context, not from 'user'
  const { transactions } = useContext(AuthContext);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="px-3" style={{ minWidth: '300px' }}>
      <h6 className="dropdown-header">Recent Transactions</h6>
      {/* This now correctly uses the 'transactions' state from the AuthProvider */}
      {transactions && transactions.length > 0 ? (
        <ul className="list-unstyled mb-0">
          {transactions.slice(0, 5).map((tx, index) => (
            <li key={index} className="d-flex justify-content-between text-light small py-1">
              <span style={{ color: tx.transaction_type === 'deposit' ? '#198754' : '#dc3545', textTransform: 'capitalize' }}>
                {tx.transaction_type}
              </span>
              <span>₹{parseFloat(tx.amount).toFixed(2)}</span>
              <span className="text-muted">{formatDate(tx.timestamp)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small text-muted px-2 mb-0">No recent transactions.</p>
      )}
    </div>
  );
};

export default TransactionHistory;