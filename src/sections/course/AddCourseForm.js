
import React, { useState, useEffect, useMemo } from 'react';
import '../../Styles/Course-css.css/AddCourseForm.css';
import closeicon from '../../assets/icons/closeicon.png';
import pencilIcon from '../../assets/icons/pencil_line.png';
import deleteIcon from '../../assets/icons/Delete.png';
import Toast from '../../modals/ToastModel';
import successToastIcon from '../../assets/icons/Success.png';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import deleteToastIcon from '../../assets/icons/Delete.png';
import { getCourses, addCourse} from '../../integration/courseAPI';


const CourseCatalog = ({ onSubmit, onClose, initialCourse }) => {
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    grade: '',
    status: 'Active',
    fees: '',
  });
  const [courses, setCourses] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [hasCourses, setHasCourses] = useState(!!initialCourse);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCourse) {
      const courseData = {
        courseId: initialCourse.id || '',
        courseName: initialCourse.name || '',
        grade: initialCourse.grade || '',
        status: initialCourse.status || 'Active',
        fees: initialCourse.fees?.toString() || '',
      };
      setFormData(courseData);
      if (initialCourse.id || initialCourse.name) {
        setCourses([courseData]);
        setEditIndex(0);
      }
    }
  }, [initialCourse]);

  useEffect(() => {
    setHasCourses(courses.length > 0);
  }, [courses]);

  const showToastNotification = (message, isSuccess = true) => {
    setToastMessage(message);
    setIsSuccess(isSuccess);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { courseId, courseName, grade, status, fees } = formData;
    if (!courseId || !courseName || !grade || !status || !fees) {
      showToastNotification('Please fill in all fields.', false);
      return;
    }
    if (isNaN(fees) || parseFloat(fees) <= 0) {
      showToastNotification('Fees must be a positive number.', false);
      return;
    }
    if (editIndex !== null) {
      handleUpdate();
    } else {
      setCourses([...courses, { ...formData }]);
      setFormData({ courseId: '', courseName: '', grade: '', status: 'Active', fees: '' });
      showToastNotification('Course added to list!');
    }
  };

  const handleClose = () => {
    if (formData.courseId || formData.courseName || formData.grade || formData.status !== 'Active' || formData.fees) {
      if (window.confirm('Are you sure you want to close? Unsaved data will be lost.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleFinalSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  try {
    if (!courses.length) {
      showToastNotification('No courses to submit.', false);
      return;
    }

    const validCourses = courses.filter((course) => {
      const isValid =
        course.courseId?.trim() &&
        course.courseName?.trim() &&
        course.grade?.trim() &&
        course.status?.trim() &&
        course.fees?.toString().trim() &&
        !isNaN(parseFloat(course.fees)) &&
        parseFloat(course.fees) > 0;
      if (!isValid) console.warn('Skipping invalid course:', course);
      return isValid;
    });

    if (!validCourses.length) {
      showToastNotification('All course entries are invalid.', false);
      return;
    }

    // Add to backend
    for (const course of validCourses) {
      await addCourse({
        id: course.courseId,
        name: course.courseName,
        status: course.status || 'Active',
        grades: [
          {
            grade_name: course.grade,
            fees: parseFloat(course.fees),
            status: course.status || 'Active',
          },
        ],
      });
    }

    // Fetch updated list from backend
    const { data: updatedCourses } = await getCourses();

    showToastNotification('Courses submitted successfully!');
    onSubmit(updatedCourses); // pass the actual updated course data to CourseList
    setCourses([]);
    setFormData({ courseId: '', courseName: '', grade: '', status: 'Active', fees: '' });
    onClose();
  } catch (error) {
    console.error('Submit Error:', error);
    showToastNotification(error.message || 'Failed to prepare courses.', false);
  } finally {
    setIsSubmitting(false);
  }
};


  const handleEdit = (index) => {
    setFormData({ ...courses[index] });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setCourses(courses.filter((_, i) => i !== deleteIndex));
    showToastNotification('Course removed from list!');
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleUpdate = () => {
    if (editIndex !== null) {
      const updatedCourses = [...courses];
      updatedCourses[editIndex] = { ...formData };
      setCourses(updatedCourses);
      setFormData({ courseId: '', courseName: '', grade: '', status: 'Active', fees: '' });
      setEditIndex(null);
      showToastNotification('Course updated in list!');
    }
  };

  const courseTable = useMemo(
    () => (
      <tbody className="table-body">
        {courses.map((course, index) => (
          <tr key={index}>
            <td>{course.courseId}</td>
            <td>{course.courseName}</td>
            <td>{course.grade}</td>
            <td>{course.status}</td>
            <td>{course.fees}</td>
            <td>
              <button className="action-btn edit" onClick={() => handleEdit(index)} aria-label={`Edit course ${course.courseId}`}>
                <img src={pencilIcon} alt="Edit" />
              </button>
              <button className="action-btn delete" onClick={() => handleDelete(index)} aria-label={`Delete course ${course.courseId}`}>
                <img src={deleteIcon} alt="Delete" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    ),
    [courses]
  );

  return (
    <div className="course-catalog-overlay">
      <div className={`course-catalog-modal ${hasCourses ? 'expanded' : ''}`}>
        <div className="course-catalog-header">
          <h3>{initialCourse ? 'Edit Course' : 'Course Catalog'}</h3>
          <button className="close-btn" onClick={handleClose} aria-label="Close modal">
            <img src={closeicon} alt="Close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="courseId">Course Code</label>
              <input
                id="courseId"
                type="text"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                placeholder="eg.099"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="courseName">Course Name</label>
              <input
                id="courseName"
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                placeholder="eg.piano"
                required
                aria-required="true"
              />
            </div>
          </div>
          <h3>Course Record</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grade">Grade</label>
              <input
                id="grade"
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="eg.02"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                aria-required="true"
              >
                <option value="" disabled>Select the Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="fees">Fees</label>
            <input
              id="fees"
              type="text"
              name="fees"
              value={formData.fees}
              onChange={handleChange}
              placeholder="eg.3000"
              required
              aria-required="true"
            />
          </div>
          <button type="submit" className="button-btn">
            {editIndex !== null ? 'Update Course' : 'Add Course'}
          </button>
        </form>
        {courses.length > 0 && (
          <div className="added-courses">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Fees(Rs)</th>
                  <th>Action</th>
                </tr>
              </thead>
              {courseTable}
            </table>
            <button
              type="button"
              className="submit-btn"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
      <Toast
        showToast={showToast}
        isError={!isSuccess}
        onClose={() => setShowToast(false)}
        title={isSuccess ? 'Success' : 'Error'}
        message={toastMessage}
        icon={toastMessage.includes('deleted') ? deleteToastIcon : successToastIcon}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onDelete={confirmDelete}
      />
    </div>
  );
};

export default CourseCatalog;