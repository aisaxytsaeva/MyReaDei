import React from 'react';
import Button from '../../UI/Button/Button';

const RegistrationPage = () => {
    const handleReg = () => {
        console.log('Регистрация завершена');
    };

    return (
        <div>
            <h1>MyReaDei</h1>
            
            <h2>Регистрация</h2>
            
            <div>
                <label>Логин</label>
                <input type="text" />
            </div>

            <div>
                <label>Почта</label>
                <input type="email" /> 
            </div>

            <div>
                <label>Пароль</label>
                <input type="password" />
            </div>

            <Button 
                size="large" 
                onClick={handleReg}
                href="/home"
            >
                Зарегистрироваться 
            </Button>
        </div>
    );
};

export default RegistrationPage;