import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/pages/WelcomePage/WelcomePage';
import LoginPage from './components/pages/LogInPage/LogInPage';
import RegistrationPage from './components/pages/RegistrationPage/RegistrationPage';
import HomePage from './components/pages/HomePage/HomePage';



const App = () => {
  console.log('App component rendered');
  console.log('RegistrationPage:', RegistrationPage);
  
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#F8DDD3',
        padding: '20px',
        border: '2px solid red' 
      }}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path='/auth' element={<LoginPage />}/>
          <Route path='/registration' element={<RegistrationPage />} />
          <Route path='/home' element = {<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;