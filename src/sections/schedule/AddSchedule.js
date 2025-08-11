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
  fetchLecturers,
  fetchBranches
} from '../../integration/scheduleAPI';

const AddSchedule = ({ isOpen, onClose, schedule, onUpdate, onAdd }) => {
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [branches, setBranches] = useState([]);
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
    branch_id: '',
    days: [],
    startTime: '',
    startPeriod: 'AM',
    endTime: '',
    endPeriod: 'AM'
  });

  const [toastData, setToastData] = useState({ title: '', message: '', icon: '' });

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [coursesData, gradesData, lecturersData, branchesData] = await Promise.all([
          fetchCourses(),
          fetchGrades(),
          fetchLecturers(),
          fetchBranches()
        ]);

        setCourses(coursesData);
        setGrades(gradesData);
        setLecturers(lecturersData);
        setBranches(branchesData);
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
      grades.length > 0 &&
      branches.length > 0;

    if (shouldSetFormData) {
      const timeParts = schedule.time?.split('-').map(t => t.trim()) || [];
      const start = convertTo12Hour(schedule.startTime || timeParts[0]);
      const end = convertTo12Hour(schedule.endTime || timeParts[1]);

      const preparedFormData = {
        user_id: schedule.user_id?.toString() || '',
        course_id: schedule.course_id?.toString() || '',
        grade_id: schedule.grade_id?.toString() || '',
        branch_id: schedule.branch_id?.toString() || '',
        days: Array.isArray(schedule.days)
          ? schedule.days
          : schedule.day
          ? [schedule.day]
          : [],
        startTime: start.time,
        startPeriod: start.period,
        endTime: end.time,
        endPeriod: end.period,
        slot_id: schedule.slot_id || schedule.id || ''
      };

      setFormData(preparedFormData);
    } else if (isOpen && !schedule) {
      setFormData({
        user_id: '',
        course_id: '',
        grade_id: '',
        branch_id: '',
        days: [],
        startTime: '',
        startPeriod: 'AM',
        endTime: '',
        endPeriod: 'AM'
      });
    }
  }, [schedule, isOpen, lecturers, courses, grades, branches]);

  const normalizeTimeInput = (input) => {
    if (!input) return '';
    let value = input.trim().replace('.', ':');

    if (/^\d{1,2}$/.test(value)) {
      return value.padStart(2, '0') + ':00';
    }

    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const [hour, minute] = value.split(':');
      return hour.padStart(2, '0') + ':' + minute;
    }

    return value;
  };

  const convertTo24Hour = (time, period) => {
    if (!time || !period) return '';
    let [hour, minute] = time.split(':');
    hour = parseInt(hour, 10);

    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  const convertTo12Hour = (time) => {
    if (!time) return { time: '', period: 'AM' };
    let [hour, minute] = time.split(':');
    hour = parseInt(hour, 10);
    let period = 'AM';

    if (hour >= 12) {
      period = 'PM';
      if (hour > 12) hour -= 12;
    } else if (hour === 0) {
      hour = 12;
    }

    return { time: `${hour.toString().padStart(2, '0')}:${minute}`, period };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedStartTime = normalizeTimeInput(formData.startTime);
    const startTime24 = convertTo24Hour(normalizedStartTime, formData.startPeriod);
    const normalizedEndTime = normalizeTimeInput(formData.endTime);
    const endTime24 = convertTo24Hour(normalizedEndTime, formData.endPeriod);

    if (
      !formData.user_id ||
      !formData.course_id ||
      !formData.grade_id ||
      !formData.branch_id ||
      !formData.days.length ||
      !startTime24 ||
      !endTime24
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
        startTime: startTime24,
        endTime: endTime24,
      };

      const isEditMode = !!schedule;
      let result;

      if (isEditMode) {
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
        branch_id: '',
        days: [],
        startTime: '',
        startPeriod: 'AM',
        endTime: '',
        endPeriod: 'AM',
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
          <button className="cancel-btn" onClick={() => {
            setFormData({
              user_id: '',
              course_id: '',
              grade_id: '',
              branch_id: '',
              days: [],
              startTime: '',
              startPeriod: 'AM',
              endTime: '',
              endPeriod: 'AM'
            });
            onClose();
          }}>
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
                <label>Branch</label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

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
                <div className="time-input-group">
                  <input
                    type="text"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    placeholder="e.g., 8:00"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>AM/PM</label>
                <select
                  name="startPeriod"
                  value={formData.startPeriod}
                  onChange={handleChange}
                >
                  <option value="">Select Period</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div className="form-group"></div>

              <div className="form-group">
                <label>End Time</label>
                <div className="time-input-group">
                  <input
                    type="text"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    placeholder="e.g., 9:00"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>AM/PM</label>
                <select
                  name="endPeriod"
                  value={formData.endPeriod}
                  onChange={handleChange}
                >
                  <option value="">Select Period</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
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