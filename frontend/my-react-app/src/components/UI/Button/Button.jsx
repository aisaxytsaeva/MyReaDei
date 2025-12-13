import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  href 
}) => {
  const className = `${styles.button} ${styles[variant]} ${styles[size]}`;
  
  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;