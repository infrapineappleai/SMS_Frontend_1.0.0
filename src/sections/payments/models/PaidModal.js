import React, { useEffect } from 'react';
import '../../../Styles/payment/Models/PaidModal.css';

const PaidModal = ({ isOpen, onClose, studentData }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

  if (!isOpen || !studentData) return null;

  // Filter payments to include only those with "Paid" status
  const paidPayments = studentData.payments.filter(payment => payment.status === 'Paid');

  const calculateTotal = () => {
    return paidPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  return (
    <div className={`modal-overlay2 ${isOpen ? 'active' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Payment Details</h2>
          <button className="close-btn" onClose={onClose}>
            <svg className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="student-name">
            <span className="name-label">Name :</span>
            <span className="name-value">{studentData.name}</span>
          </div>

          <div className="courses-container">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentData.courses.map((course, index) => (
                  <tr key={index}>
                    <td>{course.name}</td>
                    <td>{course.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="payment-table-container">
            <div className="payment-table-header">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Payment(Rs)</th>
                    <th>Status</th>
                  </tr>
                </thead>
              </table>
            </div>
            
            <div className="payment-table-scroll">
              <table className="payment-table-body">
                <tbody>
                  {paidPayments.length > 0 ? (
                    paidPayments.map((payment, index) => (
                      <tr key={index}>
                        <td>{payment.date}</td>
                        <td>{payment.branch}</td>
                        <td>{payment.amount.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${payment.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                        No paid payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="total-summary">
            <span className="total-label">Total:</span>
            <span className="total-amount">Rs {calculateTotal().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaidModal;