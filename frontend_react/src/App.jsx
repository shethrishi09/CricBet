import { useState } from 'react'
import "./assets/css/style.css"
import Header from './components/Header'
import Footer from './components/Footer'
import Main from './components/Main'
import {BrowserRouter,Routes,Route} from "react-router-dom"
import Register from './components/Register'
import Login from './components/Login'
import AuthProvider from './AuthProvider'
import Deposit from './components/Deposit'
import Withdraw from './components/Withdraw'
import ProtectedRoute from './components/ProtectedRoute'
import ContactUs from './components/ContactUs'
import AboutUs from './components/AboutUs'
import Casino from './components/Casino'
import DiceGame from './components/DiceGame'
import MinesGame from './components/MinesGame'
import CoinGame from './components/CoinGame'
import MatchDetail from './components/MatchDetail'
import CasinoBets from './components/CasinoBets'
import MyBets from './components/MyBets' // Import the MyBets component
import LiveScore from './components/LiveScore'
function App() {
 
  return (
    <>
    <AuthProvider>
      <BrowserRouter>
        <Header></Header>
        <Routes>
          <Route path='/' element={<Main/>}></Route>
          <Route path='/register' element={<Register/>}></Route>
          <Route path='/login' element={<Login/>}></Route>
          <Route 
            path="/deposit" 
            element={
              <ProtectedRoute>
                <Deposit />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/withdraw" 
            element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            } 
          />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route 
            path="/casino" 
            element={<ProtectedRoute><Casino /></ProtectedRoute>} 
          />
          <Route 
            path="/casino/dice" 
            element={<ProtectedRoute><DiceGame /></ProtectedRoute>} 
          />
          {/* <Route 
            path="/casino/mines" 
            element={<ProtectedRoute><MinesGame /></ProtectedRoute>} 
          /> */}
          <Route 
            path="/casino/coin-flip" 
            element={<ProtectedRoute><CoinGame /></ProtectedRoute>} 
          />
          
          
          <Route  
            path="/bets/casino" 
            element={<ProtectedRoute><CasinoBets /></ProtectedRoute>} 
          />
          {/* Add the MyBets route */}
          <Route 
            path="/my-bets" 
            element={<ProtectedRoute><MyBets /></ProtectedRoute>} 
          />
         {/* 👇 2. Add this new route */}
            <Route 
            path="/match/:matchId" 
            element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} 
          />

        
        </Routes>
        <Footer></Footer>
      </BrowserRouter>
    </AuthProvider>
    </>
  )
}

export default App