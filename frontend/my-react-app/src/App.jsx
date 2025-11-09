import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/WelcomePage/WelcomePage';



const App = () => {
  return (
    <Router>
      <div >
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          {/* Добавьте другие маршруты позже */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;