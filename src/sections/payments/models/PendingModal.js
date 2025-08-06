import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Close from '../../../assets/icons/Vector.png';
import '../../../Styles/payment/Models/PendingModal.css';

const API_BASE_URL = "https://aradanabeta.pineappleai.cloud/api/sms/api";

const PendingModal = ({ isOpen, onClose, paymentData }) => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (isOpen && paymentData?.student_details_id) {
        setLoading(true);
        try {
          const studentId = paymentData.student_details_id;
          const response = await axios.get(API_BASE_URL +`/payment-history/${studentId}`);
          const { data } = response; // Expecting { name, course, grade, paidHistory, pendingHistory }
          console.log('Fetched data:', data); // Debug log

          // Set courses based on the returned data
          setCourses([{ name: data.course, grades: [data.grade ? `grade ${data.grade}` : 'N/A'] }]);

          // Process pending payments
          const pending = data.pendingHistory.map(p => ({
            month: new Date(p.date).toLocaleString('en-us', { month: 'long' }), // Show only month
            amount: p.payment || 0,
            status: p.status
          }));
          console.log('Processed pending payments:', pending); // Debug log

          setPendingPayments(pending);
          setTotalPending(pending.reduce((sum, p) => sum + (p.amount || 0), 0));
        } catch (error) {
          console.error('Error fetching payment history:', error);
          // Fallback to paymentData if API fails
          if (paymentData.amount && paymentData.payment_date) {
            const month = new Date(paymentData.payment_date).toLocaleString('en-us', { month: 'long' }); // Show only month
            setPendingPayments([{ month, amount: paymentData.amount, status: 'Pending' }]);
            setTotalPending(paymentData.amount || 0);
            setCourses(paymentData.course_name ? [{ name: paymentData.course_name, grades: [paymentData.grade_name || 'N/A'] }] : [{ name: 'Unknown', grades: ['N/A'] }]);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchPaymentHistory();
    }
  }, [isOpen, paymentData]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay2')) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay2 active" onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Payment Details</h2>
          <button className="close-btn" onClick={onClose}>
            <img src={Close} alt="close" className="close-icon" />
          </button>
        </div>

        <div className="modal-body">
          <div className="student-name">
            <span className="name-label">Name:</span>
            <span className="name-value">{paymentData?.full_name || 'N/A'}</span>
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
                {courses.map((course, index) => (
                  course.grades.map(grade => (
                    <tr key={`${course.name}-${grade}-${index}`}>
                      <td>{course.name}</td>
                      <td>{grade}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>

          <div className="payment-table-container">
            <div className="payment-table-header">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Payment(Rs)</th>
                    <th>Status</th>
                  </tr>
                </thead>
              </table>
            </div>
            
            <div className="payment-table-scroll">
              <table className="payment-table-body">
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                        Loading pending payments...
                      </td>
                    </tr>
                  ) : pendingPayments.length > 0 ? (
                    pendingPayments.map((payment, index) => (
                      <tr key={`${payment.month}-${index}`}>
                        <td>{payment.month}</td>
                        <td>{payment.amount.toLocaleString('en-US')}</td>
                        <td>
                          <span className="status-badge status-pending">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                        No pending payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="total-summary">
              <span className="total-label">Total Pending</span>
              <span className="total-amount">Rs. {totalPending.toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingModal;