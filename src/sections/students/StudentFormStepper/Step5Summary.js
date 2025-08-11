import React, { useState } from 'react';
import Modal from 'react-modal';
import '../../../Styles/Students-css/SummaryPopup.css';
import CloseIcon from '../../../assets/icons/Close.png';
import UserIcon from '../../../assets/icons/User.png';
import AddressIcon from '../../../assets/icons/Address.png';
import CalendarIcon from '../../../assets/icons/Calendar2.png';
import GenderIcon from '../../../assets/icons/Gender.png';
import EmailIcon from '../../../assets/icons/Email.png';
import PhoneIcon from '../../../assets/icons/Phone.png';
import BranchIcon from '../../../assets/icons/Branch.png';
import StudentIcon from '../../../assets/icons/Student.png';
import { useToast } from '../../../modals/ToastProvider';
import errorIcon from '../../../assets/icons/error.png';

if (typeof document !== 'undefined') {
  Modal.setAppElement('#root');
}

const safeString = (val) => {
  const strVal = String(val);
  return typeof strVal === 'string' && strVal.trim() !== '' ? strVal : 'N/A';
};

const Step5Summary = ({ isOpen, onClose, studentData, onSave, onEdit }) => {
  const { showToast } = useToast();
  const [errors, setErrors] = useState({});

  if (!isOpen || !studentData) return null;

  const assignedCourses = Array.isArray(studentData.assignedCourses) ? studentData.assignedCourses : [];
  const schedules = Array.isArray(studentData.schedules) ? studentData.schedules : [];
  const isStudent = studentData.role === 'student';

  const validateCriticalFields = (data) => {
    const errors = {};
    if (isStudent && (!data.student_no || !data.student_no.trim())) {
      errors.student_no = 'Student ID (student_no) is required and cannot be empty.';
    }
    return errors;
  };

  const handleSave = () => {
    const criticalErrors = validateCriticalFields(studentData);
    if (Object.keys(criticalErrors).length > 0) {
      setErrors(criticalErrors);
      showToast({
        title: 'Validation Error',
        message: criticalErrors.student_no || 'Please fill required fields',
        isError: true,
        icon: errorIcon,
      });
      return;
    }
    onSave?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="summary-modal"
      overlayClassName="modal-overlay"
      ariaHideApp={true}
    >
      <div className="summary-container scrollable">
        <button className="close-btn" onClick={onClose} aria-label="Close Summary Popup">
          <img src={CloseIcon} alt="Close" />
        </button>

        <div className="summary-header-bg">
          <div className="summary-header"></div>
          <img
            src={studentData.previewUrl || studentData.photo_url || 'https://example.com/default-avatar.png'}
            alt="Profile"
            className="profile-pic-round"
            onError={(e) => { e.target.src = '/default-avatar.png'; }}
          />
          <h2>{isStudent ? 'Student Details' : 'Teacher Details'}</h2>
        </div>

        <section className="summary-section">
          <h3>Personal Information</h3>
          <div className="info-2col">
            <div className="info-block">
              <div className="info-label">
                <img src={UserIcon} alt="Full Name" className="icon" />
                <span>Full Name</span>
              </div>
              <div className="info-value">
                {studentData.name?.trim() ||
                  `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() ||
                  'N/A'}
              </div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={AddressIcon} alt="Address" className="icon" />
                <span>Address</span>
              </div>
              <div className="info-value">{safeString(studentData.address)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={CalendarIcon} alt="DOB" className="icon" />
                <span>Date of Birth</span>
              </div>
              <div className="info-value">{safeString(studentData.date_of_birth)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={GenderIcon} alt="Gender" className="icon" />
                <span>Gender</span>
              </div>
              <div className="info-value">{safeString(studentData.gender)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={UserIcon} alt="Role" className="icon" />
                <span>Role</span>
              </div>
              <div className="info-value">
                {safeString(studentData.role.charAt(0).toUpperCase() + studentData.role.slice(1))}
              </div>
            </div>
          </div>
        </section>

        <section className="summary-section">
          <h3>Contact Details</h3>
          <div className="info-2col">
            <div className="info-block">
              <div className="info-label">
                <img src={PhoneIcon} alt="Phone" className="icon" />
                <span>Phone Number</span>
              </div>
              <div className="info-value">{safeString(studentData.phn_num)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={PhoneIcon} alt="ICE Contact" className="icon" />
                <span>ICE Contact</span>
              </div>
              <div className="info-value">{safeString(studentData.ice_contact)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={EmailIcon} alt="Email" className="icon" />
                <span>Email Address</span>
              </div>
              <div className="info-value">{safeString(studentData.email)}</div>
            </div>
          </div>
        </section>

        {isStudent && (
          <>
            <section className="summary-section scrollable-section">
              <h3>Educational Records</h3>
              <div className="scroll-table">
                <table>
                  <thead>
                    <tr>
                      <th>Course Name</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedCourses.length > 0 ? (
                      assignedCourses.map((c, i) => {
                        if (typeof c !== 'object' || c === null) return null;
                        return (
                          <tr key={i}>
                            <td>{safeString(c.course)}</td>
                            <td>{safeString(c.grade)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="2">No courses assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="summary-section">
              <h3>Academic Details</h3>
              <div className="info-2col">
                <div className="info-block">
                  <div className="info-label">
                    <img src={BranchIcon} alt="Branch" className="icon" />
                    <span>Branch</span>
                  </div>
                  <div className="info-value">{safeString(studentData.branch)}</div>
                </div>

                <div className="info-block">
                  <div className="info-label">
                    <img src={StudentIcon} alt="Student ID" className="icon" />
                    <span>Student ID</span>
                  </div>
                  <div className="info-value">{safeString(studentData.student_no)}</div>
                </div>
              </div>
            </section>

            <section className="summary-section scrollable-section">
              <h3>Schedule</h3>
              <div className="scroll-table">
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length > 0 ? (
                      schedules.map((s, i) => {
                        if (typeof s !== 'object' || s === null) return null;
                        return (
                          <tr key={i}>
                            <td>{safeString(s.day)}</td>
                            <td>{safeString(s.time)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="2">No schedules available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <div className="summary-buttons">
          {/* <button className="prev-btn" onClick={onClose}>
            Close
          </button> */}
          {onSave && (
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          )}
          {onEdit && (
            <button className="edit-btn" onClick={onEdit}>
              Edit
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Step5Summary;