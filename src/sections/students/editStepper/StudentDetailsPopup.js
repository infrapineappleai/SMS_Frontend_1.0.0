

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

import '../../../Styles/Students-css/StudentDetailsModal.css';

import UserIcon from '../../../assets/icons/User.png';
import AddressIcon from '../../../assets/icons/Address.png';
import CalendarIcon from '../../../assets/icons/Calendar2.png';
import GenderIcon from '../../../assets/icons/Gender.png';
import EmailIcon from '../../../assets/icons/Email.png';
import WhatsAppIcon from '../../../assets/icons/WhatsApp.png';
import PhoneIcon from '../../../assets/icons/Phone.png';
import BranchIcon from '../../../assets/icons/Branch.png';
import StudentIcon from '../../../assets/icons/Student.png';
import CloseIcon from '../../../assets/icons/Close.png';








const StudentDetailsPopup = ({ isOpen, onClose, studentData, onChange, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (studentData) setFormData(studentData);
  }, [studentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (onChange) onChange(name, value);
  };

  if (!isOpen || !studentData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="details-modal"
      overlayClassName="details-overlay"
      ariaHideApp={false}
    >
      <div className="details-container">
        <button className="details-close-btn" onClick={onClose}>
          <img src={CloseIcon} alt="Close" />
        </button>

        <div className="details-header-bg">
          <div className="details-header"></div>
          <img
            src={formData.profileImage || 'https://i.pravatar.cc/120?img=1'}
            alt="Profile"
            className="details-profile-pic"
          />
          <h2>Edit Student</h2>
        </div>

        <section className="details-section">
          <h3>Personal Information</h3>
          <div className="details-info">
            <label><img src={UserIcon} alt="Name" /> Full Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} />

            <label><img src={AddressIcon} alt="Address" /> Address</label>
            <input type="text" name="address" value={formData.address || ''} onChange={handleChange} />

            <label><img src={CalendarIcon} alt="DOB" /> Date of Birth</label>
            <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} />

            <label><img src={GenderIcon} alt="Gender" /> Gender</label>
            <select name="gender" value={formData.gender || ''} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </section>

        <section className="details-section">
          <h3>Contact Details</h3>
          <div className="details-info">
            <label><img src={EmailIcon} alt="Email" /> Email</label>
            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />

            <label><img src={WhatsAppIcon} alt="WhatsApp" /> WhatsApp</label>
            <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} />

            <label><img src={PhoneIcon} alt="ICE" /> ICE Contact</label>
            <input type="text" name="iceContact" value={formData.iceContact || ''} onChange={handleChange} />
          </div>
        </section>

        <section className="details-section">
          <h3>Academic Details</h3>
          <div className="details-info">
            <label><img src={BranchIcon} alt="Branch" /> Branch</label>
            <input type="text" name="branch" value={formData.branch || ''} onChange={handleChange} />

            <label><img src={StudentIcon} alt="Student ID" /> Student ID</label>
            <input type="text" name="studentId" value={formData.studentId || ''} onChange={handleChange} />

            
          </div>
        </section>

        <div className="details-buttons">
          <button className="details-prev-btn" onClick={onClose}>Previous</button>
          <button className="details-save-btn" onClick={() => onSave(formData)}>Save</button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentDetailsPopup;
