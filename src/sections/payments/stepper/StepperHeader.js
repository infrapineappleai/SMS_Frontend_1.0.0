import React from 'react';
import '../../../Styles/payment/stepper/StepperHeader.css'; // You would need to create this CSS file for styling

const StepperHeader = ({ currentStep }) => {
  const steps = ['Students Details', 'Courses & Fees', 'Payment'];

  return (
    <div className="stepper-header">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;

        return (
          <div key={label} className={`step-item ${isActive || isCompleted ? 'active' : ''}`}>
            <div className="step-number-container">
              <div className="step-number">{stepNumber}</div>
            </div>
            <div className="step-label">{label}</div>
            {isActive && <div className="active-step-underline"></div>}
          </div>
        );
      })}
    </div>
  );
};

export default StepperHeader;