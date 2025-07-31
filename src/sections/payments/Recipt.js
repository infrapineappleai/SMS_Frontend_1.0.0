import React, { useEffect } from 'react';
import '../../Styles/payment/Recipt.css';
import logo from '../../assets/images/Aradana-logo.png';
import jsPDF from 'jspdf';

const Receipt = ({ isOpen, onClose, receiptData }) => {
  useEffect(() => {
    console.log('Receipt component mounted/updated with data:', JSON.stringify(receiptData, null, 2));
  }, [receiptData]);

  if (!isOpen || !receiptData) {
    console.log('Receipt not open or receiptData is missing:', { isOpen, receiptData });
    return null;
  }

  const {
    full_name = 'N/A',
    branch_name = 'N/A',
    course_fees = {},
    total_course_fees = 0,
    admission_fee = 0,
    student_no = 'N/A',
    paidFor = 'N/A',
    selectedMonths = [],
  } = receiptData;

  const total_fees = admission_fee + total_course_fees;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();
  const formattedDate = `${currentDay.toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentYear}`;

  const paymentMonths = selectedMonths.length > 0 
    ? selectedMonths.join(', ') 
    : paidFor !== 'N/A' 
      ? paidFor 
      : Object.keys(course_fees).join(', ') || 'N/A';

  // Modified: Group unique subject-grade pairs
  const groupedSubjects = {};
  Object.entries(course_fees).forEach(([month, grades]) => {
    Object.entries(grades || {}).forEach(([grade, courses]) => {
      Object.entries(courses || {}).forEach(([courseName, fee]) => {
        const key = `${courseName}-${grade}`;
        if (!groupedSubjects[key]) {
          groupedSubjects[key] = {
            name: courseName || 'N/A',
            grade: (grade || '').replace('Grade ', '') || 'N/A',
            fee: fee || 0,
          };
        }
      });
    });
  });
  const subjects = Object.values(groupedSubjects);

  const handlePrintAsPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 120 + subjects.length * 6],
    });

    doc.setFillColor(230, 237, 234);
    doc.rect(0, 0, 80, 25, 'F');

    doc.addImage(logo, 'PNG', 5, 5, 12, 12);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(44, 95, 95);
    doc.text('ARADANA', 20, 12);
    doc.setFontSize(10);
    doc.setTextColor(218, 165, 32);
    doc.text('Music Academy', 20, 17);

    doc.setFontSize(11);
    doc.setTextColor(44, 95, 95);
    doc.text('Receipt', 5, 30);
    doc.setFontSize(8);
    doc.text(`Date: ${formattedDate}`, 50, 30);

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);
    doc.text('Payment Details', 5, 37);
    const boxStartY = 39;
    const boxHeight = 65 + subjects.length * 6;
    doc.setDrawColor(200, 200, 200);
    doc.rect(5, boxStartY, 70, boxHeight, 'S');

    let y = boxStartY + 8;
    const labelX = 8;
    const colonX = 32;
    const valueX = 35;

    const addRow = (label, value) => {
      doc.setTextColor(85, 85, 85);
      doc.text(`${label}`, labelX, y);
      doc.text(':', colonX, y);
      doc.setTextColor(51, 51, 51);
      doc.text(`${value}`, valueX, y);
      y += 6;
    };

    addRow('Full Name', full_name);
    addRow('Student ID', student_no);

    if (subjects.length > 0) {
      subjects.forEach((sub) => {
        addRow('Subject', `${sub.name} Grade: ${sub.grade}`);
      });
    } else {
      addRow('Subject', 'N/A');
    }

    addRow('Paid for', `${paymentMonths} ${currentYear}`);
    addRow('Admission Fee', `Rs.${admission_fee}/=`);
    addRow('Total Course Fees', `Rs.${total_course_fees}/=`);

    doc.line(labelX, y - 2, 70, y - 2);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total Amount', labelX, y + 4);
    doc.text(':', colonX, y + 4);
    doc.text(`Rs.${total_fees}/=`, valueX, y + 4);
    y += 10;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 51, 51);
    doc.text(branch_name, labelX, y);
    y += 8;

    doc.setFontSize(7);
    doc.setTextColor(217, 83, 79);
    doc.text('Note: Kindly pay your fee before 10th of every month', 40, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(44, 95, 95);
    doc.text('Thank You For Your Payment!', 40, y, { align: 'center' });

    doc.save(`${full_name}.pdf`);
  };

  const handleSkip = () => {
    onClose();
  };

  const logoSrc = `${logo}?t=${Date.now()}`;

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-top-header">
          <div className="header-logo-container">
            <img
              src={logoSrc}
              alt="ARADANA Logo"
              className="logo"
              onError={(e) => console.error('Logo image load error:', e, 'Src:', e.target.src)}
            />
          </div>
          <div className="header-title-container">
            <h1 className="academy-name">ARADANA</h1>
            <p className="academy-subtitle">Music Academy</p>
          </div>
        </div>

        <div className="receipt-content-body">
          <div className="receipt-info">
            <h2 className="receipt-title">Receipt</h2>
            <p className="receipt-date">Date: {formattedDate}</p>
          </div>

          <div className="payment-details">
            <h3 className="payment-details-title">Payment Details</h3>
            <div className="detail-row"><span className="detail-label">Full Name</span><span className="detail-colon">:</span><span className="detail-value">{full_name}</span></div>
            <div className="detail-row"><span className="detail-label">Student ID</span><span className="detail-colon">:</span><span className="detail-value">{student_no}</span></div>
            {subjects.length > 0 ? subjects.map((subject, index) => (
              <div className="detail-row" key={index}><span className="detail-label">Subject</span><span className="detail-colon">:</span><span className="detail-value">{subject.name} Grade: {subject.grade}</span></div>
            )) : <div className="detail-row"><span className="detail-label">Subject</span><span className="detail-colon">:</span><span className="detail-value">N/A</span></div>}
            <div className="detail-row"><span className="detail-label">Paid for</span><span className="detail-colon">:</span><span className="detail-value">{paymentMonths} {currentYear}</span></div>
            <div className="detail-row"><span className="detail-label">Admission Fee</span><span className="detail-colon">:</span><span className="detail-value">Rs.{admission_fee}/=</span></div>

            <div className="detail-row"><span className="detail-label">Total Course Fees</span><span className="detail-colon">:</span><span className="detail-value">Rs.{total_course_fees}/=</span></div>
            <div className="total-amount-row"><span className="detail-label">Total Amount</span><span className="detail-colon">:</span><span className="detail-value">Rs.{total_fees}/=</span></div>
            <div className="location-row"><span>{branch_name}</span></div>
          </div>

          <div className="receipt-footer">
            <p className="receipt-note">Note: Kindly pay your fee before 10th of every month</p>
            <p className="thank-you">Thank You For Your Payment!</p>
            <button className="btn-skip" onClick={handleSkip}>Skip</button>
            <button className="btn-pdf" onClick={handlePrintAsPDF}>Print as PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;