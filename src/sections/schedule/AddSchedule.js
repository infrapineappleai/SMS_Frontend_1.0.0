import React, { useState, useEffect } from 'react';
import '../../Styles/Schedule/AddSchedule.css';
import Toast from '../../modals/ToastModel';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import Close from '../../assets/icons/Close.png';
import Dropdown from '../../assets/icons/Filter.png';
import {
  createSchedule,
  updateSchedule,
  fetchCourses,
  fetchGrades,
  fetchLecturers  
} from '../../integration/scheduleAPI';

const AddSchedule = ({ isOpen, onClose, schedule, onUpdate, onAdd }) => {
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' }
  ];

  const [formData, setFormData] = useState({
    user_id: '',
    course_id: '',
    grade_id: '',
    days: [],
    startTime: '',
    endTime: ''
  });

  const [toastData, setToastData] = useState({ title: '', message: '', icon: '' });

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [coursesData, gradesData, lecturersData] = await Promise.all([
          fetchCourses(),
          fetchGrades(),
          fetchLecturers()
        ]);

        setCourses(coursesData);
        setGrades(gradesData);
        setLecturers(lecturersData);
      } catch (error) {
        console.error('Failed to fetch master data:', error);
        setToastData({
          icon: Error,
          title: 'Error',
          message: error.message
        });
        setIsError(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1000);
      }
      setLoading(false);
    };

    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);

useEffect(() => {
  const shouldSetFormData =
    isOpen &&
    schedule &&
    lecturers.length > 0 &&
    courses.length > 0 &&
    grades.length > 0;

  if (shouldSetFormData) {
    const timeParts = schedule.time?.split('-').map(t => t.trim()) || [];

    const preparedFormData = {
      user_id: schedule.user_id?.toString() || '',
      course_id: schedule.course_id?.toString() || '',
      grade_id: schedule.grade_id?.toString() || '',
      days: Array.isArray(schedule.days)
        ? schedule.days
        : schedule.day
        ? [schedule.day]
        : [],
      startTime: schedule.startTime || timeParts[0] || '',
      endTime: schedule.endTime || timeParts[1] || '',
      slot_id: schedule.slot_id || schedule.id || ''
    };

    setFormData(preparedFormData);
  }
}, [schedule, isOpen, lecturers, courses, grades]);




 const normalizeTimeInput = (input) => {
  if (!input) return '';
  let value = input.trim().replace('.', ':');

  // If input is just an hour like "3" or "03"
  if (/^\d{1,2}$/.test(value)) {
    return value.padStart(2, '0') + ':00';
  }

  // If input is hour:minute like "3:00"
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(':');
    return hour.padStart(2, '0') + ':' + minute;
  }

  // If already in HH:MM:SS or similar
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  // Fallback
  return value;
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const normalizedStartTime = normalizeTimeInput(formData.startTime);
  const normalizedEndTime = normalizeTimeInput(formData.endTime);

  if (
    !formData.user_id ||
    !formData.course_id ||
    !formData.grade_id ||
    !formData.days.length ||
    !normalizedStartTime ||
    !normalizedEndTime
  ) {
    setIsError(true);
    setToastData({
      icon: Error,
      title: 'Error',
      message: 'Please fill all required fields',
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1000);
    return;
  }

  try {
    const updatedData = {
      ...formData,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
    };

    const isEditMode = !!schedule;
    let result;

    if (isEditMode) {
      // ✅ Pass master data to enrich update result
      result = await updateSchedule(updatedData.slot_id, updatedData, lecturers, courses, grades);
      onUpdate(result);
    } else {
      result = await createSchedule(updatedData);
      onAdd(result);
    }

    setIsError(false);
    setToastData({
      icon: Success,
      title: 'Success',
      message: isEditMode ? 'Schedule updated successfully.' : 'Schedule added successfully.',
    });
    setShowToast(true);

    setFormData({
      user_id: '',
      course_id: '',
      grade_id: '',
      days: [],
      startTime: '',
      endTime: '',
    });

    setTimeout(() => setShowToast(false), 3000);
  } catch (error) {
    setIsError(true);
    setToastData({
      icon: Error,
      title: 'Error',
      message: error.message,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }
};



  const handleToastClose = () => {
    setShowToast(false);
    setIsError(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        days: checked
          ? [...prev.days, value]
          : prev.days.filter(day => day !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{schedule ? 'Edit Schedule' : 'Add Schedule'}</h2>
          <button className="cancel-btn" onClick={onClose}>
            <img src={Close} alt='close' className="cancel-icon" />
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>Loading form data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Lecturer Name</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course Name</label>
                <select
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Grade</label>
                <select
                  id="grade_id"
                  name="grade_id"
                  value={formData.grade_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.label || grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Day</label>
                <div className="custom-dropdown">
                  <div
                    className="dropdown-toggle"
                    onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                  >
                    {formData.days.length > 0
                      ? formData.days.join(', ')
                      : 'Select days'}
                    <img src={Dropdown} alt='dropdown' className='dropdown-icon' />
                  </div>
                  {isDayDropdownOpen && (
                    <div className="dropdown-menu">
                      {daysOfWeek.map(day => (
                        <label key={day.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            name="days"
                            value={day.name}
                            checked={formData.days.includes(day.name)}
                            onChange={handleChange}
                            className="custom-checkbox"
                          />
                          {day.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="text"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  placeholder="e.g., 08:00 or 8.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="text"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  placeholder="e.g., 09:00 or 9.00"
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="submit-btn">
                {schedule ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        <Toast
          showToast={showToast}
          isError={isError}
          onClose={handleToastClose}
          title={toastData.title}
          message={toastData.message}
          icon={toastData.icon}
        />
      </div>
    </div>
  );
};

export default AddSchedule;
