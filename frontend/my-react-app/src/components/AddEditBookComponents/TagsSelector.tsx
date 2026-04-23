import React, { useState, useRef, useEffect } from "react";
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
  loadingTags,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTag = (tagId: number) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tags.length) {
      onChange([]);
    } else {
      onChange(tags.map(tag => Number(tag.id)));
    }
  };

  if (loadingTags) {
    return <p data-testid="tags-loading">Загрузка тегов...</p>;
  }

  if (tags.length === 0) {
    return (
      <div className="no-tags" data-testid="no-tags">
        <p>Нет доступных тегов</p>
      </div>
    );
  }

  return (
    <div className="form-section" data-testid="tags-section">
      <h3 className="section1-title">Теги</h3>
      <div className="tag-container" ref={dropdownRef}>
        <div className="tag-select-wrapper">
          {/* Кастомный dropdown вместо нативного multiple select */}
          <div 
            className="custom-select" 
            data-testid="tag-select"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              border: "2px solid #e0e0e0",
              borderRadius: "10px",
              padding: "12px",
              cursor: "pointer",
              backgroundColor: "#fff",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                {selectedIds.length === 0 
                  ? "Выберите теги..." 
                  : `Выбрано тегов: ${selectedIds.length}`}
              </span>
              <span style={{ fontSize: "12px", color: "#666" }}>
                {isDropdownOpen ? "▲" : "▼"}
              </span>
            </div>
            
            {isDropdownOpen && (
              <div 
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                <div style={{ padding: "8px", borderBottom: "1px solid #f0f0f0" }}>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === tags.length && tags.length > 0}
                      onChange={handleSelectAll}
                      style={{ marginRight: "8px" }}
                      data-testid="select-all-tags"
                    />
                    Выбрать все
                  </label>
                </div>
                {tags.map((tag) => (
                  <label
                    key={String(tag.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      cursor: "pointer",
                      backgroundColor: selectedIds.includes(Number(tag.id)) ? "#f0f8ff" : "transparent"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                      selectedIds.includes(Number(tag.id)) ? "#f0f8ff" : "transparent"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(Number(tag.id))}
                      onChange={() => handleToggleTag(Number(tag.id))}
                      style={{ marginRight: "8px" }}
                      data-testid={`tag-option-${tag.id}`}
                    />
                    <div>
                      <div><strong>{tag.tag_name}</strong></div>
                      {tag.description && (
                        <div style={{ fontSize: "12px", color: "#666" }}>{tag.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="selected-tags" data-testid="selected-tags">
            <p>
              <strong>Выбрано тегов:</strong> <span data-testid="selected-tags-count">{selectedIds.length}</span>
            </p>
            <ul data-testid="selected-tags-list">
              {selectedIds.map((tagId) => {
                const tag = tags.find((t) => Number(t.id) === tagId);
                return tag ? (
                  <li key={tagId} data-testid={`selected-tag-${tagId}`}>
                    {tag.tag_name}
                  </li>
                ) : null;
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