const API_BASE_URL = 'https://aradanabeta.pineappleai.cloud/api/sms/api';
const API_URL = `${API_BASE_URL}/schedule/`;

// Format time to backend standard (HH:MM:SS)
const toBackendTime = (time) => {
  if (!time) return '';
  const [hr, min] = time.includes('.') ? time.split('.') : time.split(':');
  const hour = hr.padStart(2, '0');
  const minute = min.padStart(2, '0');
  return `${hour}:${minute}:00`;
};

// Convert backend slot to frontend-friendly format
export const transformSlotToSchedule = (slot) => {
  let start = slot.start_time;
  let end = slot.end_time;

  if ((!start || !end) && slot.time?.includes('-')) {
    const [startPart, endPart] = slot.time.split('-');
    start = startPart?.trim();
    end = endPart?.trim();
  }

  return {
    id: slot.id?.toString() || slot.slot_id?.toString(),
    slot_id: slot.slot_id || slot.id,
    name: slot.lecturer_name || 'N/A',
    course: slot.course_name || 'N/A',
    course_id: slot.course_id?.toString() || '',

    grade: slot.grade || 'N/A',
    grade_id: slot.grade_id?.toString() || '',

    user_id: slot.user_id?.toString() || '',

    days: slot.days || [slot.day || 'N/A'],
    time: start && end ? `${start.substring(0, 5)}-${end.substring(0, 5)}` : 'N/A',
    startTime: start ? start.substring(0, 5).replace(':', '.') : 'N/A',
    endTime: end ? end.substring(0, 5).replace(':', '.') : 'N/A',

    branch_id: slot.branch_id || 2
  };
};

//  fetch wrapper
const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error('Request failed');
      error.cause = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

//  Fetch all schedules
export const fetchSchedules = async () => {
  const response = await fetchData(`${API_URL}`);
  if (!response.success) throw new Error(response.message || 'Failed to fetch schedules');
  return response.data.map(transformSlotToSchedule);
};

//  Search schedules
export const searchSchedules = async (criteria) => {
  const url = new URL(`${API_URL}search`);
  url.searchParams.append('lecturer_name', criteria.lecturer || '');
  url.searchParams.append('course', criteria.course || '');
  url.searchParams.append('grade', criteria.grade || '');

  const response = await fetchData(url);
  if (!response.success) throw new Error(response.message || 'Failed to search schedules');
  return response.data.map(transformSlotToSchedule);
};

//  Create schedule
export const createSchedule = async (scheduleData) => {
  if (!scheduleData.user_id || isNaN(parseInt(scheduleData.user_id))) {
    throw new Error('Invalid or missing user_id');
  }
  if (!scheduleData.grade_id || isNaN(parseInt(scheduleData.grade_id))) {
    throw new Error('Invalid or missing grade_id');
  }
  if (!scheduleData.course_id || isNaN(parseInt(scheduleData.course_id))) {
    throw new Error('Invalid or missing course_id');
  }
  if (!Array.isArray(scheduleData.days) || scheduleData.days.length === 0) {
    throw new Error('Days must be a non-empty array');
  }
  if (!scheduleData.startTime || !/^\d{1,2}[.:]\d{2}$/.test(scheduleData.startTime)) {
    throw new Error('Invalid or missing startTime (format: HH.MM or HH:MM)');
  }
  if (!scheduleData.endTime || !/^\d{1,2}[.:]\d{2}$/.test(scheduleData.endTime)) {
    throw new Error('Invalid or missing endTime (format: HH.MM or HH:MM)');
  }

  const payload = {
    user_id: parseInt(scheduleData.user_id),
    grade_id: parseInt(scheduleData.grade_id),
    course_id: parseInt(scheduleData.course_id),
    branch_id: scheduleData.branch_id || 2,
    days: scheduleData.days,
    start_time: toBackendTime(scheduleData.startTime),
    end_time: toBackendTime(scheduleData.endTime)
  };

  const response = await fetchData(`${API_URL}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!response.success || !Array.isArray(response.data)) {
    throw new Error(response.message || 'Schedule creation failed');
  }

  const enrichedSchedules = await Promise.all(
    response.data.map(async (slot) => {
      const slotDetails = await fetchData(`${API_URL}${slot.slot_id}`);
      return transformSlotToSchedule(slotDetails.data);
    })
  );

  return enrichedSchedules;
};

// Update schedule
export const updateSchedule = async (slotId, scheduleData, originalData = {}) => {
  const payload = {
    day: scheduleData.days[0],
    start_time: toBackendTime(scheduleData.startTime),
    end_time: toBackendTime(scheduleData.endTime),
    course_id: parseInt(scheduleData.course_id),
    branch_id: scheduleData.branch_id || 2
  };

  // Conditional update for user_id
  if (scheduleData.user_id && scheduleData.user_id !== originalData.user_id) {
    payload.user_id = parseInt(scheduleData.user_id);
  }

  // Conditional update for grade_id
  if (scheduleData.grade_id && scheduleData.grade_id !== originalData.grade_id) {
    payload.grade_id = parseInt(scheduleData.grade_id);
  }

  await fetchData(`${API_URL}${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  const updated = await fetchData(`${API_URL}${slotId}`);
  return transformSlotToSchedule(updated.data);
};


// Delete schedule
export const deleteSchedule = async (slotId) => {
  console.log("Calling DELETE on:", `${API_URL}${slotId}`);
  try {
    const response = await fetch(`${API_URL}${slotId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};

// Master data fetchers
export const fetchLecturers = async () => {
  try {
    const response = await fetchData(`${API_BASE_URL}/master/lecturers`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch lecturers');
    }
    return response.data;
  } catch (error) {
    const message = error.cause?.message || error.message;
    throw new Error(`Failed to fetch lecturers: ${message}`);
  }
};

export const fetchCourses = async () => {
  try {
    const response = await fetchData(`${API_BASE_URL}/master/courses`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch courses');
    }
    return response.data;
  } catch (error) {
    const message = error.cause?.message || error.message;
    throw new Error(`Failed to fetch courses: ${message}`);
  }
};

export const fetchGrades = async () => {
  try {
    const response = await fetchData(`${API_BASE_URL}/master/grades`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch grades');
    }
    return response.data.map(grade => ({
      ...grade,
      label: grade.name
    }));
  } catch (error) {
    const message = error.cause?.message || error.message;
    throw new Error(`Failed to fetch grades: ${message}`);
  }
};

export const fetchBranches = async () => {
  try {
    const response = await fetchData(`${API_BASE_URL}/master/branches`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch branches');
    }
    return response.data;
  } catch (error) {
    const message = error.cause?.message || error.message;
    throw new Error(`Failed to fetch branches: ${message}`);
  }
};