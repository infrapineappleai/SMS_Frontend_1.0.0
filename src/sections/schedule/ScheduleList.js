import React, { useState, useEffect, useMemo } from 'react';
import '../../Styles/Schedule/Schedule.css';
import View from '../../assets/icons/view.png';
import Edit from '../../assets/icons/Edit.png';
import Delete from '../../assets/icons/Delete.png';
import DeleteIcon from '../../assets/icons/delete2.png';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import SearchIcon from '../../assets/icons/searchButton.png';
import AddSchedule from './AddSchedule';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import SpecificScheduleView from './SpecificScheduleView';
import {
  fetchSchedules,
  deleteSchedule,
  fetchCourses,
  fetchLecturers,
  fetchGrades,
} from '../../integration/scheduleAPI';

function ScheduleList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [schedulesToView, setSchedulesToView] = useState([]);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [targetDay, setTargetDay] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [toastData, setToastData] = useState({
    title: '',
    message: '',
    icon: Success,
    isDelete: false,
  });
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [applyFilter, setApplyFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Load schedules from backend
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await fetchSchedules();
        setSchedule(data);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        setToastData({
          title: 'Error',
          message: error.message,
          icon: Error,
          isDelete: false,
        });
        setIsError(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  // Load master data for lecturers, courses, grades
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [lecturersData, coursesData, gradesData] = await Promise.all([
          fetchLecturers(),
          fetchCourses(),
          fetchGrades(),
        ]);
        setLecturers(lecturersData);
        setCourses(coursesData);
        setGrades(gradesData);
      } catch (error) {
        console.error('Failed to load master data:', error);
      }
    };

    fetchMasterData();
  }, []);

  // Set selectedDay (today or tomorrow based on current time)
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDayIndex = now.getDay();

    const dayToShow =
      currentHour < 18
        ? daysOfWeek[currentDayIndex]
        : daysOfWeek[(currentDayIndex + 1) % 7];

    setSelectedDay(dayToShow);
    setTargetDay(dayToShow);
  }, []);

  // Filter schedules based on selectedDay and search term
  const filteredSchedules = useMemo(() => {
    let results = schedule;

    if (applyFilter && selectedDay) {
      results = results.filter(
        (s) => Array.isArray(s.days) && s.days.includes(selectedDay)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.course.toLowerCase().includes(term) ||
          s.grade.toLowerCase().includes(term)
      );
    }

    return results;
  }, [schedule, applyFilter, searchTerm, selectedDay]);

  const handleSearch = (term) => {
    setSearchTerm(term);
   // if (term) setApplyFilter(true);
  };

  const handleAddBtnClick = () => {
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (scheduleItem) => {
    const lecturerId =
      lecturers.find((l) => l.name === scheduleItem.name)?.id?.toString() || '';
    const courseId =
      courses.find((c) => c.name === scheduleItem.course)?.id?.toString() || '';
    const gradeId =
      grades.find(
        (g) => g.label === scheduleItem.grade || g.name === scheduleItem.grade
      )?.id?.toString() || '';

    setSelectedSchedule({
      ...scheduleItem,
      slot_id: scheduleItem.slot_id || scheduleItem.id,
      user_id: lecturerId,
      course_id: courseId,
      grade_id: gradeId,
      startTime:
        scheduleItem.start_time || scheduleItem.time?.split('-')[0].trim(),
      endTime: scheduleItem.end_time || scheduleItem.time?.split('-')[1].trim(),
      days: Array.isArray(scheduleItem.days)
        ? scheduleItem.days
        : scheduleItem.day
        ? [scheduleItem.day]
        : [],
    });
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  const handleView = (selectedSchedule) => {
    setApplyFilter(false);
    const filteredSchedules = schedule.filter((s) => s.name === selectedSchedule.name);
    setSchedulesToView(filteredSchedules);
    setIsViewModalOpen(true);
  };

  const handleOpenDeleteModal = (schedule) => {
    setScheduleToDelete(schedule);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteSchedule(scheduleToDelete.slot_id);
      setSchedule((prev) =>
        prev.filter((s) => s.slot_id !== scheduleToDelete.slot_id)
      );
      setSchedulesToView((prev) =>
        prev.filter((s) => s.slot_id !== scheduleToDelete.slot_id)
      );

      setToastData({
        title: 'Success',
        message: 'Schedule deleted successfully.',
        icon: DeleteIcon,
        isDelete: true,
      });
      setIsError(false);
      setShowToast(true);
      setIsDeleteModalOpen(false);
      setScheduleToDelete(null);
      setIsViewModalOpen(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastData({
        title: 'Error',
        message: error.message,
        icon: Error,
        isDelete: false,
      });
      setIsError(true);
      setShowToast(true);
      setIsDeleteModalOpen(false);
      setScheduleToDelete(null);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedSchedule(null);
    setScheduleToDelete(null);
    setSchedulesToView([]);
    setApplyFilter(false);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setIsError(false);
  };

  const handleUpdateSchedule = (updatedSchedule) => {
    setSchedule((prev) =>
      prev.map((s) =>
        s.slot_id === updatedSchedule.slot_id ? updatedSchedule : s
      )
    );
    setSchedulesToView((prev) =>
      prev.map((s) =>
        s.slot_id === updatedSchedule.slot_id ? updatedSchedule : s
      )
    );
    setToastData({
      title: 'Success',
      message: 'Schedule updated successfully.',
      icon: Success,
      isDelete: false,
    });
    setIsError(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddSchedule = (newSchedules) => {
    setSchedule((prev) => [...prev, ...newSchedules]);
    setToastData({
      title: 'Success',
      message: 'Schedule added successfully.',
      icon: Success,
      isDelete: false,
    });
    setIsError(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="layout-container">
      <div className="action-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by course"
            onChange={(e) => handleSearch(e.target.value)}
            value={searchTerm}
          />
          <img src={SearchIcon} alt="Search" className="search-img" />
        </div>
        <div className="add-btn-container">
          <button className="add-btn" onClick={handleAddBtnClick}>
            + Add Schedule
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-container1">
          <table className="scheduleList-table">
            <thead>
              <tr>
                <th>Lecture Name</th>
                <th>Course</th>
                <th>Grade</th>
                <th>Day</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Loading schedules...</td>
                </tr>
              ) : filteredSchedules.length > 0 ? (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.slot_id}>
                    <td>{schedule.name}</td>
                    <td>{schedule.course}</td>
                    <td>{schedule.grade}</td>
                    <td>{schedule.days[0] || 'N/A'}</td>
                    <td>{schedule.time}</td>
                    <td className="action-cell">
                      <button className="btn" onClick={() => handleView(schedule)}>
                        <img src={View} alt="View" />
                      </button>
                      <button className="btn" onClick={() => handleEdit(schedule)}>
                        <img src={Edit} alt="Edit" />
                      </button>
                      <button className="btn" onClick={() => handleOpenDeleteModal(schedule)}>
                        <img src={Delete} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  {/* <td colSpan="6">
                    No schedules available for {targetDay || (new Date().getHours() < 18 ? 'today' : 'tomorrow')}.
                  </td> */}
                  <td colSpan="6">
                     No schedules available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddSchedule
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        schedule={selectedSchedule}
        onUpdate={handleUpdateSchedule}
        onAdd={handleAddSchedule}
        lecturers={lecturers}
        courses={courses}
        grades={grades}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onDelete={handleDelete}
      />

      <Toast
        showToast={showToast}
        isError={isError}
        onClose={handleToastClose}
        title={toastData.title}
        message={toastData.message}
        icon={toastData.icon}
        isDelete={toastData.isDelete}
      />

      <SpecificScheduleView
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        schedules={schedulesToView}
        onEdit={handleEdit}
        onDelete={handleOpenDeleteModal}
      />
    </div>
  );
}

export default ScheduleList;
