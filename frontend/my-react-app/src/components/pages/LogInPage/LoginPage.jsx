import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import Button from '../../UI/Button/Button';
import Header from '../../UI/Header/Header';
import './LogInPage.css';

const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    

    if (!login.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', login);
      formData.append('password', password);
      formData.append('grant_type', 'password');
      formData.append('scope', '');
      formData.append('client_id', '');
      formData.append('client_secret', '');
      
      console.log('🔐 Отправляем запрос логина...');
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData,
        mode: 'cors'
      });
      
      console.log('📥 Ответ логина:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Успешный логин:', data);
        
        // Сохраняем токен
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          console.log('🔑 Токен сохранен');
        }
        

        let userData = null;
        try {
          console.log('👤 Запрашиваем профиль пользователя...');
          const profileResponse = await fetch('http://127.0.0.1:8000/users/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Accept': 'application/json'
            }
          });
          
          console.log('📥 Ответ профиля:', profileResponse.status);
          
          if (profileResponse.ok) {
            userData = await profileResponse.json();
            console.log('✅ Профиль получен:', userData);
            
  
            userData = {
              id: userData.id, 
              username: userData.username || login,
              email: userData.email || `${login}@example.com`,
              name: userData.username || login,
              access_token: data.access_token
            };
          } else {
            console.warn('⚠️ Не удалось получить профиль, используем токен');

            try {
              const tokenParts = data.access_token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('🔍 Декодированный токен:', payload);
                userData = {
                  id: payload.user_id || payload.sub || 1, // берем из токена
                  username: login,
                  email: `${login}@example.com`,
                  name: login,
                  access_token: data.access_token
                };
              }
            } catch (tokenErr) {
              console.error('❌ Ошибка декодирования токена:', tokenErr);
            }
          }
        } catch (profileErr) {
          console.error('❌ Ошибка получения профиля:', profileErr);
        }
        
        // Если не удалось получить профиль, используем fallback
        if (!userData) {
          console.warn('⚠️ Используем fallback данные');
          
          // Пробуем определить ID по логину
          let userId = 1;
          if (login === 'test_user') userId = 2;
          if (login === 'demo_user') userId = 1;
          
          userData = {
            id: userId, // ← Используем разные ID для разных пользователей
            username: login,
            email: `${login}@example.com`,
            name: login,
            access_token: data.access_token || 'token_' + Date.now()
          };
        }
        
        console.log('👤 Финальные данные пользователя:', userData);
        
        // Вызываем authLogin с токеном
        authLogin(userData, data.access_token);
        navigate('/home');
        
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка логина:', errorText);
        
        if (response.status === 401) {
          setError('Неверный логин или пароль');
        } else if (response.status === 422) {
          setError('Ошибка в данных');
        } else if (response.status === 404) {
          setError('Сервис временно недоступен');
        } else {
          setError(`Ошибка ${response.status}`);
        }
      }
      
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="login-page">
      <Header />
      
      <div className="login-container">
        <h2 className="login-title">Войти в аккаунт</h2>
        
        {error && (
          <div style={{
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
      
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input 
              type="text" 
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="form-input"
              placeholder="test_user"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="password"
              disabled={loading}
              required
            />
          </div>

          <div className="button-center">
            <Button 
              type="submit" 
              className="fixed-width"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </div>
        </form>

        <div className="button-center">
          <Button to='/registration' className="fixed-width">Зарегистрироваться</Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;