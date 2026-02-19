import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import WelcomePage from "./components/pages/WelcomePage/WelcomePage";
import LoginPage from "./components/pages/LogInPage/LoginPage";
import RegistrationPage from "./components/pages/RegistrationPage/RegistrationPage";
import HomePage from "./components/pages/HomePage/HomePage";
import FoundPage from "./components/pages/FoundPage/FoundPage";
import InfoPage from "./components/pages/InfoPage/InfoPage";
import ProfilePage from "./components/pages/ProfilePage/ProfilePage";
import MyBooksPage from "./components/pages/MyBooksPage/MyBooksPage";
import ReservedBooksPage from "./components/pages/ReservedBooksPage/ReservedBooksPage";
import AddEditBookPage from "./components/pages/AddEditBookPage/AddEditBookPage";
import "./App.css";
import CreateLocationPage from "./components/pages/CreateLocationPage/CreateLocationPage";
import AdminPage from "./components/pages/AdminPage/AdminPage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<FoundPage />} />
            <Route path="/book/:id" element={<InfoPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/mybooks" element={<MyBooksPage />} />
            <Route path="/reservations" element={<ReservedBooksPage />} />
            <Route path="/add-book" element={<AddEditBookPage />} />
            <Route path="/edit-book/:id" element={<AddEditBookPage />} />
            <Route path="/locations/create" element={<CreateLocationPage/>} />
            <Route path="/admin" element={<AdminPage/>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
