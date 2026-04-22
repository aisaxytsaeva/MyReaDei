import React from "react";
import "./ConfirmReservationModal.css";

interface ConfirmReservationModalProps {
  bookTitle: string;
  readerName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmReservationModal: React.FC<ConfirmReservationModalProps> = ({
  bookTitle,
  readerName,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Подтверждение бронирования</h3>
        <p>
          Книгу <strong>"{bookTitle}"</strong> хочет забронировать читатель{" "}
          <strong>{readerName}</strong>.
        </p>
        <p>Вы уверены, что хотите подтвердить выдачу книги?</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="confirm-btn">
            Да, подтвердить
          </button>
          <button onClick={onClose} className="cancel-btn">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReservationModal;