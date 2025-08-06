import axios from 'axios';

const API_BASE_URL = 'https://aradanabeta.pineappleai.cloud/api/sms/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const retryRequest = async (fn, retries = 2, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'ERR_NETWORK' && i < retries - 1) {
        console.log(`Retry ${i + 1}/${retries} after ${delay}ms due to network error`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const transformCourseData = (course) => {
  if (!course) {
    console.warn('transformCourseData: No course data provided');
    return null;
  }
  const transformed = {
    uniqueId: course?.id?.toString() || '',
    id: course?.course_code || '',
    name: course?.name || '',
    status: course?.status || 'Active',
    grades: (course?.grade || []).map(grade => {
      const fee = grade.gradeFees?.[0] || {};
      return {
        uniqueId: grade?.id?.toString() || '',
        grade: grade?.grade_name || '',
        fees: fee?.fee || 0,
        status: grade?.status || 'Active',
        branchId: fee?.branch?.id?.toString() || '1',
        gradeFeeId: fee?.id ? fee.id.toString() : ''
      };
    }) || []
  };
   
  return transformed;
};

export const getCourses = async () => {
  try {
    console.log('Fetching courses');
    const response = await retryRequest(() => apiClient.get('/course'));
    let courses = [];
    if (Array.isArray(response.data)) {
      courses = response.data;
    } else if (response.data?.courses) {
      courses = response.data.courses;
    } else if (response.data) {
      courses = [response.data];
    }
    const transformedCourses = courses
      .filter(course => course !== null)
      .map(transformCourseData)
      .filter(course => course !== null);

    return { data: transformedCourses };
  } catch (error) {
    console.error('Get Courses Error:', error, error.response?.data);
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch courses');
  }
};

export const searchCourses = async (searchTerm) => {
  try {
    console.log('Searching courses with term:', searchTerm);
    const response = await retryRequest(() => apiClient.get('/course/search', {
      params: { query: searchTerm }
    }));
    let courses = response.data.courses || response.data;
    if (!Array.isArray(courses)) {
      courses = [courses];
    }
    return { 
      data: courses.map(transformCourseData) 
    };
  } catch (error) {
    console.error('Search Courses Error:', error, error.response?.data);
    throw new Error(error.response?.data?.error || error.message || 'Failed to search courses');
  }
};

export const addCourse = async (courseData) => {
  try {
    console.log('Adding course:', JSON.stringify(courseData, null, 2));
    if (!courseData.id?.trim?.() || !courseData.name?.trim?.()) {
      throw new Error('Course code and name are required');
    }

    const grades = (courseData.grades || []).map(detail => {
      if (!detail.grade_name?.trim?.() || !detail.fees) {
        throw new Error('Grade name and fees are required for each detail');
      }
      return {
        grade_name: detail.grade_name.trim?.(),
        status: detail.status?.trim?.() || 'Active',
        gradeFees: [
          {
            fee: parseFloat(detail.fees) || 0,
            branch_id: parseInt(detail.branch_id || 1, 10),
          },
        ],
      };
    });

    const payload = {
      course_code: courseData.id.trim?.(),
      name: courseData.name.trim?.(),
      status: courseData.status?.trim?.() || 'Active',
      grades,
    };

    console.log('Payload sent to backend:', JSON.stringify(payload, null, 2));

    const response = await retryRequest(() => apiClient.post('/course', payload));

    console.log('Backend response:', JSON.stringify(response.data, null, 2));

    return {
      data: transformCourseData(response.data),
    };
  } catch (error) {
    console.error('Add Course Error:', error, error.response?.data);
    throw new Error(error.response?.data?.error || error.message || 'Failed to add course');
  }
};

export const updateCourse = async (courseId, payload) => {
  try {
    if (!courseId || isNaN(courseId)) {
      throw new Error('Invalid course ID');
    }
    const validPayload = {};
    if (payload.course_code) validPayload.course_code = payload.course_code.trim();
    if (payload.name) validPayload.name = payload.name.trim();
    if (payload.status) validPayload.status = payload.status.trim();

    if (Object.keys(validPayload).length === 0) {
      throw new Error('No valid fields to update');
    }

    console.log("Updating course:", courseId, JSON.stringify(validPayload, null, 2));

    const response = await retryRequest(() =>
      apiClient.patch(`/course/${courseId}`, validPayload)
    );

    console.log("Update response:", JSON.stringify(response.data, null, 2), "Status:", response.status);

    return response.data;
  } catch (error) {
    console.error("Update Course Error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Update failed'
    );
  }
};

export const deleteCourse = async (uniqueId) => {
  try {
    console.log('Deleting course:', uniqueId);
    const courseId = parseInt(uniqueId);
    if (isNaN(courseId)) throw new Error('Invalid course ID');
    
    const response = await retryRequest(() => apiClient.delete(`/course/${courseId}`));
    console.log('Delete course response:', JSON.stringify(response.data, null, 2));
    return { 
      message: 'Course deleted successfully' 
    };
  } catch (error) {
    console.error('Delete Course Error:', error, error.response?.data);
    throw new Error(error.response?.data?.error || error.message || 'Failed to delete course');
  }
};

export const deleteGradeAndFee = async (courseId, gradeFeeId) => {
  try {
    console.log('Deleting grade and fee:', { courseId, gradeFeeId });
    if (!gradeFeeId || isNaN(parseInt(gradeFeeId))) {
      throw new Error('Invalid grade fee ID');
    }
    if (!courseId || isNaN(parseInt(courseId))) {
      throw new Error('Invalid course ID');
    }

    // Delete the grade fee using the course-specific endpoint
    const response = await retryRequest(() => 
      apiClient.delete(`/course/${courseId}/grade-fee/${gradeFeeId}`)
    );
    console.log('Delete grade fee response:', JSON.stringify(response.data, null, 2), 'Status:', response.status);

    return { 
      success: response.data.success,
      message: response.data.message,
      data: response.data.data
    };
  } catch (error) {
    console.error('Delete Grade and Fee Error:', error, error.response?.data);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'Failed to delete grade and fee'
    );
  }
};

export const updateGrade = async (courseId, gradeData) => {
  try {
    if (!courseId || isNaN(courseId)) {
      throw new Error('Invalid course ID');
    }
    const validPayload = {
      grades: [{
        id: gradeData.gradeId,
        grade_name: gradeData.grade,
        status: gradeData.status || 'Active',
        gradeFees: [{
          id: gradeData.gradeFeeId,
          fee: parseFloat(gradeData.fees) || 0,
          branch_id: parseInt(gradeData.branchId || 1, 10)
        }]
      }]
    };

    console.log("Updating grade:", courseId, JSON.stringify(validPayload, null, 2));

    const response = await retryRequest(() =>
      apiClient.patch(`/course/${courseId}`, validPayload)
    );

    console.log("Update response:", JSON.stringify(response.data, null, 2), "Status:", response.status);

    return response.data;
  } catch (error) {
    console.error("Update Grade Error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Update failed'
    );
  }
};

export const getBranches = async () => {
  try {
    console.log('Fetching branches');
    const response = await retryRequest(() => apiClient.get('/branch'));
    console.log('Branches fetched:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Get Branches Error:', error, error.response?.data);
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch branches');
  }
};