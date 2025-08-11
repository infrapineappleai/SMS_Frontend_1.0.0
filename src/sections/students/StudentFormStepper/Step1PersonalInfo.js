import React from 'react';
import CalendarIcon from '../../../assets/icons/Calendar.png';
import FilterIcon from '../../../assets/icons/Filter.png';
import '../../../Styles/Students-css/StudentFormStepper/Step1PersonalInfo.css';

const Step1PersonalInfo = ({ formData, onChange, errors, onImageChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    onChange({ [name]: value });
  };

  return (
    <div className="step-one-fields-with-image">
      <div className="step1-top-row">
        {/* Profile Upload Section */}
        <div className="profile-upload-section">
          <label htmlFor="profileUpload" className="profile-upload-label">
            {formData.previewUrl ? (
              <img src={formData.previewUrl} className="profile-preview" alt="Preview" />
            ) : (
              <div className="upload-placeholder">Upload Image</div>
            )}
          </label>
          <input
            id="profileUpload"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              console.log('Profile image input triggered');
              onImageChange(e);
            }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('profileUpload').click()}
            className="upload-btn"
          >
            Upload Photo
          </button>
        </div>

        {/* Form Section */}
        <div className="step1-form-section">
          {/* First Row: Salutation, First Name, Last Name */}
          <div className="form-row">
            <div className="form-group">
              <label>Salutation</label>
              <select
                name="salutation"
                value={formData.salutation || ''}
                onChange={handleInputChange}
                className="input-box"
              >
                <option value="">Select Salutation</option>
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
              </select>
              {errors.salutation && <span className="error">{errors.salutation}</span>}
            </div>

            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                placeholder="e.g. Maya"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                className="input-box"
              />
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                placeholder="e.g. Perera"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                className="input-box"
              />
              {errors.last_name && <span className="error">{errors.last_name}</span>}
            </div>
          </div>

          {/* Second Row: DOB, Gender, and Role */}
          <div className="form-row">
            <div className="form-group dob-group">
              <label>Date of Birth</label>
              <div className="input-icon-container">
                <input
                  type="date"
                  name="date_of_birth"
                  className="input-box with-icon"
                  value={formData.date_of_birth || ''}
                  onChange={handleInputChange}
                />
                <img src={CalendarIcon} alt="calendar" className="input-icon calendar-icon" />
              </div>
              {errors.date_of_birth && <span className="error">{errors.date_of_birth}</span>}
            </div>

            <div className="form-group">
              <label>Gender</label>
              <div className="input-icon-container">
                <select
                  name="gender"
                  className="input-box with-icon"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
              </div>
              {errors.gender && <span className="error">{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label>Role</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleInputChange}
                  />
                  Student
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleInputChange}
                  />
                  Teacher
                </label>
              </div>
              {errors.role && <span className="error">{errors.role}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;