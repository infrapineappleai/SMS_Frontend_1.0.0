import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getDropdownOptions = async (type, params = {}) => {
  try {
    let url;
    switch (type) {
      case 'courses':
        url = `${API_URL}/courses`;
        break;
      case 'grades':
        if (!params.courseId) throw new Error('Course ID is required');
        url = `${API_URL}/courses/course/${params.courseId}/grades`;
        break;
      case 'branches':
        url = `${API_URL}/branches`;
        break;
      case 'slots':
        if (!params.branchId || !params.courseId || !params.gradeId) {
          throw new Error('branchId, courseId, and gradeId are all required for slot fetching');
        }
        url = `${API_URL}/slots/available?branchId=${params.branchId}&courseId=${params.courseId}&gradeId=${params.gradeId}`;
        break;
      default:
        throw new Error(`Invalid dropdown type: ${type}`);
    }

    const response = await axios.get(url);
    let data = response.data;

    if (type === 'slots') {
      data = data.map(slot => ({
        id: slot.id,
        branch_id: slot.branch_id,
        day: slot.day,
        time: `${slot.start_time || slot.st_time}-${slot.end_time}`,
      }));
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${type}:`, error.message);
    throw new Error(error.response?.data?.error || `Failed to fetch ${type}`);
  }
};

export const getStudentSlots = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/students/${studentId}/slots`);
    console.log(`Slots response for student ${studentId}:`, JSON.stringify(response.data, null, 2));
    return response.data.map(slot => {
      const day = slot.day || 'N/A';
      const startTime = slot.st_time || '';
      const endTime = slot.end_time || '';
      const time = startTime && endTime ? `${startTime}-${endTime}` : 'N/A';
      return {
        id: slot.id || Date.now(),
        day,
        time,
        branch_id: slot.branch_id || null,
        course_id: slot.course_id || null,
        grade_id: slot.grade_id || null,
      };
    });
  } catch (error) {
    console.error(`Error fetching student slots for ${studentId}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
};

export const getStudentBranches = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/students/${studentId}/branches`);
    console.log(`Branches response for student ${studentId}:`, JSON.stringify(response.data, null, 2));
    return response.data.map(branch => ({
      id: branch.id || null,
      branch_name: branch.branch_name || 'N/A',
    }));
  } catch (error) {
    console.error(`Error fetching student branches for ${studentId}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
};

export const createStudent = async (data) => {
  try {
    const studentDetails = JSON.parse(data.get('student_details') || '{}');
    if (!studentDetails.student_no) {
      throw new Error('student_no is required in student_details');
    }

    console.log('Sending student creation payload:', data);

    const response = await axios.post(`${API_URL}/students/finalize`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('Student creation response:', JSON.stringify(response.data, null, 2));

    const studentId = response.data.user_id || response.data.id || response.data.student?.id || response.data.student_id;
    if (!studentId) {
      throw new Error('Student ID not found in response');
    }

    const [grades, slots, branches] = await Promise.all([
      axios.get(`${API_URL}/courses/student/${studentId}/grades`),
      getStudentSlots(studentId),
      getStudentBranches(studentId),
    ]);

    const courses = await axios.get(`${API_URL}/courses`);
    const courseMap = new Map(courses.data.map(c => [c.id, c.name]));

    const assignedCourses = grades.data.map(grade => ({
      course: courseMap.get(grade.Grade?.Course?.id) || 'N/A',
      grade: grade.Grade?.grade_name || 'N/A',
    }));

    const userDetails = JSON.parse(data.get('user') || '{}');

    return {
      ...response.data,
      user_id: studentId,
      ...userDetails,
      ...studentDetails,
      photo_url: response.data.photo_url || '/default-avatar.png',
      assignedCourses,
      schedules: slots,
      branch: branches.length > 0 ? branches[0].branch_name : 'N/A',
    };
  } catch (error) {
    console.error('Error creating student:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create student');
  }
};

export const createStudentWithOptionalPhoto = async (data) => {
  try {
    const createRes = await createStudent(data);
    console.log('createStudent result:', createRes);

    if (!createRes.user_id) {
      console.error('No user_id found in createStudent response');
      throw new Error('Failed to retrieve student ID');
    }

    return createRes;
  } catch (error) {
    console.error('Error in createStudentWithOptionalPhoto:', error);
    throw error;
  }
};

export const uploadStudentPhoto = async (userId, photoFile) => {
  try {
    if (!userId) {
      throw new Error('userId is undefined');
    }
    console.log('Uploading photo for userId:', userId);
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await axios.post(`${API_URL}/students/${userId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('Photo uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading photo:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to upload photo');
  }
};

export const updateStudent = async (userId, data) => {
  try {
    // Ensure data is a FormData object
    const formData = data instanceof FormData ? data : new FormData();
    
    // Parse existing student_details and user for merging
    const studentDetails = JSON.parse(formData.get('student_details') || '{}');
    const userDetails = JSON.parse(formData.get('user') || '{}');
    
    // Add grade_ids and slot_ids if provided
    if (data.grade_ids) {
      formData.append('grade_ids', JSON.stringify(data.grade_ids));
    }
    if (data.slot_ids) {
      formData.append('slot_ids', JSON.stringify(data.slot_ids));
    }

    const response = await axios.patch(`${API_URL}/students/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Fetch updated data
    const [grades, slots, branches] = await Promise.all([
      axios.get(`${API_URL}/courses/student/${userId}/grades`),
      getStudentSlots(userId),
      getStudentBranches(userId),
    ]);

    const courses = await axios.get(`${API_URL}/courses`);
    const courseMap = new Map(courses.data.map(c => [c.id, c.name]));

    const assignedCourses = grades.data.map(grade => ({
      course: courseMap.get(grade.Grade?.Course?.id) || 'N/A',
      grade: grade.Grade?.grade_name || 'N/A',
    }));

    return {
      ...response.data,
      user_id: userId,
      ...userDetails,
      ...studentDetails,
      photo_url: response.data.photo_url || studentDetails.photo_url || '/default-avatar.png',
      assignedCourses,
      schedules: slots,
      branch: branches.length > 0 ? branches[0].branch_name : 'N/A',
    };
  } catch (error) {
    console.error('Error updating student:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to update student');
  }
};

export const getAllStudents = async () => {
  try {
    const response = await axios.get(`${API_URL}/users?role=student`);
    const courses = await axios.get(`${API_URL}/courses`);
    const courseMap = new Map(courses.data.map(c => [c.id, (c.name || 'N/A').trim().toLowerCase()]));
    console.log('getAllStudents: Course map:', Array.from(courseMap.entries()));

    const students = await Promise.all(
      response.data.map(async (student) => {
        try {
          const [profile, grades, slots, branches] = await Promise.all([
            axios.get(`${API_URL}/students/${student.id}/profile`),
            axios.get(`${API_URL}/courses/student/${student.id}/grades`),
            getStudentSlots(student.id),
            getStudentBranches(student.id),
          ]);

          console.log(`Branches for student ${student.id}:`, branches);
          console.log(`Slots for student ${student.id}:`, slots);
          console.log(`Grades for student ${student.id}:`, grades.data);

          const courseNames = grades.data
            .map(grade => courseMap.get(grade.Grade?.Course?.id))
            .filter(Boolean);

          const studentData = {
            ...student,
            student_no: profile.data.StudentDetail?.student_no || 'N/A',
            photo_url: profile.data.StudentDetail?.photo_url || '/default-avatar.png',
            salutation: profile.data.StudentDetail?.salutation || '',
            phn_num: student.phn_num || profile.data.StudentDetail?.phn_num || 'N/A',
            ice_contact: profile.data.StudentDetail?.ice_contact || student.ice_contact || 'N/A',
            student_details: {
              student_no: profile.data.StudentDetail?.student_no || 'N/A',
              photo_url: profile.data.StudentDetail?.photo_url || '/default-avatar.png',
              salutation: profile.data.StudentDetail?.salutation || '',
              ice_contact: profile.data.StudentDetail?.ice_contact || student.ice_contact || 'N/A',
            },
            status: (student.status || 'active').trim().toLowerCase(),
            course: courseNames.length > 0 ? courseNames.join(', ') : 'N/A',
            assignedCourses: grades.data.length > 0 ? grades.data.map(grade => ({
              course: courseMap.get(grade.Grade?.Course?.id) || 'N/A',
              grade: grade.Grade?.grade_name || 'N/A',
              course_id: grade.Grade?.Course?.id || null,
              grade_id: grade.Grade?.id || null,
            })) : [],
            schedules: slots || [],
            branch: branches.length > 0 ? branches[0].branch_name : 'N/A',
          };
          console.log(`Student ${student.id} data:`, studentData);
          return studentData;
        } catch (error) {
          console.error(`Failed to fetch profile or grades for student ${student.id}:`, error);
          return {
            ...student,
            student_no: 'N/A',
            photo_url: '/default-avatar.png',
            salutation: '',
            phn_num: student.phn_num || 'N/A',
            ice_contact: student.ice_contact || 'N/A',
            student_details: {
              student_no: 'N/A',
              photo_url: '/default-avatar.png',
              salutation: '',
              ice_contact: student.ice_contact || 'N/A',
            },
            status: (student.status || 'active').trim().toLowerCase(),
            course: 'N/A',
            assignedCourses: [],
            schedules: [],
            branch: 'N/A',
          };
        }
      })
    );

    console.log('getAllStudents: Final students list:', students);
    return students;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch students');
  }
};

export const deleteStudent = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/students/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting student:', error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete student');
  }
};

export const searchStudents = async (query) => {
  try {
    const students = await getAllStudents();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query.toLowerCase()) ||
        student.email?.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching students:', error.message);
    throw new Error(error.message || 'Failed to search students');
  }
};

export const filterStudents = async (filters) => {
  try {
    const students = await getAllStudents();
    return students.filter((student) => {
      const matchesStatus = filters.status ? student.status === filters.status : true;
      return matchesStatus;
    });
  } catch (error) {
    console.error('Error filtering students:', error.message);
    throw new Error(error.message || 'Failed to filter students');
  }
};

export const filterStudentsByCourse = async (courseId) => {
  try {
    const students = await getAllStudents();
    return students;
  } catch (error) {
    console.error('Error filtering students by course:', error.message);
    throw new Error(error.message || 'Failed to filter students by course');
  }
};