import React from "react";
import { useNavigate } from "react-router-dom";
import { type Location } from "../../lib/api";

type LocationsSelectorProps = {
  locations: Location[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  loading: boolean;
  loadingLocations: boolean;
};

const LocationsSelector: React.FC<LocationsSelectorProps> = ({
  locations,
  selectedIds,
  onChange,
  loading,
  loadingLocations,
}) => {
  const navigate = useNavigate();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => Number.parseInt(opt.value, 10));
    onChange(selected.filter((n) => Number.isFinite(n)));
  };

  const handleGoCreateLocation = () => {
    navigate("/locations/create");
  };

  if (loadingLocations) {
    return <p>Загрузка локаций...</p>;
  }

  if (locations.length === 0) {
    return (
      <div className="no-locations">
        <p>Нет доступных локаций</p>
        <div className="create-location-hint">
          <div className="create-location-hint-text">Не нашли нужного адреса? создайте его сами</div>
          <button type="button" className="create-location-btn" onClick={handleGoCreateLocation} disabled={loading}>
            Создать локацию
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <h3 className="section1-title">Место хранения *</h3>
      <div className="location-container">
        <div className="location-select-wrapper">
          <select
            multiple
            value={selectedIds.map(String)}
            onChange={handleSelectChange}
            className="location-select"
            required
            disabled={loading}
            size={4}
          >
            {locations.map((loc) => (
              <option key={String(loc.id)} value={String(loc.id)}>
                {loc.name} - {loc.address}
              </option>
            ))}
          </select>
        </div>

        <div className="create-location-hint">
          <div className="create-location-hint-text">Не нашли нужного адреса? создайте его сами</div>
          <button type="button" className="create-location-btn" onClick={handleGoCreateLocation} disabled={loading}>
            Создать локацию
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="selected-locations">
            <p>
              <strong>Выбрано локаций:</strong> {selectedIds.length}
            </p>
            <ul>
              {selectedIds.map((locId) => {
                const loc = locations.find((l) => Number(l.id) === locId);
                return loc ? <li key={locId}>{loc.name} - {loc.address}</li> : null;
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