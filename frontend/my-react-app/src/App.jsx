import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WelcomePage from './components/pages/WelcomePage/WelcomePage';
import LoginPage from './components/pages/LogInPage/LoginPage';
import RegistrationPage from './components/pages/RegistrationPage/RegistrationPage';
import HomePage from './components/pages/HomePage/HomePage';
import InfoPage from './components/pages/InfoPage/InfoPage';
import FoundPage from './components/pages/FoundPage/FoundPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage'
import './App.css'; 

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App"
        >
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path='/auth' element={<LoginPage />}/>
            <Route path='/registration' element={<RegistrationPage />} />
            <Route path='/home' element={<HomePage />} />
            <Route path='/search' element={<FoundPage />} />
            <Route path='/book/:id' element={<InfoPage/>} />
            <Route path='/profile' element={< ProfilePage/>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;