import '../Styles/ToastMsg.css';
import Close from '../assets/icons/Close.png';

const Toast = ({ showToast, isError, onClose, title, message, icon, isDelete }) => {
  if (!showToast) return null;

  return (
    <div className={`toast ${isDelete ? 'toast-delete' : isError ? 'toast-error' : 'toast-success'}`}>
      <div className="toast-icon">
        <img src={icon} alt={isDelete ? 'Delete' : isError ? 'Error' : 'Success'} />
      </div>
      <div className="toast-content">
        <span className="toast-title">{title}</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        <img src={Close} alt="Close" />
      </button>
    </div>
  );
};

export default Toast;