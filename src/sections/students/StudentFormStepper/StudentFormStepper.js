
import '../../../Styles/Students-css/StudentFormStepper/StudentFormStepper.css';
import Rectangle from '../../../assets/icons/Rectangle.png';

const StudentFormStepper = ({ steps = [], currentStep = 1 }) => {
  return (
    <div className="stepper-container">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const labelClass = step.toLowerCase().replace(/\s+/g, '-');
        const positionClass = index === 0 ? 'first' : index === steps.length - 1 ? 'last' : '';

        return (
          <div key={index} className={`step-wrapper ${positionClass}`}>
            <div className={`circle ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
              {stepNumber}
            </div>
            <div className="step-label-container">
              <div className={`step-label ${labelClass}`}>{step}</div>
              {isActive && <img src={Rectangle} alt="active" className="step-rectangle" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentFormStepper;