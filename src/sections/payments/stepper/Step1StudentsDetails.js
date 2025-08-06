import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../../Styles/payment/stepper/Step1StudentsDetails.css';
import studentAvatar from '../../../assets/images/image1.jpg';
import FrameIcon from '../../../assets/icons/Frame.png';
import user from '../../../assets/icons/user_2_fill.png';
import whatsapp from '../../../assets/icons/whatsapp_fill.png';

const API_BASE_URL = "https://aradanabeta.pineappleai.cloud/api/sms"; // Base URL for API and images

const Step1StudentsDetails = ({ onStudentSelect }) => {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all students
  const fetchAllStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students`);
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setStudents(data);
      console.log('Fetched all students:', data);
    } catch (err) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students based on search query
  const fetchSearchStudents = async (query = '') => {
    if (!query.trim()) {
      fetchAllStudents();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (/^[a-zA-Z0-9\-_]+$/.test(query) && !/\s/.test(query) && query.toLowerCase().startsWith('st-')) {
        params.student_no = query.trim();
      } else {
        params.name = query.trim();
      }
      const response = await axios.get(`${API_BASE_URL}/api/student/search`, { params });
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      if (data.length === 0 && query) {
        setError(`No students found for "${query}".`);
      } else {
        setStudents(data);
      }
    } catch (err) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error searching students:', err.message, err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedFetchSearchStudents = useCallback(debounce(fetchSearchStudents, 500), []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      fetchAllStudents();
    } else {
      debouncedFetchSearchStudents(searchQuery);
    }
  }, [searchQuery, debouncedFetchSearchStudents]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudentId(student.student_no);
    console.log('Selected student for payment:', student);
    onStudentSelect(student); // Pass student data to parent for payment
  };

  // Construct full image URL
  const getImageUrl = (photoUrl) => {
    if (!photoUrl || photoUrl === '/default-avatar.png') {
      return studentAvatar;
    }
    return photoUrl.startsWith('http') ? photoUrl : `${API_BASE_URL}${photoUrl}`;
  };

  return (
    <div className="step-container">
      <div className="search-student-section">
        <label className="form-label">Search Student</label>
        <input
          type="text"
          className="form-input"
          placeholder="Type Student Name or ID"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="student-details-section">
        <label className="form-label">Student Details</label>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && students.length === 0 && <p>No students found.</p>}
        <div className="student-cards-grid">
          {students.map((student) => (
            <div
              key={student.student_no}
              className={`student-card ${selectedStudentId === student.student_no ? 'selected' : ''}`}
              onClick={() => handleSelectStudent(student)}
            >
              <div className="student-card-name-container">
                <img
                  src={getImageUrl(student.photo_url)}
                  alt="Student Avatar"
                  className="student-avatar"
                  onError={(e) => (e.target.src = studentAvatar)}
                />
                <p className="student-card-name">{student.full_name}</p>
              </div>
              <div className="student-card-info">
                <div className="student-card-info-container">
                  <div className="icon-container">
                    <img src={user} alt="Icon" className="icon-style" />
                  </div>
                  <div className="details-container">
                    <p><strong>Student ID</strong></p>
                    <p className="p-a">{student.student_no}</p>
                  </div>
                </div>
                <div className="student-card-info-container">
                  <div className="icon-container">
                    <img src={whatsapp} alt="Icon" className="icon-style" />
                  </div>
                  <div className="details-container">
                    <p><strong>WhatsApp Number</strong></p>
                    <p className="p-a">{student.phn_num}</p>
                  </div>
                </div>
                <div className="student-card-info-container">
                  <div className="icon-container">
                    <img src={FrameIcon} alt="Icon" className="icon-style" />
                  </div>
                  <div className="details-container">
                    <p><strong>Email Address</strong></p>
                    <p className="p-a">{student.email}</p>
                  </div>
                </div>
                <div className="student-card-info-container">
                 
                  <div className="details-container">
                    <p><strong>Branch</strong></p>
                    <p className="p-a">{student.branch_name}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step1StudentsDetails;