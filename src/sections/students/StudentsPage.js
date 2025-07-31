import React, { useState, useEffect } from 'react';
import StudentsList from './StudentsList';
import AddStudentForm from './StudentFormStepper/AddStudentForm';
import { getAllStudents, deleteStudent } from '../integration/studentAPI';
import { useToast } from '../modals/ToastProvider';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await getAllStudents();
        if (!Array.isArray(response)) {
          throw new Error('Invalid response format');
        }
        console.log('StudentsPage: Fetched students:', response);
        setStudents(response);
        setFilteredStudents(response);
        setError(null);
      } catch (e) {
        setError(`Failed to load students: ${e.message}`);
        showToast({
          title: 'Error',
          message: `Failed to load students: ${e.message}`,
          isError: true,
        });
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [showToast]);

useEffect(() => {
  console.log('StudentsPage: Input students:', students);
  console.log('StudentsPage: Filters:', { stateFilter, courseFilter, searchQuery });

  // Log key fields for debugging
  console.log('StudentsPage: Student details:', students.map(s => ({
    id: s.id,
    name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
    email: s.email,
    status: s.status,
    course: s.course,
    assignedCourses: s.assignedCourses,
    student_no: s.student_no
  })));

  let result = [...students];

  const trimmedQuery = (searchQuery || '').trim().toLowerCase();
  if (trimmedQuery) {
    result = result.filter((s) => {
      const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).trim().toLowerCase();
      const course = (s.course || '').trim().toLowerCase();
      const studentNo = (s.student_no || '').trim().toLowerCase();
      const email = (s.email || '').trim().toLowerCase();
      const matches = (
        name.includes(trimmedQuery) ||
        course.includes(trimmedQuery) ||
        studentNo.includes(trimmedQuery) ||
        email.includes(trimmedQuery)
      );
      console.log(`Search filter for ${s.id}:`, { matches, name, course, studentNo, email, query: trimmedQuery });
      return matches;
    });
    console.log('StudentsPage: After searchQuery:', result);
  }

  if (stateFilter) {
    const trimmedStateFilter = stateFilter.trim().toLowerCase();
    result = result.filter((s) => {
      const studentStatus = (s.status || 'active').trim().toLowerCase();
      const matches = studentStatus === trimmedStateFilter;
      console.log(`Status filter for ${s.id}:`, { studentStatus, filter: trimmedStateFilter, matches });
      return matches;
    });
    console.log('StudentsPage: After stateFilter:', result);
  }

  if (courseFilter) {
    const trimmedCourseFilter = courseFilter.trim().toLowerCase();
    result = result.filter((s) => {
      // Check assignedCourses (array of objects)
      const matchesAssignedCourses = s.assignedCourses?.length > 0 &&
        s.assignedCourses.some((c) => (c.course || '').trim().toLowerCase() === trimmedCourseFilter);
      
      // Check course (string) as exact match or in comma-separated list
      const courseStr = (s.course || '').trim().toLowerCase();
      const matchesCourseString = courseStr === trimmedCourseFilter ||
        courseStr.split(',').map(c => c.trim()).includes(trimmedCourseFilter);
      
      const matches = matchesAssignedCourses || matchesCourseString;
      console.log(`Course filter for ${s.id}:`, {
        courseFilter: trimmedCourseFilter,
        course: s.course,
        assignedCourses: s.assignedCourses,
        matchesAssignedCourses,
        matchesCourseString,
        matches
      });
      return matches;
    });
    console.log('StudentsPage: After courseFilter:', result);
  }

  setFilteredStudents(result);
  console.log('StudentsPage: Final filteredStudents:', result);
}, [students, stateFilter, courseFilter, searchQuery]);

  const handleSaveStudent = (studentData) => {
    console.log('StudentsPage: handleSaveStudent received:', studentData);
    setStudents((prev) => {
      const index = prev.findIndex((s) => s.id === studentData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = studentData;
        console.log('StudentsPage: Updated students:', updated);
        return updated;
      }
      const updated = [...prev, studentData];
      console.log('StudentsPage: Added new student, students:', updated);
      return updated;
    });
    setFilteredStudents((prev) => {
      const index = prev.findIndex((s) => s.id === studentData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = studentData;
        console.log('StudentsPage: Updated filteredStudents:', updated);
        return updated;
      }
      const matchesSearch = !searchQuery ||
        (studentData.name || `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim())
          .toLowerCase().includes(searchQuery.toLowerCase()) ||
        (studentData.course || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (studentData.student_no || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = !stateFilter ||
        (studentData.status || 'active').toLowerCase() === stateFilter.toLowerCase();
      const matchesCourse = !courseFilter ||
        (studentData.assignedCourses?.length > 0 &&
          studentData.assignedCourses.some((c) => (c.course || '').toLowerCase() === courseFilter.toLowerCase())) ||
        (studentData.course || '').toLowerCase().includes(courseFilter.toLowerCase());

      if (matchesSearch && matchesState && matchesCourse) {
        const updated = [...prev, studentData];
        console.log('StudentsPage: Added to filteredStudents:', updated);
        return updated;
      }
      console.log('StudentsPage: New student filtered out:', prev);
      return prev;
    });
    setIsAddOpen(false);
    setEditStudent(null);
    showToast({
      title: 'Success',
      message: 'Student saved successfully!',
    });
  };

  const handleEditStudent = (student) => {
    setEditStudent(student);
    setIsAddOpen(true);
  };

  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudent(id);
      setStudents((prevStudents) => {
        const updated = prevStudents.filter((student) => student.id !== id);
        console.log('StudentsPage: Students after deletion:', updated);
        return updated;
      });
      setFilteredStudents((prevFiltered) => {
        const updated = prevFiltered.filter((student) => student.id !== id);
        console.log('StudentsPage: FilteredStudents after deletion:', updated);
        return updated;
      });
      showToast({
        title: 'Success',
        message: 'Student deleted successfully!',
        isDelete: true,
      });
    } catch (error) {
      showToast({
        title: 'Error',
        message: `Failed to delete student: ${error.message}`,
        isError: true,
      });
    }
  };

  return (
    <div>
      <h2>Students</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsAddOpen(true)} style={{ padding: '8px 16px' }}>
          Add Student
        </button>
        <input
          type="text"
          placeholder="Search by name, course, or student ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
          aria-label="Search students"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          style={{ padding: '8px' }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          style={{ padding: '8px' }}
          aria-label="Filter by course"
        >
          <option value="">All Courses</option>
          <option value="Violin">Violin</option>
          <option value="Piano">Piano</option>
          <option value="Guitar">Guitar</option>
          <option value="HNDIT">HNDIT</option>
          <option value="IT">IT</option>
          <option value="Software">Software</option>
        </select>
      </div>
      {loading && <div style={{ color: 'blue', marginBottom: '10px' }}>Loading students...</div>}
      
      {!loading && !error && filteredStudents.length === 0 && (
        <div style={{ color: 'orange', marginBottom: '10px' }}>
          No students found.
        </div>
      )}
      <StudentsList
        students={filteredStudents}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onSaveStudent={handleSaveStudent}
      />
      <AddStudentForm
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditStudent(null);
        }}
        onAddStudent={handleSaveStudent}
        initialData={editStudent}
        isEditMode={!!editStudent}
      />
    </div>
  );
};

export default StudentsPage;