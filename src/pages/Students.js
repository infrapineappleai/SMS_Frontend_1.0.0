import React, { useState, useEffect, useCallback } from 'react';
import StudentsList from '../sections/students/StudentsList';
import AddStudentForm from '../sections/students/AddStudentForm';
import StudentDetailsPopup from '../sections/students/editStepper/StudentDetailsPopup';
import { useToast } from '../modals/ToastProvider';
import {
  getAllStudents,
  searchStudents,
  getDropdownOptions,
} from '../integration/studentAPI';
import SearchIcon from '../assets/icons/searchButton.png';
import '../pages/Students.css';

const Students = () => {
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const fetchDropdownOptions = useCallback(async () => {
    try {
      const courses = await getDropdownOptions('courses');
      setCourses(courses);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      showToast({ title: 'Error', message: 'Failed to fetch dropdown options', isError: true });
    }
  }, [showToast]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedStudents = await getAllStudents();
      setStudents(fetchedStudents);
      setFilteredStudents(fetchedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      //showToast({ title: 'Error', message: error.message || 'Failed to fetch students', isError: true });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

//Auto refre
  useEffect(() => {
  const intervalId = setInterval(async () => {
    const newStudents = await getAllStudents();

    if (JSON.stringify(newStudents) !== JSON.stringify(students)) {
      setStudents(newStudents);
    }
  }, 1500);
  return () => clearInterval(intervalId);
}, [students]);

  useEffect(() => {
    fetchDropdownOptions();
    fetchStudents();
  }, [fetchDropdownOptions, fetchStudents]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      applyAllFilters(students);
      return;
    }
    try {
      const searchResults = await searchStudents(searchQuery);
      setFilteredStudents(searchResults);
    } catch (error) {
      console.error('Error searching students:', error);
      showToast({ title: 'Error', message: error.message || 'Failed to search students', isError: true });
    }
  }, [searchQuery, students, showToast]);

  const applyAllFilters = useCallback((baseStudents = students) => {
    let filtered = [...baseStudents];
    if (statusFilter) {
      filtered = filtered.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (courseFilter) {
      filtered = filtered.filter((s) =>
        s.assignedCourses.some(
          (ac) => ac.course.toLowerCase() === courseFilter.toLowerCase()
        )
      );
    }
    setFilteredStudents(filtered);
  }, [statusFilter, courseFilter, students]);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  const handleCourseFilter = useCallback((course) => {
    setCourseFilter(course);
  }, []);

  useEffect(() => {
    applyAllFilters();
  }, [statusFilter, courseFilter, students]);

  const addStudent = (newStudent) => {
    try {
      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      applyAllFilters(updatedStudents);
      setIsFormOpen(false);
      setSelectedStudent(null);
      setEditMode(false);
      showToast({ title: 'Success', message: 'Student added successfully!' });
    } catch (error) {
      showToast({ title: 'Error', message: `Failed to add student: ${error.message}`, isError: true });
    }
  };

  const updateStudent = (updatedStudent) => {
    try {
      const updatedList = students.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student
      );
      setStudents(updatedList);
      applyAllFilters(updatedList);
      setIsFormOpen(false);
      setSelectedStudent(null);
      setEditMode(false);
      showToast({ title: 'Success', message: 'Student updated successfully!' });
    } catch (error) {
      showToast({ title: 'Error', message: `Failed to update student: ${error.message}`, isError: true });
    }
  };

  const deleteStudent = (studentId) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    applyAllFilters(updated);
    setSelectedStudent(null);
    showToast({ title: 'Deleted', message: 'Student deleted successfully!', isDelete: true });
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setEditMode(false);
  };

  const handleEditStudent = () => {
    setIsFormOpen(true);
    setEditMode(true);
  };

  if (loading) return <div className="students-page">Loading students...</div>;

  return (
    <div className="students-container">
      <div className="search-add-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or student number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
          />
          <img src={SearchIcon} alt="Search" className="search-img" />
        </div>
        <div className="add-btn-wrapper">
          <button
            className="add-student-btn"
            onClick={() => {
              setSelectedStudent(null);
              setEditMode(false);
              setIsFormOpen(true);
            }}
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-buttons">
        <select value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={courseFilter} onChange={(e) => handleCourseFilter(e.target.value)}>
          <option value="">Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <StudentsList students={filteredStudents} onStudentClick={handleStudentClick} />

      {/* Form and Details */}
      <AddStudentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditMode(false);
        }}
        onAddStudent={editMode ? updateStudent : addStudent}
        initialData={editMode ? selectedStudent : null}
      />

      <StudentDetailsPopup
        isOpen={!!selectedStudent && !editMode}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        onSave={updateStudent}
        onDelete={deleteStudent}
        onEdit={handleEditStudent}
      />
    </div>
  );
};

export default Students;
