import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../Styles/payment/stepper/Step2Courses.css';

const API_BASE_URL = "https://pineappleai.cloud/api/sms/api";

const Step2Courses = ({ student_no, student_details_id, feesData: propFeesData, onMonthSelect, selectedMonths: propSelectedMonths, onCourseSelect, currentCourse }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feesData, setFeesData] = useState(propFeesData);
  const [payments, setPayments] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(propSelectedMonths || []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndexMap = months.reduce((acc, m, i) => { acc[m] = i; return acc; }, {});
  const currentMonthIndex = new Date().getMonth();

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      setError(null);
      let effectiveStudentId = student_details_id;

      if (!effectiveStudentId && student_no) {
        try {
          const searchResponse = await axios.get(`${API_BASE_URL}/student/search`, {
            params: { student_no, _t: Date.now() }
          });
          const student = searchResponse.data[0];
          if (student?.student_details_id) {
            effectiveStudentId = student.student_details_id;
          } else {
            setError('No valid student_details_id found.');
            setLoading(false);
            return;
          }
        } catch (err) {
          setError(`Error fetching student: ${err.message}`);
          setLoading(false);
          return;
        }
      }

      if (!effectiveStudentId) {
        setError('Missing student_details_id.');
        setLoading(false);
        return;
      }

      if (!propFeesData) {
        try {
          const response = await axios.get(`${API_BASE_URL}/payment/${effectiveStudentId}`);
          setFeesData(response.data);
          setPayments(response.data.payments || []);
        } catch (err) {
          setError(`Error fetching fees: ${err.response?.data?.message || err.message}`);
        }
      } else {
        setPayments(propFeesData.payments || []);
      }

      const initialMonths = Array.isArray(propSelectedMonths) ? propSelectedMonths : [];
      setSelectedMonths(initialMonths);
      if (onMonthSelect) {
        console.log('Initial onMonthSelect call with:', initialMonths);
        onMonthSelect(initialMonths);
      }

      setLoading(false);
    };

    fetchFees();
  }, [student_no, student_details_id, propFeesData, onMonthSelect, propSelectedMonths]);

  if (loading) return <div className="step-container"><p>Loading...</p></div>;
  if (error) return <div className="step-container"><p className="error">{error}</p></div>;
  if (!feesData) return <div className="step-container"><p>No data found.</p></div>;

  const { course_fees, total_course_fees, admission_fee, total_fees } = feesData;
  const paidMonths = payments.map(p => p.split(' ')[0]);

  const getMonthStatus = (month) => {
    const index = monthIndexMap[month];
    if (paidMonths.includes(month)) return 'paid';
    if (index <= currentMonthIndex) return 'due';
    return 'upcoming';
  };

  const isMonthClickable = (month) => !paidMonths.includes(month);

  const handleMonthClick = (month) => {
    if (isMonthClickable(month)) {
      const newSelectedMonths = selectedMonths.includes(month)
        ? selectedMonths.filter(m => m !== month)
        : [...selectedMonths, month];
      setSelectedMonths(newSelectedMonths);
      if (onMonthSelect) {
        console.log('Calling onMonthSelect with:', newSelectedMonths);
        onMonthSelect(newSelectedMonths);
      }
      if (onCourseSelect) {
        onCourseSelect(currentCourse); // Maintain course selection
      }
    }
  };

  const feeRows = selectedMonths.length > 0
    ? selectedMonths.flatMap(month =>
        course_fees?.[month]
          ? Object.entries(course_fees[month]).flatMap(([grade, courses]) =>
              Object.entries(courses).map(([courseName, fee]) => ({
                month,
                courseName: courseName.charAt(0).toUpperCase() + courseName.slice(1),
                grade: grade.replace('Grade ', ''),
                fee,
              }))
            )
          : []
      )
    : [];

  const totalCourseFeesForSelected = feeRows.reduce((sum, row) => sum + row.fee, 0);
  const totalWithAdmission = totalCourseFeesForSelected + (admission_fee || 0);

  return (
    <div className="step-container">
      <div className="courses-fees-header">
        <h4>Courses & Fees</h4>
        <div className='date-container'>
          <div className="period-selector-container">
            <select
              className="year-dropdown"
              defaultValue={new Date().getFullYear()}
              onChange={(e) => onCourseSelect?.(e.target.value)}
            >
              <option>Violin</option>
              <option>Piano</option>
              <option>Guitar</option>
            </select>
            <div className="legend">
              <span className="legend-item paid">Paid</span>
              <span className="legend-item due">Due</span>
              <span className="legend-item upcoming">Upcoming</span>
            </div>
          </div>
          <div className="month-grid">
            {months.map((month) => {
              const status = getMonthStatus(month);
              const isClickable = isMonthClickable(month);
              return (
                <button
                  key={month}
                  className={`month-btn ${selectedMonths.includes(month) ? 'selected' : ''} ${status}`}
                  onClick={() => handleMonthClick(month)}
                  disabled={!isClickable}
                >
                  {month}
                </button>
              );
            })}
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
            feeRows.map((row, i) => (
              <tr key={i}>
                <td>{row.month}</td>
                <td>{row.courseName}</td>
                <td>{row.grade}</td>
                <td>{row.fee}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Select months to view fee details.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="payment-summary">
        <div className="summary-row"><span>Payment Total</span><span>{totalCourseFeesForSelected}</span></div>
        <div className="summary-row"><span>Admission Fee</span><span>{admission_fee || 0}</span></div>
        <div className="summary-row total"><span>Total</span><span>{totalWithAdmission}</span></div>
      </div>
    </div>
  );
};

export default Step2Courses;