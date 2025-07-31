import React from 'react';
import '../Styles/Pagination.css';
import forward from '../assets/icons/forward.png';
import backward from '../assets/icons/backward.png';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // 🛠️ Fix: Define handlePrev and handleNext inside the component
  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // ✨ Show only 4 pages max in range
  const getPageRange = () => {
    const range = [];
    const maxVisible = 4;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if fewer than 4 pages at the end
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="pagination-container">
      <button
        onClick={handlePrev}
        className="pagination-btn"
        disabled={currentPage === 1}
      >
        <img src={backward} alt="Previous" />
      </button>

      {getPageRange().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
        >
          {pageNum}
        </button>
      ))}

      <button
        onClick={handleNext}
        className="pagination-btn"
        disabled={currentPage === totalPages}
      >
        <img src={forward} alt="Next" className='forward-backward-btn' />
      </button>
    </div>
  );
};

export default Pagination;
