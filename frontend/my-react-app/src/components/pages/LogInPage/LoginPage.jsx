import React from 'react';
import Button from '../../UI/Button/Button';

const LoginPage = () => {
  const handleLogin = () => {
    console.log('Вход в аккаунт');
    
  };

  const handleRegister = () => {
    console.log('Регистрация');
    
  };
  return (
    <div>
      <h1>MyReaDei</h1>
      
      <h2>Войти в аккаунт</h2>
      
      <div>
        <label>Логин</label>
        <input type="text" />
      </div>

      <div>
        <label>Пароль</label>
        <input type="password" />
      </div>

      <Button 
              size="large" 
              onClick={handleLogin}
              href="/home"
            >
              Войти
            </Button>
      

      <Button 
              size="large" 
              onClick={handleRegister}
              href="/register"
            >
              Зарегестрироваться
            </Button>
    </div>
  );
};

export default LoginPage;