import React from 'react';
import '../Styles/DeleteModal.css';
import Delete from '../assets/icons/Delete.png'

const DeleteConfirmModal = ({ isOpen, onClose, onDelete }) => {
  if (!isOpen) return null;
  

  return (
    <div className="DeleteModal-overlay">
      <div className="DeleteModal-content">

        <img src={Delete} alt='delete' className="DeleteModal-icon"/>
         
        <p className="DeleteModal-message">Deleting this list permanent and cannot be undone.</p>
        <div className="DeleteModal-buttons">
          <button onClick={onClose} className="DeleteModal-cancel">Cancel</button>
          <button onClick={onDelete} className="DeleteModal-delete">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

