import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination-controls">
        <button
          className="btn-icon"
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrevPage}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>

        {start > 1 && <><button className="page-btn" onClick={() => onPageChange(1)}>1</button><span>…</span></>}

        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {end < totalPages && <><span>…</span><button className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button></>}

        <button
          className="btn-icon"
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNextPage}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
