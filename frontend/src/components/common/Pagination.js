import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    var pages = [];
    var maxVisible = 5;
    var start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    var end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    for (var i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  var pageNumbers = getPageNumbers();

  return (
    <div className="pagination">
      <span className="pagination__info">
        P\u00e1gina {currentPage} de {totalPages}
      </span>

      <div className="pagination__controls">
        <button
          className="pagination__btn pagination__btn--nav"
          onClick={function() { onPageChange(currentPage - 1); }}
          disabled={currentPage <= 1}
          aria-label="P\u00e1gina anterior"
        >
          <FiChevronLeft size={18} />
          <span className="pagination__btn-text">Anterior</span>
        </button>

        <div className="pagination__pages">
          {pageNumbers.map(function(page, index) {
            if (page === '...') {
              return (
                <span key={'ellipsis-' + index} className="pagination__ellipsis">
                  ...
                </span>
              );
            }

            var isActive = page === currentPage;
            var btnClass = ['pagination__btn', 'pagination__btn--page', isActive ? 'pagination__btn--active' : ''].filter(Boolean).join(' ');

            return (
              <button
                key={page}
                className={btnClass}
                onClick={function() { onPageChange(page); }}
                disabled={isActive}
                aria-label={'Ir a p\u00e1gina ' + page}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          className="pagination__btn pagination__btn--nav"
          onClick={function() { onPageChange(currentPage + 1); }}
          disabled={currentPage >= totalPages}
          aria-label="P\u00e1gina siguiente"
        >
          <span className="pagination__btn-text">Siguiente</span>
          <FiChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
