import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import '../../../Styles/payment/PaymentDetailsModal.css';
const API_BASE_URL = "http://localhost:5000/api";

const PaymentDetailsModal = ({ isOpen, onClose, paymentData }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [course, setCourse] = useState('Unknown');
  const [grade, setGrade] = useState('Unknown');
  const [loading, setLoading] = useState(false);

  const extractPaymentAmount = useCallback((payment) => {
    const possibleAmountFields = [
      'payment', 'amount', 'payment_amount', 'paymentAmount', 'total_amount', 'totalAmount',
      'fee_amount', 'feeAmount', 'monthly_fee', 'monthlyFee', 'tuition_fee', 'tuitionFee',
      'course_fee', 'courseFee', 'paid_amount', 'paidAmount'
    ];

    for (const field of possibleAmountFields) {
      if (payment && payment[field] !== undefined && payment[field] !== null) {
        const value = payment[field];
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (!isNaN(numValue) && numValue > 0) {
          return numValue;
        }
      }
    }
    return 0;
  }, []);

  const safeExtract = useCallback((obj, paths) => {
    if (!obj) return null;
    
    for (const path of paths) {
      const keys = path.split('.');
      let current = obj;
      let isValid = true;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          isValid = false;
          break;
        }
      }
      
      if (isValid && current !== null && current !== undefined) {
        return current;
      }
    }
    return null;
  }, []);

  const normalizePaymentData = useCallback((payment) => {
    console.log('Normalizing payment data:', payment);
    
    const normalizedPayment = {
      payment_date: safeExtract(payment, [
        'date', 'payment_date', 'payDate', 'created_at', 'transaction_date', 'pay_date'
      ]) || new Date().toISOString().split('T')[0],
      
      branch_name: safeExtract(payment, [
        'branch', 'branch_name', 'branchName', 'location', 'branch_location', 'center_name'
      ]) || 'N/A',
      
      amount: extractPaymentAmount(payment),
      
      status: safeExtract(payment, [
        'status', 'paymentStatus', 'payment_status', 'transaction_status', 'pay_status'
      ]) || 'Unknown'
    };

    console.log('Normalized payment:', normalizedPayment);
    return normalizedPayment;
  }, [extractPaymentAmount, safeExtract]);

useEffect(() => {
  if (isOpen && paymentData) {
    console.log('PaymentData received:', paymentData);

    setCourse(paymentData?.course || paymentData?.courseName || 'Unknown');
    setGrade(paymentData?.grade ? `grade ${paymentData.grade}` : paymentData?.gradeLevel || 'Unknown');

    if (paymentData?.student_details_id || paymentData?.student_no) {
      const studentId = paymentData?.student_details_id || paymentData?.student_no;
      console.log('Fetching history for student ID:', studentId);
      setLoading(true);

      const fetchPaymentHistory = async () => {
        try {
          const response = await axios.get(API_BASE_URL + `/payment-history/${studentId}`);
          console.log('API Response:', response.data);

          let fetchedCourse = 'Unknown';
          let fetchedGrade = 'Unknown';

          if (response.data && typeof response.data === 'object') {
            if (response.data.course) fetchedCourse = response.data.course;
            if (response.data.grade) fetchedGrade = `grade ${response.data.grade}`;
            if (response.data.courseName) fetchedCourse = response.data.courseName;
            if (response.data.gradeLevel) fetchedGrade = response.data.gradeLevel;

            if (response.data.student_details) {
              if (response.data.student_details.course) fetchedCourse = response.data.student_details.course;
              if (response.data.student_details.grade) fetchedGrade = `grade ${response.data.student_details.grade}`;
            }
          }

          setCourse(fetchedCourse || response.data.courseName || paymentData?.course || paymentData?.courseName || 'Unknown');
          setGrade(fetchedGrade || response.data.gradeLevel || (paymentData?.grade ? `grade ${paymentData.grade}` : paymentData?.gradeLevel || 'Unknown'));

          const { paidHistory = [], pendingHistory = [] } = response.data;
          const allHistory = [...paidHistory, ...pendingHistory];
          const normalizedHistory = allHistory.map(payment => normalizePaymentData(payment));

          // Filter history based on selectedStatus
          const filteredHistory = normalizedHistory.filter(payment => 
            paymentData.selectedStatus === 'All' || payment.status === paymentData.selectedStatus
          );

          const uniqueHistory = filteredHistory.filter((payment, index, self) => 
            index === self.findIndex(p => 
              p.payment_date === payment.payment_date && 
              p.amount === payment.amount &&
              p.status === payment.status &&
              p.branch_name === payment.branch_name
            )
          ).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

          if (uniqueHistory.length === 0) {
            const fallbackPayment = normalizePaymentData(paymentData);
            setPaymentHistory([fallbackPayment]);
          } else {
            setPaymentHistory(uniqueHistory);
          }
        } catch (error) {
          console.error('Error fetching payment history:', error);
          setCourse(paymentData?.course || paymentData?.courseName || 'Unknown');
          setGrade(paymentData?.grade ? `grade ${paymentData.grade}` : paymentData?.gradeLevel || 'Unknown');
          const fallbackPayment = normalizePaymentData(paymentData);
          setPaymentHistory([fallbackPayment]);
        } finally {
          setLoading(false);
        }
      };

      fetchPaymentHistory();
    } else {
      const initialPayment = normalizePaymentData(paymentData);
      setPaymentHistory([initialPayment]);
      setLoading(false);
    }
  }
}, [isOpen, paymentData, normalizePaymentData]);

  useEffect(() => {
    let intervalId;
    
    if (isOpen && (paymentData?.student_details_id || paymentData?.student_no)) {
      const studentId = paymentData?.student_details_id || paymentData?.student_no;
      
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(API_BASE_URL +`/payment-history/${studentId}`);
          console.log('Auto-refresh API Response:', response.data);
          
          let fetchedCourse = 'Unknown';
          let fetchedGrade = 'Unknown';
          
          if (response.data && typeof response.data === 'object') {
            if (response.data.course) fetchedCourse = response.data.course;
            if (response.data.grade) fetchedGrade = `grade ${response.data.grade}`;
            if (response.data.courseName) fetchedCourse = response.data.courseName;
            if (response.data.gradeLevel) fetchedGrade = response.data.gradeLevel;
            
            if (response.data.student_details) {
              if (response.data.student_details.course) fetchedCourse = response.data.student_details.course;
              if (response.data.student_details.grade) fetchedGrade = `grade ${response.data.student_details.grade}`;
            }
          }
          
          if (fetchedCourse !== 'Unknown' || response.data.courseName) {
            setCourse(fetchedCourse || response.data.courseName);
          }
          if (fetchedGrade !== 'Unknown' || response.data.gradeLevel) {
            setGrade(fetchedGrade || response.data.gradeLevel);
          }
          
          const { paidHistory = [], pendingHistory = [] } = response.data;
          const allHistory = [...paidHistory, ...pendingHistory];
          const normalizedHistory = allHistory.map(payment => normalizePaymentData(payment));
          
          const uniqueHistory = normalizedHistory.filter((payment, index, self) => 
            index === self.findIndex(p => 
              p.payment_date === payment.payment_date && 
              p.amount === payment.amount &&
              p.status === payment.status &&
              p.branch_name === payment.branch_name
            )
          ).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
          
          if (uniqueHistory.length > 0) {
            setPaymentHistory(uniqueHistory);
          }
        } catch (error) {
          console.error('Error refreshing payment history:', error);
        }
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen, paymentData?.student_details_id, paymentData?.student_no, normalizePaymentData]);

  if (!isOpen || !paymentData) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Payment Details</h2>
          <button className="payment-close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="payment-modal-body">
          <div className="student-info-section">
            <p><strong>Name : </strong>{paymentData?.full_name || paymentData?.fullName || paymentData?.name || 'N/A'}</p>
          </div>

           <div className="course-info-section">
            <div className="course-header">
              <span className="course-header-title">Course</span>
              <span className="grade-header-title">Grade</span>
            </div>
            <div className="course-row">
              <span className="course-name">{course}</span>
              <span className="course-grade">{grade}</span>
            </div>
          </div>

          <div className="payment-history-section">
            <div className="payment-history-header">
              <h3>Payment History</h3>
            </div>
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Payment(Rs)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading payment history...
                    </td>
                  </tr>
                ) : paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <tr key={`${payment.payment_date}-${payment.amount}-${index}`}>
                      <td>{payment.payment_date}</td>
                      <td>{payment.branch_name || 'N/A'}</td>
                      <td>{payment.amount > 0 ? payment.amount.toLocaleString('en-US') : 'N/A'}</td>
                      <td>
                        <span className={`payment-status ${payment.status.toLowerCase()}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      No payment history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;