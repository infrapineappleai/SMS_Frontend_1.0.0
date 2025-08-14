import React, { useState, useMemo } from "react";
import StudentProfilePopup from "./StudentProfilePopup";
import "../../Styles/Students-css/StudentsList.css";
import { deleteStudent } from "../../integration/studentAPI";
import Delete from "../../assets/icons/Delete.png";
import { useToast } from "../../modals/ToastProvider";
import AddStudentForm from "../students/AddStudentForm";
import DeleteConfirmModal from "../../modals/DeleteConfirmModal";
import successIcon from '../../assets/icons/Success.png';
import errorIcon from '../../assets/icons/error.png';

const baseImageUrl = "http://aradanabeta.pineappleai.cloud:5000/uploads/";

const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/uploads/")
  );
};

const StudentImage = ({ photo_url, first_name, last_name }) => {
  let fullImageUrl = "";
  if (photo_url) {
    if (!photo_url.startsWith("http") && !photo_url.startsWith("data:image/")) {
      fullImageUrl = baseImageUrl + photo_url.replace(/^\/?uploads\//i, "");
    } else {
      fullImageUrl = photo_url;
    }
  }

  const suspicious = ["https/:", "wallpaper", "undefined", "null"];
  const shouldLog = suspicious.some((sub) => fullImageUrl?.includes(sub));

  if (!isValidImageUrl(fullImageUrl)) {
    if (shouldLog) {
      console.warn(
        `Invalid image URL for student: ${first_name} ${last_name}`,
        `Raw value: "${fullImageUrl}"`
      );
    }
    fullImageUrl = "/default-avatar.png";
  }

  return (
    <img
      src={fullImageUrl}
      alt={`${first_name} ${last_name}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/default-avatar.png";
      }}
      className="profile-img"
    />
  );
};

const StudentsList = ({ students, onEditStudent, onDeleteStudent, onSaveStudent }) => {
  console.log("StudentsList: Received students prop:", students);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const { showToast } = useToast();

  const handleProfileClick = (student) => {
    setSelectedStudent(student);
    setIsPopupOpen(true);
  };

  const handleEdit = (studentData) => {
    console.log(
      "StudentsList: Opening AddStudentForm for editing with data=",
      JSON.stringify(studentData, null, 2)
    );
    setEditStudentData(studentData);
    setIsEditFormOpen(true);
    setIsPopupOpen(false);
    if (onEditStudent) {
      onEditStudent(studentData);
    }
  };

  const handleDeleteClick = (e, studentId) => {
    e.stopPropagation();
    console.log("handleDeleteClick: studentId =", studentId);
    setStudentToDelete(studentId);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) {
      console.error("handleDelete: No student ID provided");
      showToast({
        title: "Error",
        message: "No student selected for deletion",
        isError: true,
        icon:errorIcon
      });
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      return;
    }

    try {
      await deleteStudent(studentToDelete);
      showToast({
        title: "Success",
        message: "Student deleted successfully!",
        icon:successIcon
      });
      if (onDeleteStudent) {
        onDeleteStudent(studentToDelete);
      }
    } catch (err) {
      console.error("handleDelete: Error deleting student:", err);
      showToast({
        title: "Error",
        message: err.message || "Failed to delete student",
        isError: true,
        icon:errorIcon
      });
    } finally {
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const statusA = (a.status || "").toLowerCase();
      const statusB = (b.status || "").toLowerCase();
      return statusA === "active" ? -1 : statusB === "active" ? 1 : 0;
    });
  }, [students]);

  return (
    <div className="main-content">
      <div className="container1">
        {students.length === 0 ? (
          <div className="empty-message">No students found.</div>
        ) : (
          <div className="card-grid">
            {sortedStudents.map((student) => (
              <div
                key={student.id}
                className={`profile-card ${
                  student.status === "Inactive" ? "inactive-card" : ""
                }`}
                onClick={() => handleProfileClick(student)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                <StudentImage
                  photo_url={student.photo_url}
                  first_name={student.first_name}
                  last_name={student.last_name}
                />
                <p className="student-name">
                  {student.name || `${student.first_name} ${student.last_name}`}
                </p>
                <p className="student-course">
                  Course: {student.course || "N/A"}
                </p>
                {student.status === "Inactive" && (
                  <span className="inactive-label">Inactive</span>
                )}
                <img
                  src={Delete}
                  className="delete-btn"
                  onClick={(e) => handleDeleteClick(e, student.id)}
                  style={{
                    position: "absolute",
                    height: "26px",
                    top: "8px",
                    right: "8px",
                    color: "white",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <StudentProfilePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        studentData={selectedStudent}
        onEdit={handleEdit}
      />
      <AddStudentForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditStudentData(null);
        }}
        onAddStudent={onEditStudent || (() => {})}
        initialData={editStudentData}
        isEditMode={true}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default StudentsList;