import React from "react";
import { useNavigate } from "react-router-dom";
import { type Tag } from "../../lib/api";

type TagsSelectorProps = {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  loading: boolean;
  loadingTags: boolean;
};

const TagsSelector: React.FC<TagsSelectorProps> = ({
  tags,
  selectedIds,
  onChange,
  loading,
  loadingTags,
}) => {
  const navigate = useNavigate();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => Number.parseInt(opt.value, 10));
    onChange(selected.filter((n) => Number.isFinite(n)));
  };

  const handleGoCreateTag = () => {
    navigate("/tags/create");
  };

  if (loadingTags) {
    return <p>Загрузка тегов...</p>;
  }

  if (tags.length === 0) {
    return (
      <div className="no-tags">
        <p>Нет доступных тегов</p>
        <div className="create-tag-hint">
          <div className="create-tag-hint-text">Не нашли подходящего тега? создайте его сами</div>
          <button type="button" className="create-tag-btn" onClick={handleGoCreateTag} disabled={loading}>
            Создать тег
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <h3 className="section1-title">Теги</h3>
      <div className="tag-container">
        <div className="tag-select-wrapper">
          <select
            multiple
            value={selectedIds.map(String)}
            onChange={handleSelectChange}
            className="tag-select"
            disabled={loading}
            size={4}
          >
            {tags.map((tag) => (
              <option key={String(tag.id)} value={String(tag.id)}>
                {tag.tag_name} {tag.description ? `- ${tag.description}` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="selected-tags">
            <p>
              <strong>Выбрано тегов:</strong> {selectedIds.length}
            </p>
            <ul>
              {selectedIds.map((tagId) => {
                const tag = tags.find((t) => Number(t.id) === tagId);
                return tag ? <li key={tagId}>{tag.tag_name}</li> : null;
              })}
            </ul>
          </div>
        )}

        <div className="tag-info">
          <p className="tag-text">
            <strong>Совет:</strong> Теги помогут читателям легче находить книги по жанрам и темам
          </p>
        </div>
      </div>
    </div>
  );
};

export default TagsSelector;