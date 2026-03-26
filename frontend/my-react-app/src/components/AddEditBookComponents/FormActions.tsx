import React from "react";
import Button from "../UI/Button/Button";

type FormActionsProps = {
  isEditMode: boolean;
  loading: boolean;
  onCancel: () => void;
};

const FormActions: React.FC<FormActionsProps> = ({ isEditMode, loading, onCancel }) => {
  return (
    <div className="form-actions">
      <Button type="button" onClick={onCancel} variant="secondary" className="cancel-button" disabled={loading}>
        Отмена
      </Button>

      <Button type="submit" className="submit-button" disabled={loading}>
        {loading ? "Сохранение..." : isEditMode ? "Сохранить изменения" : "Добавить книгу"}
      </Button>
    </div>
  );
};

export default FormActions;