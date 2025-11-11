import React from 'react';
import Container from '../../UI/Container/Container';
import Button from '../../UI/Button/Button';

const WelcomePage = () => {
  const handleGetStarted = () => {
    console.log('Начать читать!');
  };

  return (
    <section>
      <Container>
        <div>
          <h1>
            Добро пожаловать на буккроссинг платформу MyReaDei!
          </h1>
          
          <div>
            <div>
              <h2>Словно настоящая библиотека!</h2>
              <p>
                Огромный каталог со множеством книг на любой вкус.
                Каждый найдет то, что желает!
              </p>
            </div>

            <div>
              <h2>Находите людей с общими интересами.</h2>
              <p>
                Обменивайтесь любимыми историями с другими читателями!
                Добавляйте свои книги и бронируйте чужие.
              </p>
            </div>

            <div>
              <h2>Рейтинги и статистика.</h2>
              <p>
                Узнавайте, что популярно прямо сейчас! Становитесь самыми активными читателями сайта!
              </p>
            </div>
          </div>

          <div>
            <p>
              Поделитесь своей библиотекой прямо сейчас!
            </p>
            <Button 
              size="large" 
              onClick={handleGetStarted}
              href="/auth"
            >
              Начать читать
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WelcomePage;