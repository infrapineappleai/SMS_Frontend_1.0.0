import React, { useState, useEffect } from 'react';
import '../../../Styles/Students-css/StudentFormStepper/Step3EducationalRecords.css';
import FilterIcon from '../../../assets/icons/Filter.png';
import { useToast } from '../../../modals/ToastProvider';
import { getDropdownOptions } from '../../../integration/studentAPI';
import EditIcon from '../../../assets/icons/Edit.png';
import DeleteIcon from '../../../assets/icons/Delete.png';
import successToastIcon from '../../../assets/icons/Success.png';
import ToggleSwitch from '../../../Components/ToggleSwitch';

const Step3EducationalRecords = ({ formData, onChange, errors }) => {
  const { showToast } = useToast();
  const [courseIdInput, setCourseIdInput] = useState(formData.course || '');
  const [gradeIdInput, setGradeIdInput] = useState(formData.grade || '');
  const [dropdownOptions, setDropdownOptions] = useState({ courses: [], grades: [] });
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const isActive = formData.status === 'Active';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const courses = await getDropdownOptions('courses');
        setDropdownOptions((prev) => ({ ...prev, courses: Array.isArray(courses) ? courses : [] }));
        if (!courses.length) {
          showToast({ title: 'Warning', message: 'No courses available.', isError: true });
        }
      } catch (error) {
        showToast({ title: 'Error', message: `Failed to load courses: ${error.message || 'Unknown error'}`, isError: true });
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [showToast]);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!courseIdInput) {
        setDropdownOptions((prev) => ({ ...prev, grades: [] }));
        setGradeIdInput('');
        return;
      }
      try {
        setLoadingGrades(true);
        const grades = await getDropdownOptions('grades', { courseId: courseIdInput });
        setDropdownOptions((prev) => ({ ...prev, grades: Array.isArray(grades) ? grades : [] }));
        if (!grades.length) {
          showToast({ title: 'Warning', message: 'No grades available for selected course.', isError: true });
        }
      } catch (error) {
        showToast({ title: 'Error', message: `Failed to load grades: ${error.message || 'Unknown error'}`, isError: true });
        setDropdownOptions((prev) => ({ ...prev, grades: [] }));
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [courseIdInput, showToast]);

  const toggleStatus = () => {
    onChange({
      ...formData,
      status: isActive ? 'Inactive' : 'Active',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'course') {
      setCourseIdInput(value);
      setGradeIdInput('');
      onChange({ ...formData, course: value, grade: '', assignedCourses: formData.assignedCourses || [] });
    } else if (name === 'grade') {
      setGradeIdInput(value);
      onChange({ ...formData, grade: value });
    }
  };

  const handleAssignCourse = (e) => {
    e.preventDefault();
    if (!courseIdInput || !gradeIdInput) {
      showToast({ title: 'Error', message: 'Please select both a course and a grade', isError: true });
      return;
    }

    const selectedCourse = dropdownOptions.courses.find((c) => String(c.id) === String(courseIdInput));
    const selectedGrade = dropdownOptions.grades.find((g) => String(g.id) === String(gradeIdInput));

    if (!selectedCourse || !selectedGrade) {
      showToast({ title: 'Error', message: 'Invalid course or grade selected', isError: true });
      return;
    }

    const newCourse = {
      id: Date.now(),
      course: selectedCourse.name,
      grade: selectedGrade.grade_name,
      course_id: selectedCourse.id,
      grade_id: selectedGrade.id,
    };

    onChange({
      ...formData,
      course: courseIdInput,
      grade: gradeIdInput,
      assignedCourses: [...(formData.assignedCourses || []), newCourse],
    });

    showToast({ title: 'Success', message: 'Course and grade assigned successfully!',icon: successToastIcon});
    setCourseIdInput('');
    setGradeIdInput('');
  };

  const handleEditCourse = (id) => {
    const courseToEdit = formData.assignedCourses.find((item) => item.id === id);
    if (courseToEdit && courseToEdit.course_id && courseToEdit.grade_id) {
      setCourseIdInput(String(courseToEdit.course_id));
      setGradeIdInput(String(courseToEdit.grade_id));
      const updatedCourses = formData.assignedCourses.filter((item) => item.id !== id);
      onChange({
        ...formData,
        course: String(courseToEdit.course_id),
        grade: String(courseToEdit.grade_id),
        assignedCourses: updatedCourses,
      });
    } else {
      showToast({ title: 'Error', message: 'Cannot edit: Missing course or grade ID', isError: true });
    }
  };

  const handleDeleteCourse = (id) => {
    const updatedCourses = formData.assignedCourses.filter((item) => item.id !== id);
    const first = updatedCourses[0] || {};
    onChange({
      ...formData,
      course: first.course_id || '',
      grade: first.grade_id || '',
      assignedCourses: updatedCourses,
    });

    showToast({ title: 'Deleted', message: 'Course entry removed successfully', isError: false,icon: successToastIcon });
  };

  return (
    <div className="step-three-fields">
      <div className="form-header-row">
        <h3 className="section-header">Educational Records</h3>
        <ToggleSwitch isActive={isActive} onToggle={toggleStatus} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Course</label>
          <div className="input-icon-container">
            <select
              name="course"
              className="input-box with-icon"
              value={courseIdInput}
              onChange={handleInputChange}
              disabled={loadingCourses || !dropdownOptions.courses.length}
            >
              <option value="">Select Course</option>
              {dropdownOptions.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} {course.course_code ? `(${course.course_code})` : ''}
                </option>
              ))}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
          {errors.course && <span className="error">{errors.course}</span>}
        </div>
        <div className="form-group">
          <label className="input-label">Grade</label>
          <div className="input-icon-container">
            <select
              name="grade"
              className="input-box with-icon"
              value={gradeIdInput}
              onChange={handleInputChange}
              disabled={loadingGrades || !courseIdInput || !dropdownOptions.grades.length}
            >
              <option value="">Select Grade</option>
              {dropdownOptions.grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.grade_name}
                </option>
              ))}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
          {errors.grade && <span className="error">{errors.grade}</span>}
        </div>
      </div>

      <button
        type="button"
        className="assign-btn"
        onClick={handleAssignCourse}
        disabled={loadingGrades || !courseIdInput || !gradeIdInput}
      >
        Assign Course
      </button>

      {errors.assignedCourses && <p className="error-msg">{errors.assignedCourses}</p>}

      {formData.assignedCourses?.length > 0 ? (
        <div className="assigned-table-wrapper">
          <table className="assigned-table">
            <thead>
              <tr>
                <th className="course-col">Course</th>
                <th className="grade-col">Grade</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.assignedCourses.map(({ id, course, grade }) => (
                <tr key={id}>
                  <td className="course-col">{course}</td>
                  <td className="grade-col">{grade}</td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <img src={EditIcon} alt="Edit" className="icon-btn edit-icon" onClick={() => handleEditCourse(id)} />
                      <img src={DeleteIcon} alt="Delete" className="icon-btn delete-icon" onClick={() => handleDeleteCourse(id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="error-msg">No courses assigned.</p>
      )}
    </div>
  );
};

export default Step3EducationalRecords;