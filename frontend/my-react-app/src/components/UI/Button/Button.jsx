import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  href,
  to, // Добавляем поддержку React Router
  type = 'button' // Добавляем тип для button
}) => {
  const className = `${styles.button} ${styles[variant]} ${styles[size]}`;
  
  // Для React Router навигации
  if (to) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  
  // Для обычных HTML ссылок
  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  
  // Для кнопок
  return (
    <button type={type} className={className} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;