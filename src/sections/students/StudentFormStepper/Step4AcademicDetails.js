import React, { useState, useEffect } from 'react';
import '../../../Styles/Students-css/StudentFormStepper/Step4AcademicDetails.css';
import FilterIcon from '../../../assets/icons/Filter.png';
import { useToast } from '../../../modals/ToastProvider';
import { getDropdownOptions } from '../../../integration/studentAPI';
import EditIcon from '../../../assets/icons/Edit.png';
import DeleteIcon from '../../../assets/icons/Delete.png';
import successToastIcon from '../../../assets/icons/Success.png';

const Step4AcademicDetails = ({ formData, onChange, errors }) => {
  const { showToast } = useToast();

  // Remove student_no from local state
  const [scheduleInput, setScheduleInput] = useState({
    branch: formData.branch || '',
    schedule_day: formData.schedule_day || '',
    schedule_time: formData.schedule_time || '',
  });

  const [dropdownOptions, setDropdownOptions] = useState({ branches: [], slots: [] });
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const branches = await getDropdownOptions('branches');
        setDropdownOptions((prev) => ({ ...prev, branches: Array.isArray(branches) ? branches : [] }));
        if (!branches.length) {
          showToast({ title: 'Warning', message: 'No branches available.', isError: true });
        }
      } catch (error) {
        showToast({ title: 'Error', message: `Failed to load branches: ${error.message || 'Unknown error'}`, isError: true });
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [showToast]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);

        const selectedBranch = dropdownOptions.branches.find((b) => b.branch_name === scheduleInput.branch);

        if (!selectedBranch || !formData.course || !formData.grade) {
          return;
        }

        const params = {
          branchId: selectedBranch.id,
          courseId: formData.course,
          gradeId: formData.grade,
        };

        const slots = await getDropdownOptions('slots', params);
        setDropdownOptions((prev) => ({ ...prev, slots: Array.isArray(slots) ? slots : [] }));

        if (!slots.length) {
          showToast({
            title: 'Warning',
            message: 'No available slots for selected branch, course, and grade.',
            isError: true,
          });
        }
      } catch (error) {
        showToast({ title: 'Error', message: `Failed to load slots: ${error.message || 'Unknown error'}`, isError: true });
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [scheduleInput.branch, dropdownOptions.branches, formData.course, formData.grade, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'student_no') {
      // Directly update formData for student_no (no local state)
      onChange({ ...formData, student_no: value });
    } else {
      // For branch, schedule_day, schedule_time - update local state and propagate to formData
      setScheduleInput((prev) => {
        const updated = { ...prev, [name]: value };
        if (name === 'branch' || name === 'schedule_day') {
          updated.schedule_time = '';
        }
        return updated;
      });
      onChange({
        ...formData,
        [name]: value,
        schedule_time: (name === 'branch' || name === 'schedule_day') ? '' : formData.schedule_time,
      });
    }
  };

  const handleAssign = (e) => {
    e.preventDefault();
    const { branch, schedule_day, schedule_time } = scheduleInput;
    const { student_no } = formData; // get student_no from formData now

    if (!branch || !student_no || !schedule_day || !schedule_time) {
      showToast({ title: 'Error', message: 'Branch, Student ID, Schedule Day, and Schedule Time are required', isError: true });
      return;
    }
    const selectedSlot = filteredSlots.find((slot) => slot.day === schedule_day && slot.time === schedule_time);
    if (!selectedSlot) {
      showToast({ title: 'Error', message: 'Invalid slot selected', isError: true });
      return;
    }
    onChange({
      ...formData,
      branch,
      schedule_day,
      schedule_time,
      schedules: [...(formData.schedules || []), {
        id: selectedSlot.id,
        branch,
        studentId: student_no,
        day: schedule_day,
        time: schedule_time,
        course: formData.course || '',
        grade: formData.grade || '',
      }],
    });
    showToast({ title: 'Success', message: 'Schedule assigned successfully!',icon: successToastIcon });
    setScheduleInput((prev) => ({ ...prev, schedule_day: '', schedule_time: '' }));
  };

  const handleEditCourse = (id) => {
    const existing = formData.schedules.find((s) => s.id === id);
    if (existing) {
      setScheduleInput({
        branch: existing.branch,
        schedule_day: existing.day,
        schedule_time: existing.time,
      });
      const updated = formData.schedules.filter((s) => s.id !== id);
      onChange({
        ...formData,
        schedules: updated,
      });
    }
  };

  const handleDeleteCourse = (id) => {
    const updated = formData.schedules.filter((s) => s.id !== id);
    onChange({
      ...formData,
      schedules: updated,
    });
    showToast({ title: 'Deleted', message: 'Schedule deleted successfully!', isError: false,icon: successToastIcon });
  };

  const availableDays = [...new Set(
    dropdownOptions.slots
      .filter((slot) => {
        const selectedBranch = dropdownOptions.branches.find((b) => b.branch_name === scheduleInput.branch);
        return selectedBranch ? String(slot.branch_id) === String(selectedBranch.id) : false;
      })
      .map((slot) => slot.day),
  )].sort();

  const filteredSlots = dropdownOptions.slots.filter((slot) => {
    const selectedBranch = dropdownOptions.branches.find((b) => b.branch_name === scheduleInput.branch);
    const matchesBranch = selectedBranch ? String(slot.branch_id) === String(selectedBranch.id) : false;
    const matchesDay = scheduleInput.schedule_day ? slot.day === scheduleInput.schedule_day : true;
    return matchesBranch && matchesDay && slot.time && slot.day;
  });

  return (
    <div className="step-four-fields">
      <h3 className="section-header">Academic Details</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Branch</label>
          <div className="input-icon-container">
            <select
              name="branch"
              className="input-box with-icon"
              value={scheduleInput.branch}
              onChange={handleInputChange}
              disabled={loadingBranches}
            >
              <option value="">Select Branch</option>
              {dropdownOptions.branches.map((branch) => (
                <option key={branch.id} value={branch.branch_name}>{branch.branch_name}</option>
              ))}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
          {errors.branch && <span className="error">{errors.branch}</span>}
        </div>
        <div className="form-group">
          <label className="input-label">Student ID</label>
          <input
            name="student_no"
            type="text"
            className="input-box"
            value={formData.student_no}
            placeholder="e.g. ST-001"
            onChange={handleInputChange}
          />
          {errors.student_no && <span className="error">{errors.student_no}</span>}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Schedule Day</label>
          <div className="input-icon-container">
            <select
              name="schedule_day"
              className="input-box with-icon"
              value={scheduleInput.schedule_day}
              onChange={handleInputChange}
              disabled={loadingSlots}
            >
              <option value="">Select Day</option>
              {availableDays.length > 0 ? (
                availableDays.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))
              ) : (
                <option value="" disabled>No available days for selected branch</option>
              )}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
          {errors.schedule_day && <span className="error">{errors.schedule_day}</span>}
        </div>
        <div className="form-group">
          <label className="input-label">Schedule Time</label>
          <div className="input-icon-container">
            <select
              name="schedule_time"
              className="input-box with-icon"
              value={scheduleInput.schedule_time}
              onChange={handleInputChange}
              disabled={loadingSlots || !scheduleInput.schedule_day}
            >
              <option value="">Select Time</option>
              {filteredSlots.length > 0 ? (
                filteredSlots.map((slot) => (
                  <option key={slot.id} value={slot.time}>{slot.time}</option>
                ))
              ) : (
                <option value="" disabled>No slots available</option>
              )}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
          {errors.schedule_time && <span className="error">{errors.schedule_time}</span>}
        </div>
      </div>
      <button
        type="button"
        className="assign-btn"
        onClick={handleAssign}
        disabled={!scheduleInput.branch || !formData.student_no || !scheduleInput.schedule_day || !scheduleInput.schedule_time}
      >
        Assign Schedule
      </button>
      {errors.schedules && <p className="error-msg">{errors.schedules}</p>}
      {formData.schedules?.length > 0 ? (
        <div className="assigned-table-wrapper">
          <table className="assigned-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Student ID</th>
                <th>Day</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.schedules.map(({ id, branch, studentId, day, time }) => (
                <tr key={id}>
                  <td>{branch}</td>
                  <td>{studentId}</td>
                  <td>{day}</td>
                  <td>{time}</td>
                  <td>
                    <img
                      src={EditIcon}
                      alt="Edit"
                      className="icon-btn edit-icon"
                      onClick={() => handleEditCourse(id)}
                    />
                    <img
                      src={DeleteIcon}
                      alt="Delete"
                      className="icon-btn delete-icon"
                      onClick={() => handleDeleteCourse(id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="error-msg">No schedules assigned.</p>
      )}
    </div>
  );
};

export default Step4AcademicDetails;
