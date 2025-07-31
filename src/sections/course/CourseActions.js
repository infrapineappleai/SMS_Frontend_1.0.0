import React from 'react';
import eyeIcon from '../../assets/icons/Eye.png';
import pencilIcon from '../../assets/icons/pencil_line.png';
import deleteIcon from '../../assets/icons/delete2.png';
import '../../Styles/Course-css.css/CourseActions.css';

const CourseActions = ({
  course,
  setSelectedCourse,
  setEditCourse,
  setShowDeleteConfirm,
  hideView = false,
  isDetailView = false,
}) => {
  const handleIconClick = (action) => {
    if (action === 'View') {
      if (!isDetailView) {
        setSelectedCourse(course);
        if (setEditCourse) setEditCourse(null);
      }
    } else if (action === 'Edit') {
      if (!course || !course.uniqueId) {
        console.error("Invalid course data for edit:", course);
        return;
      }
      // For detail view, pass the grade details including id
      if (isDetailView) {
        setEditCourse({
          ...course,
          gradeId: course.id, // Ensure gradeId is passed
          courseUniqueId: course.courseUniqueId,
          gradeFeeId: course.gradeFeeId,
          branchId: course.branchId || '1'
        });
      } else {
        setEditCourse(course);
      }
    } else if (action === 'Delete') {
      if (isDetailView) {
        if (!course.gradeFeeId) {
          console.error('Missing gradeFeeId in course detail:', course);
          return;
        }
        setShowDeleteConfirm({
          courseId: course.courseUniqueId,
          detailId: course.gradeFeeId,
        });
      } else {
        if (!course.id) {
          console.error('Missing course id:', course);
          return;
        }
        setShowDeleteConfirm(course.id);
      }
      if (!isDetailView && setSelectedCourse) {
        setSelectedCourse(null);
      }
      if (setEditCourse) setEditCourse(null);
    }
  };

  return (
    <div className="action-icons">
      {!hideView && (
        <img
          src={eyeIcon}
          alt="View"
          className="action-icon"
          onClick={() => handleIconClick('View')}
        />
      )}
      {setEditCourse && (
        <img
          src={pencilIcon}
          alt="Edit"
          className="action-icon"
          onClick={() => handleIconClick('Edit')}
        />
      )}
      {setShowDeleteConfirm && (
        <img
          src={deleteIcon}
          alt="Delete"
          className="action-icon"
          onClick={() => handleIconClick('Delete')}
        />
      )}
    </div>
  );
};

export default CourseActions;