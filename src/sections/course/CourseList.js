import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../../Styles/Course-css.css/CourseList.css';
import filterIcon from '../../assets/icons/filter2.png';
import closeicon from '../../assets/icons/closeicon.png';
import CourseCatalog from '../course/AddCourseForm';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import deleteToastIcon from '../../assets/icons/Delete.png';
import successToastIcon from '../../assets/icons/Success.png';
import CourseActions from '../course/CourseActions';
import { getCourses, addCourse, updateCourse, deleteCourse, deleteGradeAndFee, searchCourses, updateGrade } from '../../integration/courseAPI';

// Grouping function for courses
const groupCourses = (courses) => {
  const groups = {};
  courses.forEach(course => {
    if (!groups[course.id]) {
      groups[course.id] = {
        id: course.id,
        uniqueId: course.uniqueId || course.id.toString(),
        name: course.name,
        status: course.status || 'Active',
        allGrades: (course.grades || []).map(grade => ({
          ...grade,
          courseUniqueId: course.uniqueId || course.id.toString()
        })),
        uniqueIds: [course.uniqueId || course.id.toString()],
        courseData: [course]
      };
    } else {
      const newGrades = (course.grades || []).map(grade => ({
        ...grade,
        courseUniqueId: course.uniqueId || course.id.toString()
      }));
      groups[course.id] = {
        ...groups[course.id],
        allGrades: [...groups[course.id].allGrades, ...newGrades],
        uniqueIds: [...groups[course.id].uniqueIds, course.uniqueId || course.id.toString()],
        courseData: [...groups[course.id].courseData, course]
      };
    }
  });
  return Object.values(groups);
};

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [detailEditCourse, setDetailEditCourse] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [courseFilter, setCourseFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseCatalog, setShowCourseCatalog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [toast, setToast] = useState({
    showToast: false,
    isError: false,
    isDelete: false,
    title: '',
    message: '',
    icon: null,
  });

  const courseOptions = ['All', 'Piano', 'Mridangam', 'Keyboard', 'Violin'];
  const statusOptions = ['Active', 'Inactive', 'Completed'];

  const groupedCourses = useMemo(() => groupCourses(courses), [courses]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getCourses();
        setCourses(response.data);
      } catch (error) {
        console.error('Fetch courses error:', error);
        setToast({
          showToast: true,
          isError: true,
          title: 'Error',
          message: error.message || 'Failed to fetch courses',
          icon: deleteToastIcon,
        });
        setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 2000);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isDeleting || isUpdating || showCourseCatalog || editCourse || detailEditCourse) {
      return;
    }
    const fetchSearchResults = async () => {
      try {
        const response = searchTerm ? await searchCourses(searchTerm) : await getCourses();
        setCourses(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setToast({
          showToast: true,
          isError: true,
          title: 'Error',
          message: error.message || 'Failed to search courses',
          icon: deleteToastIcon,
        });
        setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      }
    };
    fetchSearchResults();
  }, [searchTerm, isDeleting, isUpdating, showCourseCatalog, editCourse, detailEditCourse]);

  const refreshCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
      return response.data;
    } catch (error) {
      console.error('Refresh courses error:', error);
      return [];
    }
  };

  const handleGroupDelete = async (courseId) => {
    try {
      setIsDeleting(true);
      const group = groupedCourses.find(g => g.id === courseId);
      if (!group) return;

      await Promise.all(group.uniqueIds.map(id => deleteCourse(id)));
      
      await refreshCourses();
      setShowDeleteConfirm(null);
      setSelectedCourse(null);
      setToast({
        showToast: true,
        isError: false,
        isDelete: true,
        title: 'Success',
        message: 'Course and all grades deleted successfully',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } catch (error) {
      console.error('Delete group error:', error);
      setToast({
        showToast: true,
        isError: true,
        title: 'Error',
        message: error.message || 'Failed to delete course group',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDetailDeleteConfirm = async (courseUniqueId, gradeFeeId) => {
    try {
      setIsDeleting(true);
      if (!gradeFeeId || isNaN(parseInt(gradeFeeId))) {
        throw new Error('Invalid grade fee ID');
      }
      const response = await deleteGradeAndFee(courseUniqueId, gradeFeeId);
      
      const updatedCourses = await refreshCourses();
      
      if (selectedCourse) {
        const newGroups = groupCourses(updatedCourses);
        const updatedGroup = newGroups.find(g => g.id === selectedCourse.id);
        setSelectedCourse(updatedGroup || null);
      }

      setShowDeleteConfirm(null);
      setToast({
        showToast: true,
        isError: false,
        isDelete: true,
        title: 'Success',
        message: response.message,
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } catch (error) {
      console.error('Delete grade fee error:', error);
      setToast({
        showToast: true,
        isError: true,
        title: 'Error',
        message: error.message || 'Failed to delete grade and fee',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
    setIsDeleting(false);
  };

  const handleCourseFilterClick = () => {
    setShowCourseDropdown(!showCourseDropdown);
    setShowStatusDropdown(false);
  };

  const handleStatusFilterClick = () => {
    setShowStatusDropdown(!showStatusDropdown);
    setShowCourseDropdown(false);
  };

  const handleOptionClick = (option) => {
    setCourseFilter(option === 'All' ? null : option);
    setShowCourseDropdown(false);
  };

  const handleStatusOptionClick = (option) => {
    setStatusFilter(option === 'All' ? null : option);
    setShowStatusDropdown(false);
  };

  const handleAddCourseClick = () => {
    setEditCourse(null);
    setShowCourseCatalog(true);
  };

  const handleCourseCatalogSubmit = async (newCourses) => {
    try {
      const formattedCourses = newCourses.map((course) => ({
        id: course.courseId.trim(),
        name: course.courseName.trim(),
        status: course.status || 'Active',
        grades: [
          {
            grade: course.grade.trim(),
            fees: parseFloat(course.fees),
            status: course.status || 'Active',
          },
        ],
      }));

      for (const course of formattedCourses) {
        if (editCourse) {
          await updateCourse(editCourse.uniqueId, course);
        } else {
          await addCourse(course);
        }
      }

      await refreshCourses();
      setToast({
        showToast: true,
        isError: false,
        isDelete: false,
        title: 'Success',
        message: 'Courses saved successfully!',
        icon: successToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      setShowCourseCatalog(false);
      setEditCourse(null);
    } catch (error) {
      console.error('Course Catalog Submit Error:', error);
      // setToast({
      //   showToast: true,
      //   isError: true,
      //   title: 'Error',
      //   message: error.response?.data?.error || error.message || 'Failed to save courses',
      //   icon: deleteToastIcon,
      // });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    }
  };

  const handleCourseCatalogClose = () => {
    setShowCourseCatalog(false);
    setEditCourse(null);
  };

  const handleMainEditFormSubmit = async (e) => {
    e.preventDefault();

    if (!editCourse || !editCourse.uniqueId) {
      console.error("No course selected for editing or missing ID. Current editCourse:", editCourse);
      setToast({
        showToast: true,
        isError: true,
        title: 'Error',
        message: 'No course selected for editing. Please try again.',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      return;
    }

    try {
      setIsUpdating(true);

      const courseCode = e.target.courseCode.value.trim();
      const courseName = e.target.courseName.value.trim();
      const status = e.target.status.value;

      if (!courseCode || !courseName) {
        throw new Error("Course code and name are required");
      }

      const payload = {
        course_code: courseCode,
        name: courseName,
        status: status,
      };

      console.log("Update payload:", payload);
      console.log("Sending PATCH to:", `/course/${editCourse.uniqueId}`);

      await updateCourse(editCourse.uniqueId, payload);
      await refreshCourses();

      setToast({
        showToast: true,
        isError: false,
        isDelete: false,
        title: 'Success',
        message: 'Course details updated successfully',
        icon: successToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      setEditCourse(null);
    } catch (error) {
      console.error('Update error:', error);
      setToast({
        showToast: true,
        isError: true,
        title: 'Error',
        message: error.message || 'Failed to update course',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDetailEditFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const grade = e.target.grade.value.trim();
      const fees = e.target.fees.value.trim();
      const courseId = detailEditCourse.courseUniqueId;
      const gradeId = detailEditCourse.id;
      const gradeFeeId = detailEditCourse.gradeFeeId;
      const branchId = detailEditCourse.branchId || '1';

      console.log("DetailEditCourse:", detailEditCourse);

      if (!grade || !fees || isNaN(parseFloat(fees)) || parseFloat(fees) <= 0) {
        throw new Error('Valid grade and fees are required');
      }

      const payload = {
        gradeId: gradeId,
        grade: grade,
        fees: fees,
        gradeFeeId: gradeFeeId,
        branchId: branchId
      };

      await updateGrade(courseId, payload);
      
      const updatedCourses = await refreshCourses();
      
      if (selectedCourse) {
        const newGroups = groupCourses(updatedCourses);
        const updatedGroup = newGroups.find(g => g.id === selectedCourse.id);
        setSelectedCourse(updatedGroup || null);
      }

      setToast({
        showToast: true,
        isError: false,
        isDelete: false,
        title: 'Success',
        message: 'Grade details updated successfully',
        icon: successToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      setDetailEditCourse(null);
    } catch (error) {
      console.error('Detail update error:', error);
      setToast({
        showToast: true,
        isError: true,
        title: 'Error',
        message: error.response?.data?.error || error.message || 'Failed to update grade details',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, showToast: false });
  };

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowCourseDropdown(false);
        setShowStatusDropdown(false);
        if (editCourse) setEditCourse(null);
        if (detailEditCourse) setDetailEditCourse(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editCourse, detailEditCourse]);

  const filteredCourses = useMemo(() => {
    return groupedCourses.filter((course) => {
      const matchesSearch =
        course.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.status?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter ? course.name === courseFilter : true;
      const matchesStatus = statusFilter ? course.status === statusFilter : true;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [groupedCourses, searchTerm, courseFilter, statusFilter]);

  return (
    <div className="table-container" ref={wrapperRef}>
      <div className="table-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-btn1" onClick={handleAddCourseClick}>
          + Add Course
        </button>
      </div>
      <div className="table-container1">
        <table>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>
                Course Name
                <img
                  src={filterIcon}
                  alt="Filter"
                  className="icon filter-icon"
                  onClick={handleCourseFilterClick}
                />
                {showCourseDropdown && (
                  <div className="dropdown">
                    {courseOptions.map((option) => (
                      <div
                        key={option}
                        className="dropdown-item"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>
                Status
                <img
                  src={filterIcon}
                  alt="Filter"
                  className="icon filter-icon"
                  onClick={handleStatusFilterClick}
                />
                {showStatusDropdown && (
                  <div className="dropdown1">
                    <div className="dropdown-item" onClick={() => handleStatusOptionClick('All')}>
                      All
                    </div>
                    <div className="dropdown-item" onClick={() => handleStatusOptionClick('Active')}>
                      Active
                    </div>
                    <div className="dropdown-item" onClick={() => handleStatusOptionClick('Inactive')}>
                      Inactive
                    </div>
                    <div className="dropdown-item" onClick={() => handleStatusOptionClick('Completed')}>
                      Completed
                    </div>
                  </div>
                )}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course, index) => (
              <tr key={`${course.id}-${index}`}>
                <td>{course.id}</td>
                <td>{course.name}</td>
                <td>{course.status}</td>
                <td className="action-icons">
                  <CourseActions
                    course={course}
                    setSelectedCourse={setSelectedCourse}
                    setEditCourse={setEditCourse}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    isDetailView={false}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedCourse && !showDeleteConfirm && (
          <div className="course-details-popup1">
            <div className="popup-content1">
              <img
                src={closeicon}
                alt="Close"
                className="close-btn"
                onClick={() => setSelectedCourse(null)}
              />
              <p>
                <strong>Course Code: </strong>{selectedCourse.id}
              </p>
              <p>
                <strong>Course: </strong>{selectedCourse.name}
              </p>
              <p>
                <strong>Status: </strong>{selectedCourse.status}
              </p>
              <div className="details-table">
                <table>
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Fees(Rs)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourse.allGrades.map((detail, index) => (
                      <tr key={`${detail.courseUniqueId}-${detail.gradeFeeId}-${index}`}>
                        <td>{detail.grade || 'N/A'}</td>
                        <td>{detail.fees || '0'}</td>
                        <td className="action-icons1">
                          <CourseActions
                            course={{ 
                              ...detail, 
                              courseUniqueId: detail.courseUniqueId,
                              gradeFeeId: detail.gradeFeeId,
                              id: detail.uniqueId || detail.id,
                              branchId: detail.branchId || '1'
                            }}
                            setSelectedCourse={setSelectedCourse}
                            setEditCourse={setDetailEditCourse}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            hideView={true}
                            isDetailView={true}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {editCourse && (
          <div className="course-details-popup">
            <div className="popup-content">
              <img
                src={closeicon}
                alt="Close"
                className="close-btn"
                onClick={() => setEditCourse(null)}
              />
              <h3>Edit Course</h3>
              <form onSubmit={handleMainEditFormSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      type="text"
                      name="courseCode"
                      defaultValue={editCourse.id || ''}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Name</label>
                    <input
                      type="text"
                      name="courseName"
                      defaultValue={editCourse.name || ''}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      defaultValue={editCourse.status || 'Active'}
                      required
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="update-button" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          </div>
        )}
        {detailEditCourse && (
          <div className="course-details-popup">
            <div className="popup-content">
              <img
                src={closeicon}
                alt="Close"
                className="close-btn"
                onClick={() => setDetailEditCourse(null)}
              />
              <h3>Edit Grade</h3>
              <form onSubmit={handleDetailEditFormSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade</label>
                    <input
                      type="text"
                      name="grade"
                      defaultValue={detailEditCourse.grade || ''}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fees</label>
                    <input
                      type="text"
                      name="fees"
                      defaultValue={detailEditCourse.fees || ''}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="update-button1" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          </div>
        )}
        <DeleteConfirmModal
          isOpen={!!showDeleteConfirm}
          onClose={handleDeleteCancel}
          onDelete={() => {
            if (typeof showDeleteConfirm === 'string') {
              handleGroupDelete(showDeleteConfirm);
            } else if (showDeleteConfirm && showDeleteConfirm.courseId && showDeleteConfirm.detailId) {
              handleDetailDeleteConfirm(showDeleteConfirm.courseId, showDeleteConfirm.detailId);
            }
          }}
        />
        {showCourseCatalog && (
          <CourseCatalog
            onSubmit={handleCourseCatalogSubmit}
            onClose={handleCourseCatalogClose}
            initialCourse={
              editCourse
                ? {
                    id: editCourse.id,
                    name: editCourse.name,
                    grade: editCourse.allGrades?.[0]?.grade || '',
                    fees: editCourse.allGrades?.[0]?.fees?.toString() || '',
                    status: editCourse.status,
                  }
                : null
            }
          />
        )}
        <Toast
          showToast={toast.showToast}
          isError={toast.isError}
          isDelete={toast.isDelete}
          title={toast.title}
          message={toast.message}
          icon={toast.icon}
          onClose={handleToastClose}
        />
      </div>
    </div>
  );
};

export default CourseList;