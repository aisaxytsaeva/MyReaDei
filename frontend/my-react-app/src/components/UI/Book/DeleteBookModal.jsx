import React from 'react';
import './DeleteBookModal.css';

const DeleteBookModal = ({ book, onClose, onConfirm }) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Нельзя удалить книгу</h2>
        <p className="modal-message">
          Книга <strong>"{book.title}"</strong> в данный момент забронирована 
          пользователем <strong>{book.reservedBy}</strong>.
        </p>
        
        {book.daysLeft && book.daysLeft > 0 && (
          <p className="modal-info">
            Бронирование истекает через {book.daysLeft} дней.
          </p>
        )}
        
        <p className="modal-warning">
          Вы не можете удалить книгу, пока она забронирована.
          Дождитесь окончания бронирования или отмените его.
        </p>
        
        <div className="modal-actions">
          <button 
            onClick={onClose}
            className="modal-button cancel-button"
          >
            Понятно
          </button>
          <button 
            onClick={handleConfirm}
            className="modal-button delete-button"
            style={{ backgroundColor: '#dc3545' }}
          >
            Удалить принудительно
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookModal;