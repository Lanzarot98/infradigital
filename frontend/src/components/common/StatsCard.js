import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color, trend, trendUp }) => {
  var cardColor = color || 'var(--primary)';
  var Icon = icon;
  var hasTrend = trend !== undefined && trend !== null;

  var trendClass = ['stats-card__trend', trendUp ? 'stats-card__trend--up' : 'stats-card__trend--down'].join(' ');

  return (
    <div className="stats-card">
      <div className="stats-card__content">
        <div className="stats-card__info">
          <span className="stats-card__title">{title}</span>
          <span className="stats-card__value">{value}</span>
          {hasTrend && (
            <div className={trendClass}>
              {trendUp ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
              <span>{trend}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="stats-card__icon-wrapper" style={{ backgroundColor: cardColor + '15', color: cardColor }}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
