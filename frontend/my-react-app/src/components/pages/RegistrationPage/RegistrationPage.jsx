import React from 'react';
import Button from '../../UI/Button/Button';
import Header from '../../UI/Header/Header';
import './RegistrationPage.css';

const RegistrationPage = () => {
    const handleReg = () => {
        console.log('Регистрация завершена');
    };

    return (
        <div className="registration-page">
            <Header />
            
            <div className="registration-container">
                <h2 className="registration-title">Регистрация</h2>
                
                <form className="registration-form">
                    <div className="form-group">
                        <label className="form-label">Логин</label>
                        <input 
                            type="text" 
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Почта</label>
                        <input 
                            type="email" 
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Пароль</label>
                        <input 
                            type="password" 
                            className="form-input"
                        />
                    </div>

                    <div className="button-center">
                        <Button 
                            size="large" 
                            onClick={handleReg}
                            href="/home"
                            style={{ 
                                width: '460px', 
                                height: '50px'
                            }}
                        >
                            Зарегистрироваться 
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationPage;