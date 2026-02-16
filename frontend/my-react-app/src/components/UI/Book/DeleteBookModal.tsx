import React from "react";
import "./DeleteBookModal.css";

type BookForDeleteModal = {
  title: string;
  reservedBy: string;
  daysLeft?: number | null;
};

type Props = {
  book: BookForDeleteModal;
  onClose: () => void;
  onConfirm?: () => void;
};

const DeleteBookModal: React.FC<Props> = ({ book, onClose, onConfirm }) => {
  const handleConfirm = (): void => {
    onConfirm?.();
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

        {typeof book.daysLeft === "number" && book.daysLeft > 0 && (
          <p className="modal-info">Бронирование истекает через {book.daysLeft} дней.</p>
        )}

        <p className="modal-warning">
          Вы не можете удалить книгу, пока она забронирована. Дождитесь окончания
          бронирования или отмените его.
        </p>

        <div className="modal-actions">
          <button onClick={onClose} type="button" className="modal-button cancel-button">
            Понятно
          </button>

          <button
            onClick={handleConfirm}
            type="button"
            className="modal-button delete-button"
            style={{ backgroundColor: "#dc3545" }}
          >
            Удалить принудительно
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookModal;
