import React from 'react';
import Button from '../Button/Button';
import './DeleteBookModal.css';

const DeleteBookModal = ({ book, onClose, onConfirm }) => {
  if (!book) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-content">
        <div className="delete-modal-header">
          <h3>Вы не можете удалить книгу</h3>
          <button 
            onClick={onClose}
            className="delete-modal-close"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="delete-modal-body">
          <p>
            Книга <strong>«{book.title}»</strong> в настоящее время читается 
            пользователем <strong>{book.reservedBy}</strong> и не может быть удалена. 
            Дождитесь, пожалуйста, пока он сдаст книгу.
          </p>
        </div>
        <div className="delete-modal-footer">
          <Button 
            onClick={onClose}
            className="delete-modal-ok-button"
            style={{ 
              backgroundColor: '#711720', 
              borderColor: '#711720',
              color: 'white'
            }}
          >
            Понятно
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookModal;