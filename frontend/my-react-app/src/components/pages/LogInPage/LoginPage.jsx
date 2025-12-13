import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import Button from '../../UI/Button/Button';
import Header from '../../UI/Header/Header';
import './LogInPage.css';

const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate(); 

  const handleSubmit = (e) => {
  e.preventDefault();
  console.log('Login function called'); 
  const userData = { id: 1, name: 'Artyom_X', email: 'artyom@mail.ru' };
  authLogin(userData);
  console.log('User after login:', userData); 
  navigate('/home');
};

  return (
    <div className="login-page">
      <Header />
      
      <div className="login-container">
        <h2 className="login-title">Войти в аккаунт</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input 
              type="text" 
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="button-center">
            <Button type="submit" className="fixed-width">Войти</Button>
          </div>
        </form>

        <div className="button-center">
          <Button href='/registration' className="fixed-width">Зарегистрироваться</Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;