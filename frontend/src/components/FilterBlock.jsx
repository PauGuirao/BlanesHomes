import React from 'react';
import './FilterBlock.css';

const FilterBlock = ({ filters, onChange, onApply, onReset }) => {
  const criteria = [
    {
      key: 'habitaciones',
      label: 'Habitaciones',
      options: [1, 2, 3, 4, 5],
      suffix: ''
    },
    {
      key: 'banos',
      label: 'Baños',
      options: [1, 2, 3, 4],
      suffix: ''
    },
    {
      key: 'metros',
      label: 'Metros',
      options: [50, 75, 100, 150, 200],
      suffix: ' m²'
    }
  ];

  return (
    <div className="filter-block">
      <div className="price-section">
        <div className="price-slider">
          <div className="price-labels">
            <span>{filters.priceRange[0].toLocaleString()}€</span>
            <span>{filters.priceRange[1].toLocaleString()}€</span>
          </div>
          <div className="price-range-slider-container">
                <input
                    type="range"
                    min={filters.minPrice}
                    max={filters.maxPrice}
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                    onChange('priceRange', [Number(e.target.value), filters.priceRange[1]])
                    }
                    className="slider min-slider"
                />
                <input
                    type="range"
                    min={filters.minPrice}
                    max={filters.maxPrice}
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                    onChange('priceRange', [filters.priceRange[0], Number(e.target.value)])
                    }
                    className="slider max-slider"
                />
            </div>
        </div>
      </div>

      <div className="filters-row">
        {criteria.map(({ key, label, options, suffix }) => (
          <div className="filter-item" key={key}>
            <label>{label}</label>
            <select value={filters[key]} onChange={(e) => onChange(key, e.target.value)}>
              <option value="">Cualquiera</option>
              {options.map((n) => (
                <option key={n} value={n}>
                  {n}+{suffix}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="filter-actions">
        <button className="reset-filters-button" onClick={onReset}>
          Resetear
        </button>
        <button className="apply-filters-button" onClick={onApply}>
          Aplicar filtros
        </button>
      </div>
    </div>
  );
};

export default FilterBlock;
