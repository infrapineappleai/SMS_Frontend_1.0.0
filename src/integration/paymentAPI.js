import React, { useState, useEffect } from 'react';
import Step1StudentsDetails from '../sections/payments/stepper/Step1StudentsDetails';
import Step2Courses from '../sections/payments/stepper/Step2Courses';
import Step3PaymentInfo from '../sections/payments/stepper/Step3PaymentInfo';
import PaymentSuccessModal from './PaymentSuccessModal';
import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

const PaymentAPI = ({ isOpen, onClose, onPaymentSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feesData, setFeesData] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]); // Always initialize as array
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedStudent(null);
      setFeesData(null);
      setSelectedMonths([]); // Reset to empty array
      setError(null);
      setShowSuccessModal(false);
      setReceiptData(null);
    }
  }, [isOpen]);

  const handleStudentSelect = (student) => {
    console.log('Selected student:', student);
    setSelectedStudent(student);
    setCurrentStep(2);
  };

  const handleMonthSelect = (months) => {
    console.log('handleMonthSelect called with months:', months);
    const newMonths = Array.isArray(months) ? months : [];
    setSelectedMonths(newMonths);
    console.log('Updated selectedMonths:', newMonths);
  };

  const handleNext = async () => {
    console.log('handleNext called with selectedMonths:', selectedMonths);
    if (currentStep === 2 && selectedStudent && selectedStudent.student_details_id && selectedMonths.length > 0) {
      setIsLoading(true);
      setError(null);
      try {
        const monthsQuery = selectedMonths.join(',');
        console.log('API request with monthsQuery:', monthsQuery);
        const response = await axios.get(
          `${API_BASE_URL}/payment/${selectedStudent.student_details_id}?months=${monthsQuery}`
        );
        console.log('API response:', response.data);
        setFeesData(response.data);
        setCurrentStep(3);
      } catch (err) {
        setError('Failed to fetch fee details: ' + (err.response?.data?.error || err.message));
        console.error('Error in handleNext:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please select a student and at least one month before proceeding.');
      console.log('handleNext blocked: selectedStudent:', selectedStudent, 'selectedMonths:', selectedMonths);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedStudent && feesData && selectedMonths.length > 0) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/payment/${selectedStudent.student_details_id}`,
          { selectedMonths },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const enrichedData = {
          fullName: selectedStudent.full_name || 'N/A',
          studentId: selectedStudent.student_details_id,
          student_no: selectedStudent.student_no,
          subjects: selectedMonths.flatMap(month =>
            Object.entries(feesData.course_fees?.[month] || {}).flatMap(([grade, courses]) =>
              Object.entries(courses).map(([courseName]) => ({
                name: courseName,
                grade: grade.replace('Grade ', ''),
              }))
            )
          ),
          paidFor: selectedMonths.join(', '),
          admissionFee: feesData.admission_fee || 0,
          monthlyFee: feesData.total_course_fees || 0,
          totalAmount: feesData.total_fees || 0,
          location: selectedStudent.branch_name || 'N/A',
          date: response.data.payment_date || new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }),
          transactionId: response.data.paymentId || Math.random().toString(36).substr(2, 9).toUpperCase(),
          status: response.data.status || 'Paid',
        };

        setReceiptData(enrichedData);
        setShowSuccessModal(true);
        onPaymentSuccess(enrichedData);
      } catch (err) {
        setError('Failed to submit payment: ' + (err.response?.data?.error || err.message));
        console.error('Error in handleSubmit:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Missing required data for payment.');
      console.log('handleSubmit blocked: selectedStudent:', selectedStudent, 'selectedMonths:', selectedMonths, 'feesData:', feesData);
    }
  };

  return (
    <div className="payment-api-container">
      <h2>Student Payment System</h2>
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading...</div>}
      {currentStep === 1 && <Step1StudentsDetails onStudentSelect={handleStudentSelect} />}
      {currentStep === 2 && selectedStudent && (
        <div>
          <Step2Courses
            student_details_id={selectedStudent.student_details_id}
            student_no={selectedStudent.student_no}
            onMonthSelect={handleMonthSelect}
            selectedMonths={selectedMonths} // Pass selectedMonths as array
          />
          <button onClick={handleBack} className="back-btn">Back</button>
          <button onClick={handleNext} className="next-btn" disabled={!selectedStudent || selectedMonths.length === 0 || isLoading}>
            Next
          </button>
        </div>
      )}
      {currentStep === 3 && selectedStudent && feesData && selectedMonths.length > 0 && (
        <div>
          <Step3PaymentInfo
            selectedStudent={selectedStudent}
            onSelectPayment={(paymentData) => setFeesData(paymentData)}
            selectedMonths={selectedMonths} // Ensure this is always an array
          />
          <button onClick={handleBack} className="back-btn">Back</button>
          <button onClick={handleSubmit} className="submit-btn" disabled={isLoading}>
            Submit Payment
          </button>
        </div>
      )}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        receiptData={receiptData}
      />
    </div>
  );
};

export default PaymentAPI;