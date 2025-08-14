import React, { useState, useEffect } from "react";
import '../../Styles/Dashboard/dashborad.css'
import FilterIcon from "../../assets/icons/Filter.png";
import { fetchDashboardSchedule } from "../../integration/dashboardApi";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch schedule from backend API
  useEffect(() => {
    const getSchedule = async () => {
      try {
        const data = await fetchDashboardSchedule();
        setSchedule(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getSchedule();
  }, []);

  const getLocations = () => ["All", ...Object.keys(schedule)];

const getTotalStudents = () => {
  const students = selectedLocation === "All"
    ? Object.values(schedule)
        .flatMap(branch =>
          Object.values(branch).flatMap(timeSlot =>
            Object.values(timeSlot).flat()
          )
        )
    : Object.values(schedule[selectedLocation] || {})
        .flatMap(timeSlot => Object.values(timeSlot).flat());
  return new Set(students.map(student => student.name)).size;
};

  const getCurrentSchedule = () => {
    if (selectedLocation === "All") {
      const merged = {};
      Object.keys(schedule).forEach(branch => {
        Object.keys(schedule[branch]).forEach(timeSlot => {
          if (!merged[timeSlot]) merged[timeSlot] = {};
          Object.keys(schedule[branch][timeSlot]).forEach(day => {
            if (!merged[timeSlot][day]) merged[timeSlot][day] = [];
            merged[timeSlot][day].push(...schedule[branch][timeSlot][day]);
          });
        });
      });
      return merged;
    }
    return schedule[selectedLocation] || {};
  };

const renderCalendarBody = () => {
  const currentSchedule = getCurrentSchedule();

  const timeSlots = Object.keys(currentSchedule).sort((a, b) => {
    const getMinutes = (timeRange) => {
      const startTime = timeRange.split("-")[0].trim();
      const [time, modifier] = startTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return hours * 60 + (minutes || 0);
    };
    return getMinutes(a) - getMinutes(b);
  });

  return timeSlots.map(time => (
    <div key={time} className="time-row">
      <div className="time-label">{time}</div>
      {days.map(day => {
        const students = currentSchedule[time]?.[day] || [];
        const visibleStudents = students.slice(0, 5);
        const extraCount = students.length - visibleStudents.length;

        return (
          <div key={day} className="day-cell">
            {visibleStudents.map((student, idx) => (
              <div className="student-info" key={idx}>
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="student-img"
                />
                <div className="student-name2">{student.name}</div>
              </div>
            ))}
            {extraCount > 0 && <div className="more-btn">+ {extraCount} more</div>}
          </div>
        );
      })}
    </div>
  ));
};


  if (loading) return <div>Loading...</div>;

  return (
    <div className="app">
      <div className="header">
        <div className="custom-select-container">
          <div className="custom-select-wrapper">
            <select
              className="custom-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {getLocations().map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <img src={FilterIcon} alt="Filter Icon" className="filter-icon" />
          </div>
        </div>
        <div className="total-students">Total Students - {getTotalStudents()}</div>
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <div className="time-slot-header">Time</div>
          {days.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        <div className="calendar-body">{renderCalendarBody()}</div>
      </div>
    </div>
  );
}

export default Dashboard;