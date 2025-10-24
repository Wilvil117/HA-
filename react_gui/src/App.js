import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from 'react';
import MerkAdmin from './merkadmin/merkadmin';
import BeoordelaarAdmin from './beoordelaaradmin/beoordelaaradmin';
import Merk from './merk/merk';
import SpanAdmin from './spanadmin/spanadmin';
import JudgeInterface from './beoordelaar/JudgeInterface';
import Login from './components/Login';
import TournamentTest from './roundadmin/TournamentTest';
import RealTournamentSystem from './roundadmin/RealTournamentSystem';
import TestDataLoader from './roundadmin/TestDataLoader';
import authService from './services/auth_service';
import logo from "./logo.svg"

function NavBar({ user, onLogout }){

  function route(path){
  window.location.href = "/" + path;
  }
  
  return  (
    <div className="navbar">
      <div
        className="nav-item"
        onClick={() => route("vereistes")}
      >
        <img src={logo} alt="Logo" style={{ height: "50px" }} />
      </div>
      
      {/* Admin only routes */}
      {user && user.role === 'admin' && (
        <>
          <div
            className="nav-item"
            onClick={() => route("merkadmin")}
          >
            Merk Admin
          </div>
          <div
            className="nav-item"
            onClick={() => route("spanadmin")}
          >
            Span Admin
          </div>
          <div
            className="nav-item"
            onClick={() => route("beoordelaaradmin")}
          >
            Beoordelaar Admin
          </div>
            <div
              className="nav-item"
              onClick={() => route("tournament-test")}
            >
              🏆 Tournament Test
            </div>
            <div
              className="nav-item"
              onClick={() => route("real-tournament")}
            >
              🏆 Real Tournament
            </div>
            <div
              className="nav-item"
              onClick={() => route("test-data")}
            >
              🔧 Test Data
            </div>
        </>
      )}
      
      {/* Beoordelaar gets Merk page and Judge Interface */}
      {user && user.role === 'beoordelaar' && (
        <>
          <div
            className="nav-item"
            onClick={() => route("merk")}
          >
            Merk
          </div>
          <div
            className="nav-item"
            onClick={() => route("judge")}
          >
            Beoordelaar Koppelvlak
          </div>
        </>
      )}
      
      {/* User info and logout */}
      {user && (
        <div className="nav-user">
          <span>Welkom, {user.email}</span>
          <span className="user-role">({user.role})</span>
          <button onClick={onLogout} className="logout-btn">Uitteken</button>
        </div>
      )}
    </div>
  );
}

function Vereistes() {
  return (
    <div>
      <h1>HA1 Vereistes</h1>
      <form>
        <div>
          <label>
            <input type="checkbox" />
            Merk admin bladsy
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Merk bladsy
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Span admin bladsy
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Beoordelaar admin bladsy
          </label>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    if (authService.isLoggedIn()) {
      setUser(authService.getCurrentUser());
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setUser(authService.getCurrentUser());
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Laai...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <NavBar user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Routes>
          <Route path="/vereistes" element={<Vereistes />} />
          
          {/* Admin only routes */}
          {user.role === 'admin' && (
            <>
              <Route path="/merkadmin" element={<MerkAdmin />} />
              <Route path="/spanadmin" element={<SpanAdmin />} />
              <Route path="/beoordelaaradmin" element={<BeoordelaarAdmin />} />
              <Route path="/tournament-test" element={<TournamentTest />} />
              <Route path="/real-tournament" element={<RealTournamentSystem />} />
              <Route path="/test-data" element={<TestDataLoader />} />
            </>
          )}
          
          {/* Beoordelaar gets Merk page and Judge Interface */}
          {user.role === 'beoordelaar' && (
            <>
              <Route path="/merk" element={<Merk />} />
              <Route path="/judge" element={<JudgeInterface />} />
            </>
          )}
          
          <Route path="/" element={<Vereistes />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
