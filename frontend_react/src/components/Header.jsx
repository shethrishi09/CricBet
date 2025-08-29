import React, { useContext, useState } from 'react';
import Button from './Button';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import { AuthContext } from '../AuthProvider';
import TransactionHistory from './TransactionHistory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// 1. Updated links structure to include the new "Bets" dropdown
const mainLinks = [
 
  { 
    name: 'Casino', 
    path: '/casino',
    children: [
      { name: 'Dice', path: '/casino/dice' },
 
      { name: 'Coin Flip', path: '/casino/coin-flip' },
    ]
  },
  {
    name: 'Bets', // This is not a link itself
    children: [
        { name: 'Casino Bets', path: '/bets/casino' },
         
    ]
  },
  { name: 'About Us', path: '/about' },
  { name: 'Contact Support', path: '/contact' } 
];

const Header = () => {
  const { isLoggedIn, setIsLoggedIn, user, exposure } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation(); 

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const filteredLinks = mainLinks.reduce((acc, link) => {
    const query = searchQuery.toLowerCase();
    const parentMatch = link.name.toLowerCase().includes(query);

    if (link.children) {
      const childrenMatch = link.children.filter(child =>
        child.name.toLowerCase().includes(query)
      );
      if (childrenMatch.length > 0) {
        acc.push({ ...link, children: childrenMatch });
      } else if (parentMatch) {
        acc.push(link);
      }
    } else if (parentMatch) {
      acc.push(link);
    }
    return acc;
  }, []);

  const handleClearSearch = (e) => {
    e.stopPropagation(); 
    setSearchQuery('');
  };

  return (
    <>
      <style>{`
        .dropdown-submenu {
          position: relative;
        }
        .dropdown-submenu .dropdown-menu {
          top: 0;
          left: 100%;
          margin-top: -1px;
          display: none;
        }
        .dropdown-submenu:hover > .dropdown-menu {
          display: block;
        }
        .dropdown-item.dropdown-toggle::after {
          display: inline-block;
          margin-left: .255em;
          vertical-align: .255em;
          content: "";
          border-top: .3em solid;
          border-right: .3em solid transparent;
          border-bottom: 0;
          border-left: .3em solid transparent;
          transform: rotate(-90deg);
          position: absolute;
          right: 1rem;
          top: 1rem;
        }
      `}</style>
      <nav className='navbar container pt-3 pb-3 align-items-start d-flex justify-content-between'>
        <div className="d-flex align-items-center">
          {isLoggedIn && (
            <div className="dropdown me-3">
              <button className="btn btn-outline-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                &#9776;
              </button>
              <ul className="dropdown-menu dropdown-menu-dark p-3" style={{ minWidth: "250px" }}>
                <li>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button" 
                        onClick={handleClearSearch}
                        style={{ zIndex: 100 }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                </li>

                {filteredLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  if (link.children) {
                    const ParentLink = link.path ? Link : 'span';
                    
                    return (
                      <li key={link.name} className="dropdown-submenu">
                        <ParentLink 
                          className={`dropdown-item dropdown-toggle ${isActive ? 'active' : ''}`} 
                          to={link.path || '#'}
                          // 👇 THIS IS THE FIX: Stop propagation on click for non-link items
                          onClick={!link.path ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
                        >
                          {link.name}
                        </ParentLink>
                        <ul className="dropdown-menu dropdown-menu-dark">
                          {link.children.map(child => (
                            <li key={child.name}>
                              <Link className={`dropdown-item ${location.pathname === child.path ? 'active' : ''}`} to={child.path}>
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  }
                  return (
                    <li key={link.name}>
                      <Link className={`dropdown-item ${isActive ? 'active' : ''}`} to={link.path}>
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
                
                {filteredLinks.length === 0 && (
                    <li><span className="dropdown-item text-muted">No results found</span></li>
                )}

              </ul>
            </div>
          )}
          <Link className='navbar-brand text-light' to="/" id='cribet'>CricBet</Link>
        </div>

        <div>
          {isLoggedIn ? (
            <div className='d-flex align-items-center'>
              <button 
                className='btn me-3 mt-4 disabled' 
                style={{
                    cursor: 'default', lineHeight: 1.2, textAlign: 'left', 
                    padding: '6px 12px', border: '1px solid #495057',
                    background: 'linear-gradient(145deg, #2f353a, #262a2e)',
                    boxShadow: 'inset 2px 2px 4px #1e2225, inset -2px -2px 4px #363c41'
                }}
              >
                <div className='text-light small'>
                  Balance: <strong>₹{user && user.balance !== null ? parseFloat(user.balance).toFixed(2) : '0.00'}</strong>
                </div>
                <div className='text-muted small'>
                  Exp: <strong>₹{exposure !== null ? parseFloat(exposure).toFixed(2) : '0.00'}</strong>
                </div>
              </button>

              <Button text="Deposit" class="btn-success me-2 mt-4" url="/deposit" />
              <Button text="Withdraw" class="btn-warning me-3 mt-4" url="/withdraw" />
              <div className="dropdown me-3">
                <button className="btn btn-secondary dropdown-toggle mt-4" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {user ? user.username : 'Profile'}
                </button>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end p-2">
                  <li><TransactionHistory /></li>
                </ul>
              </div>
              <button className='btn btn-danger mt-4' onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <Button text="Login" class="btn-outline-info mt-4 " url="/login" />
              &nbsp;
              <Button text="Register" class="btn-info mt-4" url="/register" />
            </>
          )}
        </div>
      </nav>
    </>
  )
}

export default Header;
