import React, { useState } from 'react';
import { FiChevronUp, FiChevronDown, FiInbox } from 'react-icons/fi';
import Loading from './Loading';
import './Table.css';

const Table = ({ columns, data, onRowClick, emptyMessage, loading }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !data) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'es');
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="table-wrapper">
        <div className="table-loading">
          <Loading size="md" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-wrapper">
        <div className="table-empty">
          <FiInbox size={48} className="table-empty__icon" />
          <p className="table-empty__message">
            {emptyMessage || 'No se encontraron registros'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="table-component table-base">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="table-component__th"
                  onClick={() => handleSort(col.key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSort(col.key);
                  }}
                >
                  <div className="table-component__th-content">
                    <span>{col.label}</span>
                    <span className="table-component__sort-icon">
                      {sortConfig.key === col.key ? (
                        sortConfig.direction === 'asc' ? (
                          <FiChevronUp size={14} />
                        ) : (
                          <FiChevronDown size={14} />
                        )
                      ) : (
                        <FiChevronDown size={14} className="table-component__sort-inactive" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={onRowClick ? 'clickable' : ''}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
