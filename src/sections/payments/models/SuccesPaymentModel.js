import React, { useState } from 'react';
import Receipt from '../Recipt';
import '../../../Styles/payment/Models/SuccesPaymentModel.css';

const PaymentSuccessModal = ({ isOpen, onClose, onGenerateReceipt, receiptData }) => {
  const [showReceipt, setShowReceipt] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleGenerateReceiptClick = () => {
    console.log('Generate Receipt clicked, onGenerateReceipt:', onGenerateReceipt, 'receiptData:', receiptData);
    if (onGenerateReceipt && typeof onGenerateReceipt === 'function' && receiptData?.student_no) {
      onGenerateReceipt(receiptData.student_no);
      setShowReceipt(true);
    } else {
      console.error('onGenerateReceipt is not a function or studentId is undefined');
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
  };

  const handleClose = () => {
    setShowReceipt(false);
    onClose();
  };

  return (
    <>
      <div className="payment-success-modal-overlay">
        <div className="payment-success-modal-content">
          <div className="payment-success-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="30" fill="#4CAF50"/>
              <path d="M20 30L26 36L40 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="payment-success-title">Payment Successful!</h2>
          
          <button 
            className="generate-receipt-btn"
            onClick={handleGenerateReceiptClick}
            disabled={!receiptData?.student_no}
          >
            Generate Receipt
          </button>
          
          <button 
            className="close-success-modal-btn"
            onClick={handleClose}
          >
            ×
          </button>
        </div>
      </div>

      <Receipt 
        isOpen={showReceipt}
        onClose={handleCloseReceipt}
        receiptData={receiptData}
      />
    </>
  );
};

export default PaymentSuccessModal;