import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Location } from "../../lib/api";

type LocationsSelectorProps = {
  locations: Location[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  loading: boolean;
  loadingLocations: boolean;
  error?: string;
};

const LocationsSelector: React.FC<LocationsSelectorProps> = ({
  locations,
  selectedIds,
  onChange,
  loading,
  loadingLocations,
  error,
}) => {
  const navigate = useNavigate();
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

  const handleToggleLocation = (locationId: number) => {
    if (selectedIds.includes(locationId)) {
      onChange(selectedIds.filter(id => id !== locationId));
    } else {
      onChange([...selectedIds, locationId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === locations.length) {
      onChange([]);
    } else {
      onChange(locations.map(loc => Number(loc.id)));
    }
  };

  const handleGoCreateLocation = () => {
    navigate("/locations/create");
  };

  if (loadingLocations) {
    return <p data-testid="locations-loading">Загрузка локаций...</p>;
  }

  if (locations.length === 0) {
    return (
      <div className="no-locations" data-testid="no-locations">
        <p>Нет доступных локаций</p>
        <div className="create-location-hint">
          <div className="create-location-hint-text">Не нашли нужного адреса? создайте его сами</div>
          <button 
            type="button" 
            className="create-location-btn" 
            onClick={handleGoCreateLocation} 
            disabled={loading}
            data-testid="create-location-btn"
          >
            Создать локацию
          </button>
        </div>
      </div>
    );
  }

  const hasError = error && error.toLowerCase().includes('локац');

  return (
    <div className="form-section" data-testid="locations-section">
      <h3 className="section1-title">Место хранения *</h3>
      <div className="location-container" ref={dropdownRef}>
        <div className="location-select-wrapper">
          <div 
            className={`custom-select ${hasError ? 'select-error' : ''}`}
            data-testid="location-select"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              border: `2px solid ${hasError ? '#dc3545' : '#e0e0e0'}`,
              borderRadius: "10px",
              padding: "12px",
              cursor: "pointer",
              backgroundColor: "#fff",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: hasError ? '#dc3545' : 'inherit' }}>
                {selectedIds.length === 0 
                  ? "Выберите локации..." 
                  : `Выбрано локаций: ${selectedIds.length}`}
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
                      checked={selectedIds.length === locations.length && locations.length > 0}
                      onChange={handleSelectAll}
                      style={{ marginRight: "8px" }}
                      data-testid="select-all-locations"
                    />
                    Выбрать все
                  </label>
                </div>
                {locations.map((loc, index) => (
                  <label
                    key={String(loc.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      cursor: "pointer",
                      backgroundColor: selectedIds.includes(Number(loc.id)) ? "#f0f8ff" : "transparent"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                      selectedIds.includes(Number(loc.id)) ? "#f0f8ff" : "transparent"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(Number(loc.id))}
                      onChange={() => handleToggleLocation(Number(loc.id))}
                      style={{ marginRight: "8px" }}
                      data-testid={`location-option-${loc.id}`}
                    />
                    <div data-testid={index === 0 ? "location-option" : undefined}>
                      <div><strong>{loc.name}</strong></div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{loc.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Отображение ошибки валидации */}
        {hasError && (
          <div className="location-error" style={{ color: "#dc3545", fontSize: "12px", marginTop: "8px" }}>
            {error}
          </div>
        )}

        <div className="create-location-hint">
          <div className="create-location-hint-text">Не нашли нужного адреса? создайте его сами</div>
          <button 
            type="button" 
            className="create-location-btn" 
            onClick={handleGoCreateLocation} 
            disabled={loading}
            data-testid="create-location-btn"
          >
            Создать локацию
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="selected-locations" data-testid="selected-locations">
            <p>
              <strong>Выбрано локаций:</strong> <span data-testid="selected-locations-count">{selectedIds.length}</span>
            </p>
            <ul data-testid="selected-locations-list">
              {selectedIds.map((locId) => {
                const loc = locations.find((l) => Number(l.id) === locId);
                return loc ? (
                  <li key={locId} data-testid={`selected-location-${locId}`}>
                    {loc.name} - {loc.address}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}

        <div className="location-info">
          <p className="location-text">
            <strong>Важно:</strong> Укажите, где будет находиться книга для выдачи
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationsSelector;