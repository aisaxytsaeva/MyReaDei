import React from 'react';
import Container from '../../UI/Container/Container';
import Button from '../../UI/Button/Button';
import './WelcomePage.css';
import Header from '../../UI/Header/Header';

const WelcomePage = () => {
  const handleGetStarted = () => {
    console.log('Начать читать!');
  };

  return (
    <div className="welcome-page-wrapper">
      <Header />
      <section className="welcome-page">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Добро пожаловать на буккроссинг платформу MyReaDei!
          </h1>
          
          <div className="features-section">
            <div className="feature-row feature-row-left">
              <div className="image-container">
                <div className="feature-icon-square">
                  <img src="/assets/image_1.svg" alt="Библиотека" />
                </div>
              </div>
              <div className="text-container">
                <h2>Словно настоящая библиотека!</h2>
                <p>Огромный каталог со множеством книг на любой вкус. Каждый найдет то, что желает!</p>
              </div>
            </div>


            <div className="feature-row feature-row-right">
              <div className="text-container">
                <h2>Находите людей с общими интересами.</h2>
                <p>Обменивайтесь любимыми историями с другими читателями! Добавляйте свои книги и бронируйте чужие.</p>
              </div>
              <div className="image-container">
                <div className="feature-icon-square">
                  <img src="/assets/image_2.svg" alt="Люди" />
                </div>
              </div>
            </div>
            <div className="feature-row feature-row-left">
              <div className="image-container">
                <div className="feature-icon-square">
                  <img src="/assets/image_3.svg" alt="Статистика" />
                </div>
              </div>
              <div className="text-container">
                <h2>Рейтинги и статистика.</h2>
                <p>Узнавайте, что популярно прямо сейчас! Становитесь самыми активными читателями сайта!</p>
              </div>
            </div>
          </div>

          <div className="cta-container">
            <p className="cta-text">
              Поделитесь своей библиотекой прямо сейчас!
            </p>
            <Button 
              size="large" 
              onClick={handleGetStarted}
              href="/home"
              className="cta-button"
            >
              Начать читать
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;