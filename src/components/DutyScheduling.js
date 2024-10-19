import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DutyScheduling.css';

const DutyScheduling = ({ cycleDays, sessionStrengths }) => {
  const [staff, setStaff] = useState([]);
  const [halls, setHalls] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const staffResponse = await axios.get('http://localhost:5000/api/staff');
        setStaff(staffResponse.data);

        const hallsResponse = await axios.get('http://localhost:5000/api/halls');
        setHalls(hallsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const convertToCSV = (data) => {
    const header = ['Staff Name', ...Array.from({ length: cycleDays }, (_, i) => `Day ${i + 1} Session 1,Day ${i + 1} Session 2`)];
    const rows = staff.map(staffMember => {
      const row = [staffMember.name];
      for (let day = 1; day <= cycleDays; day++) {
        const dayData = data[staffMember.name]?.[day] || {};
        row.push(dayData.exam1 || '', dayData.exam2 || '');
      }
      return row;
    });

    return [header, ...rows].map(e => e.join(',')).join('\n');
  };

  const downloadCSV = () => {
    const csvData = convertToCSV(schedule);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'schedule.csv';
    link.click();
  };

  const handleHallSelection = (hallId) => {
    setSelectedHalls(prevSelected =>
      prevSelected.includes(hallId)
        ? prevSelected.filter(id => id !== hallId)
        : [...prevSelected, hallId]
    );
  };

  const generateSchedule = () => {
    const dutiesPerStaff = {
      AP1: 3,
      AP2: 2,
      AP3: 1,
    };

    const staffWithDuties = staff.map(s => ({
      ...s,
      assignedDuties: 0,
      maxDuties: dutiesPerStaff[s.type] || 0,
    }));

    const newSchedule = {};
    let needsMoreStaff = false;

    const assignedStaffRecords = {};

    const processSession = (sessionStrength, examSession, day) => {
      let remainingStrength = sessionStrength;
      let hallIndex = 0;

      while (remainingStrength > 0 && hallIndex < selectedHalls.length) {
        const hall = halls.find(h => h.id === selectedHalls[hallIndex]);
        let hallCapacity = hall ? hall.capacity : 0;

        while (hallCapacity > 0 && remainingStrength > 0) {
          let staffAssigned = false;

          // Assign staff members based on session strength and hall capacity
          for (let i = 0; i < staffWithDuties.length; i++) {
            const staffMember = staffWithDuties[i];

            // Skip staff if they've reached their maximum duty limit
            if (staffMember.assignedDuties >= staffMember.maxDuties) continue;

            // If the staff member is already assigned this session, skip
            if (assignedStaffRecords[day]?.[examSession]?.has(staffMember.name)) continue;

            if (!newSchedule[staffMember.name]) {
              newSchedule[staffMember.name] = {};
            }
            if (!newSchedule[staffMember.name][day]) {
              newSchedule[staffMember.name][day] = {};
            }

            // Assign only the hall name
            newSchedule[staffMember.name][day][examSession] = hall.name;
            remainingStrength -= Math.min(60, remainingStrength, hallCapacity); // Reduce remaining session strength
            hallCapacity -= Math.min(60, remainingStrength); // Reduce hall capacity

            staffMember.assignedDuties += 1;

            if (!assignedStaffRecords[day]) {
              assignedStaffRecords[day] = {};
            }
            if (!assignedStaffRecords[day][examSession]) {
              assignedStaffRecords[day][examSession] = new Set();
            }
            assignedStaffRecords[day][examSession].add(staffMember.name);

            staffAssigned = true;

            // Stop assigning if there are no more students in the session
            if (remainingStrength <= 0 || hallCapacity <= 0) break;
          }

          if (!staffAssigned && remainingStrength > 0) {
            needsMoreStaff = true; // If no staff were assigned but strength remains, flag more staff needed
            break;
          }
        }
        hallIndex++; // Move to the next hall for remaining students
      }

      if (remainingStrength > 0) {
        needsMoreStaff = true; // If session strength remains unallocated after all halls are processed
      }
    };

    for (let day = 1; day <= cycleDays; day++) {
      const sessionStrength = sessionStrengths.find(item => item.day === day) || { exam1: { strength: 0 }, exam2: { strength: 0 } };

      let remainingStrengthExam1 = sessionStrength.exam1.strength;
      let remainingStrengthExam2 = sessionStrength.exam2.strength;

      // Process sessions by dividing strength by hall capacity and 60 students per staff
      processSession(remainingStrengthExam1, 'exam1', day);
      processSession(remainingStrengthExam2, 'exam2', day);
    }

    if (needsMoreStaff) {
      setError('Need more staff or halls to cover the required duties.');
    } else {
      setError('');
      setSchedule(newSchedule);
    }
  };

  return (
    <div className="duty-scheduling">
      <h2>Duty Scheduling</h2>
      <div>
        <h3>Select Halls:</h3>
        {halls.map(hall => (
          <div key={hall.id}>
            <input
              type="checkbox"
              checked={selectedHalls.includes(hall.id)}
              onChange={() => handleHallSelection(hall.id)}
            />
            <label>{hall.name} (Capacity: {hall.capacity})</label>
          </div>
        ))}
      </div>
      <button onClick={generateSchedule}>Generate Schedule</button>
      <button onClick={downloadCSV} disabled={Object.keys(schedule).length === 0}>
        Download Schedule
      </button>
      {error && <p className="error-message">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Staff Name</th>
            {Array.from({ length: cycleDays }, (_, i) => (
              <React.Fragment key={i}>
                <th colSpan="2">Day {i + 1}</th>
              </React.Fragment>
            ))}
          </tr>
          <tr>
            <th></th>
            {Array.from({ length: cycleDays }, (_, i) => (
              <>
                <th key={`day${i + 1}Session1`}>Session 1</th>
                <th key={`day${i + 1}Session2`}>Session 2</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((staffMember) => (
            <tr key={staffMember.name}>
              <td>{staffMember.name}</td>
              {Array.from({ length: cycleDays }, (_, i) => {
                const day = i + 1;
                const session1 = schedule[staffMember.name]?.[day]?.exam1 || '';
                const session2 = schedule[staffMember.name]?.[day]?.exam2 || '';
                return (
                  <>
                    <td key={`day${day}Session1`}>{session1}</td>
                    <td key={`day${day}Session2`}>{session2}</td>
                  </>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DutyScheduling;
