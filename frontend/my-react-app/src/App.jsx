import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WelcomePage from './components/pages/WelcomePage/WelcomePage';
import LoginPage from './components/pages/LogInPage/LoginPage';
import HomePage from './components/pages/HomePage/HomePage';
import InfoPage from './components/pages/InfoPage/InfoPage';
import FoundPage from './components/pages/FoundPage/FoundPage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage'
import './App.css'; 
import MyBooksPage from './components/pages/MyBooksPage/MyBooksPage';
import ReservedBooksPage from './components/pages/ReservedBooksPage/ReservedBooksPage';
import AddEditBookPage from './components/pages/AddEditBookPage/AddEditBookPage';
import RegistrationPage from './components/pages/RegistrationPage/RegistrationPage';

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
            <Route path='/mybooks' element={<MyBooksPage />} />
            <Route path='/reservations' element={<ReservedBooksPage />}/>
            <Route path="/add-book" element={<AddEditBookPage />} />
            <Route path="/edit-book/:id" element={<AddEditBookPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;