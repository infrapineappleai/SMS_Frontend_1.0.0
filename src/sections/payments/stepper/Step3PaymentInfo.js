import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../../Styles/payment/stepper/Step3PaymentInfo.css';
import user from '../../../assets/icons/user-solid.svg';
import user_address from '../../../assets/icons/address-card-solid.svg';
import location from '../../../assets/icons/location-dot-solid.svg';

const API_BASE_URL = "https://pineappleai.cloud/api/sms/api";

const Step3PaymentInfo = ({ selectedStudent, selectedStatus, onStatusChange, selectedMonths: propSelectedMonths, onSelectPayment }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feesData, setFeesData] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(propSelectedMonths || []);

  // Memoize selectedStudent to prevent unnecessary re-renders
  const memoizedSelectedStudent = useMemo(() => selectedStudent, [selectedStudent?.student_details_id]);
  
  // Memoize onSelectPayment to prevent reference changes
  const memoizedOnSelectPayment = useMemo(() => onSelectPayment, []);

  useEffect(() => {
    const fetchFees = async () => {
      if (feesData) {
        // Skip API call if feesData is already set
        console.log('Skipping API call, feesData already set:', feesData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      if (!memoizedSelectedStudent || !memoizedSelectedStudent.student_details_id) {
        setError('No student selected or invalid student_details_id.');
        setLoading(false);
        return;
      }

      const monthsToQuery = Array.isArray(propSelectedMonths) ? propSelectedMonths : [];
      console.log('propSelectedMonths in Step3PaymentInfo:', propSelectedMonths);
      console.log('monthsToQuery:', monthsToQuery);

      try {
        const response = await axios.get(
          `${API_BASE_URL}/payment/${memoizedSelectedStudent.student_details_id}${
            monthsToQuery.length > 0 ? `?months=${monthsToQuery.join(',')}` : ''
          }`,
          { params: { _t: Date.now() } }
        );
        const data = response.data;
        console.log('API response in Step3PaymentInfo:', data);
        setFeesData(data);
        setSelectedMonths(monthsToQuery);

        const filteredCourseFees = {};
        let totalCourseFees = 0;

        if (data.course_fees && typeof data.course_fees === 'object') {
          monthsToQuery.forEach(month => {
            if (data.course_fees[month] && typeof data.course_fees[month] === 'object') {
              filteredCourseFees[month] = data.course_fees[month];
              Object.values(data.course_fees[month]).forEach(grade => {
                if (grade && typeof grade === 'object') {
                  Object.values(grade).forEach(fee => {
                    if (typeof fee === 'number') {
                      totalCourseFees += fee;
                    }
                  });
                }
              });
            }
          });
        }

        const admissionFee = data.payments?.length === 0 ? data.admission_fee || 0 : 0;
        const totalFees = totalCourseFees + admissionFee;

        if (memoizedOnSelectPayment) {
          memoizedOnSelectPayment({
            ...data,
            course_fees: filteredCourseFees,
            total_course_fees: totalCourseFees,
            admission_fee: admissionFee,
            total_fees: totalFees,
            selectedMonths: monthsToQuery,
          });
        }
      } catch (err) {
        setError(`Failed to fetch fees: ${err.response?.data?.message || err.message}`);
        console.error('Error fetching fees:', err);
        setFeesData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, [memoizedSelectedStudent, memoizedOnSelectPayment, propSelectedMonths]);

  if (loading) return <div className="step-container"><p>Loading...</p></div>;
  if (error) return <div className="step-container"><p className="error">{error}</p></div>;
  if (!memoizedSelectedStudent) return <div className="step-container"><p className="error">No student selected.</p></div>;

  const { course_fees, total_course_fees, admission_fee, total_fees } = feesData || {};

  const feeRows = selectedMonths.length > 0
    ? selectedMonths.flatMap(month =>
        course_fees?.[month] && typeof course_fees[month] === 'object'
          ? Object.entries(course_fees[month]).flatMap(([grade, courses]) =>
              typeof courses === 'object'
                ? Object.entries(courses).map(([courseName, fee]) => ({
                    month,
                    courseName: courseName.charAt(0).toUpperCase() + courseName.slice(1),
                    grade: grade.replace('Grade ', ''),
                    fee: fee || 0,
                  }))
                : []
            )
          : []
      )
    : [];

  return (
    <div className="step-container">
      <h4>Payment Summary</h4>
      <div className="payment-student-details">
        <div className="align-items-center">
          <img src={user} alt="Icon" className="icon-style" />
          <div className="text">
            <span><strong>Full Name</strong></span>
            <span>{memoizedSelectedStudent.full_name || 'N/A'}</span>
          </div>
        </div>
        <div className="align-items-center">
          <img src={user_address} alt="Icon" className="icon-style" />
          <div className="text">
            <span><strong>Student Id</strong></span>
            <span>{memoizedSelectedStudent.student_no || 'N/A'}</span>
          </div>
        </div>
        <div className="align-items-center">
          <img src={location} alt="Icon" className="icon-style" />
          <div className="text">
            <span><strong>Branch</strong></span>
            <span>{memoizedSelectedStudent.branch_name || 'N/A'}</span>
          </div>
        </div>
      </div>

      <table className="fees-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Course</th>
            <th>Grade</th>
            <th>Fees (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {feeRows.length > 0 ? (
            feeRows.map((row, index) => (
              <tr key={index}>
                <td>{row.month}</td>
                <td>{row.courseName}</td>
                <td>{row.grade}</td>
                <td>{row.fee}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No fee details available for selected months.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="payment-summary">
        <div className="summary-row"><span>Payment Total</span><span>{total_course_fees || 0}</span></div>
        <div className="summary-row"><span>Admission Fee</span><span>{admission_fee || 0}</span></div>
        <div className="summary-row total"><span>Total</span><span>{total_fees || 0}</span></div>
      </div>
    </div>
  );
};

export default Step3PaymentInfo;