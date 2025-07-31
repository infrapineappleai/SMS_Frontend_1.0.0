import React from 'react';
import '../../../Styles/Students-css/StudentFormStepper/Step2ContactDetails.css';

const Step2ContactDetails = ({ formData, onChange, errors }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Step2ContactDetails handleInputChange: name=${name}, value=${value}`);
    onChange({ [name]: value });
  };

  console.log('Rendering Step2ContactDetails: formData=', formData, 'errors=', errors);

  return (
    <div className="step-content-wrapper">
      <div className="step-form-container">
        <div className="step-two-fields">
          <h3 className="section-header">Contact Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Phone Number</label>
              <input
                name="phn_num"
                type="text"
                className="input-box"
                placeholder="e.g. +94707325855"
                value={formData.phn_num || ''}
                onChange={handleInputChange}
              />
              {errors.phn_num && <span className="error">{errors.phn_num}</span>}
            </div>
            <div className="form-group">
              <label className="input-label">ICE Contact</label>
              <input
                name="ice_contact"
                type="text"
                className="input-box"
                placeholder="e.g. +94707325855"
                value={formData.ice_contact || ''}
                onChange={handleInputChange}
              />
              {errors.ice_contact && <span className="error">{errors.ice_contact}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Email</label>
              <input
                name="email"
                type="email"
                className="input-box"
                placeholder="e.g. example@domain.com"
                value={formData.email || ''}
                onChange={handleInputChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="input-label">Address</label>
              <textarea
                name="address"
                className="input-box"
                placeholder="Enter address"
                value={formData.address || ''}
                onChange={handleInputChange}
              />
              {errors.address && <span className="error">{errors.address}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2ContactDetails;