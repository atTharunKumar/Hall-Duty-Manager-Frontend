import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './DutyScheduling.css';

const DutyScheduling = ({ cycleDays, sessionStrengths }) => {
  const [staff, setStaff] = useState([]);
  const [halls, setHalls] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [error, setError] = useState('');
  const [dutiesPerStaff, setDutiesPerStaff] = useState({
    AP1: 3,
    AP2: 2,
    AP3: 1,
    SPL: 5,
    SPL1: 0,
    SPL2: 0,
    SPL3: 0,
    // Default duty limit for Special staff
  });

 
  useEffect(() => {
    const savedSchedule = JSON.parse(localStorage.getItem('dutySchedule'));
    if (savedSchedule) {
      setSchedule(savedSchedule);
    }

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

  const saveScheduleToLocalStorage = (newSchedule) => {
    localStorage.setItem('dutySchedule', JSON.stringify(newSchedule));
  };

  const downloadPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.text('Duty Schedule', 14, 20);

    const headers = [
      ['Staff Name', ...Array.from({ length: cycleDays }, (_, i) => `Day ${i + 1} Session 1`), ...Array.from({ length: cycleDays }, (_, i) => `Day ${i + 1} Session 2`)],
    ];

    const rows = staff.map((staffMember) => {
      const row = [staffMember.name];
      for (let day = 1; day <= cycleDays; day++) {
        const dayData = schedule[staffMember.name]?.[day] || {};
        row.push(dayData.exam1 || '', dayData.exam2 || '');
      }
      return row;
    });

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { cellPadding: 2, fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold' } },
    });

    doc.save('Duty_Schedule.pdf');
  };

  const handleHallSelection = (hallId) => {
    setSelectedHalls((prevSelected) =>
      prevSelected.includes(hallId)
        ? prevSelected.filter((id) => id !== hallId)
        : [...prevSelected, hallId]
    );
  };

  const handleDutyLimitChange = (type, value) => {
    console.log(type)
    setDutiesPerStaff((prevLimits) => ({
      ...prevLimits,
      [type]: parseInt(value, 10) || 0,
    }));
  };
const generateSchedule = () => {
  console.log("Generating Schedule...");
  console.log(staff)
  // Filter only active staff
  const activeStaff = staff.filter((s) => s.designation === 'Active');
  console.log("Active Staff:", activeStaff);
  if (activeStaff.length === 0) {
    setError('No active staff available for scheduling.');
    return;
  }

  // Assign duties only to active staff
  const staffWithDuties = activeStaff.map((s) => ({
    ...s,
    assignedDuties: 0,
    maxDuties: dutiesPerStaff[s.type] || 0,
  }));

  console.log("Staff with Duties:", staffWithDuties);

  console.log("Selected Halls:", selectedHalls);
  if (selectedHalls.length === 0) {
    setError('No halls selected.');
    return;
  }

  console.log("Session Strengths:", sessionStrengths);

  const newSchedule = {};
  let needsMoreStaff = false;
  const assignedStaffRecords = {};

  const processSession = (sessionStrength, examSession, day) => {
    console.log(`Processing ${examSession} for Day ${day}, Strength: ${sessionStrength}`);

    let remainingStrength = sessionStrength;
    let hallIndex = 0;

    while (remainingStrength > 0 && hallIndex < selectedHalls.length) {
      const hall = halls.find((h) => h.id === selectedHalls[hallIndex]);
      if (!hall) {
        console.error("Hall not found:", selectedHalls[hallIndex]);
        hallIndex++;
        continue;
      }

      let hallCapacity = hall.capacity;
      console.log(`Assigning Hall: ${hall.name}, Capacity: ${hall.capacity}`);

      while (hallCapacity > 0 && remainingStrength > 0) {
        let staffAssigned = false;

        for (let i = 0; i < staffWithDuties.length; i++) {
          const staffMember = staffWithDuties[i];

          if (staffMember.assignedDuties >= staffMember.maxDuties) continue;
          if (assignedStaffRecords[day]?.[examSession]?.has(staffMember.name)) continue;

          if (!newSchedule[staffMember.name]) newSchedule[staffMember.name] = {};
          if (!newSchedule[staffMember.name][day]) newSchedule[staffMember.name][day] = {};

          newSchedule[staffMember.name][day][examSession] = hall.name;
          remainingStrength -= Math.min(60, remainingStrength, hallCapacity);
          hallCapacity -= Math.min(60, remainingStrength);

          staffMember.assignedDuties += 1;

          if (!assignedStaffRecords[day]) assignedStaffRecords[day] = {};
          if (!assignedStaffRecords[day][examSession]) assignedStaffRecords[day][examSession] = new Set();
          assignedStaffRecords[day][examSession].add(staffMember.name);

          staffAssigned = true;

          console.log(`Assigned ${staffMember.name} to ${hall.name} for ${examSession} on Day ${day}`);

          if (remainingStrength <= 0 || hallCapacity <= 0) break;
        }

        if (!staffAssigned && remainingStrength > 0) {
          needsMoreStaff = true;
          console.warn(`Not enough staff for ${examSession} on Day ${day}`);
          break;
        }
      }
      hallIndex++;
    }

    if (remainingStrength > 0) {
      needsMoreStaff = true;
    }
  };

  for (let day = 1; day <= cycleDays; day++) {
    const sessionStrength = sessionStrengths.find((item) => item.day === day) || { exam1: { strength: 0 }, exam2: { strength: 0 } };

    processSession(sessionStrength.exam1.strength, 'exam1', day);
    processSession(sessionStrength.exam2.strength, 'exam2', day);
  }

  console.log("Final Schedule:", newSchedule);

  if (needsMoreStaff) {
    setError('Need more staff or halls to cover the required duties.');
  } else {
    setError('');
    setSchedule(newSchedule);
    saveScheduleToLocalStorage(newSchedule);
  }
};
  

  return (
    <div className="duty-scheduling">
      <h2>Duty Scheduling</h2>

      <div>
        <h3>Set Duty Limits:</h3>
        {Object.entries(dutiesPerStaff).map(([type, limit]) => (
          <div key={type}>
            <label>{type}: </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => handleDutyLimitChange(type, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div>
        <h3>Select Halls:</h3>
        {halls.map((hall) => (
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
      <button onClick={downloadPDF} disabled={Object.keys(schedule).length === 0}>
        Download Schedule as PDF
      </button>
      {error && <p className="error-message">{error}</p>}

      {Object.keys(schedule).length > 0 && (
        <div>
          <h3>Generated Duty Schedule:</h3>
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
      )}
    </div>
  );
};

export default DutyScheduling;
