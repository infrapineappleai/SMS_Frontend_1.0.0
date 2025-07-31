import '../../Styles/Schedule/SpecificScheduleView.css';
import Edit from '../../assets/icons/Edit.png';
import Delete from '../../assets/icons/Delete.png';
import Close from '../../assets/icons/Close.png';

const SpecificScheduleView = ({ isOpen, onClose, schedules, onEdit, onDelete }) => {
  if (!isOpen || !schedules || schedules.length === 0) return null;

  const scheduleName = schedules[0].name;

  const expandedSchedules = schedules.flatMap(schedule => 
    schedule.days.map(day => ({
      ...schedule,
      day: day,   
       
      uniqueId: `${schedule.id}-${day}`
    }))
  );

  return (
    <div className="specific-view-modal-overlay">
      <div className="specific-view-modal-content">
        <div className="specific-view-modal-header">
          <h2>Name: {scheduleName}</h2>
          <button className="cancel-btn" onClick={onClose}>
            <img src={Close} alt="close" className="cancel-icon" />
          </button>
        </div>

        <div className="specific-schedule-table-container">
          <div className="specific-schedule-table-container1">
            <table className="specific-schedule-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expandedSchedules.map((schedule) => (
                  <tr key={schedule.uniqueId}>
                    <td>{schedule.course}</td>
                    <td>{schedule.grade}</td>
                    <td>{schedule.day}</td>
                    <td>{schedule.time}</td>
                    <td>
                      <button className="btn" onClick={() => onEdit(schedule)}>
                        <img src={Edit} alt="Edit" />
                      </button>
                      <button className="btn" onClick={() => onDelete(schedule)}>
                        <img src={Delete} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecificScheduleView;