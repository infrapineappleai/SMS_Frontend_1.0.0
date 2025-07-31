import React, { useState } from 'react';
import StudentDetailsPopup from './StudentDetailsPopup'; 

const StudentsList = ({ students }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleProfileClick = (student) => {
    setSelectedStudent(student);
    setIsPopupOpen(true);
  };

  return (
    <div className="students-list">
      {students.map((student, index) => (
        <div key={index} className="student-card">
          <img
            src={student.profileImage || 'https://i.pravatar.cc/120?img=1'}
            alt={student.name}
            onClick={() => handleProfileClick(student)}
            className="profile-thumb"
            style={{ cursor: 'pointer', width: '60px', height: '60px', borderRadius: '50%' }}
          />
          <p>{student.name}</p>
        </div>
      ))}

      <StudentDetailsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        studentData={selectedStudent}
        onSave={(updated) => {
          setIsPopupOpen(false);
        }}
      />
    </div>
  );
};

export default StudentsList;
