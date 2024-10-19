import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';

import HomePage from './components/HomePage';
import StaffManagement from './components/StaffManagement';
import HallManagement from './components/HallManagement';
import DutyScheduling from './components/DutyScheduling';
import Reports from './components/Reports';
import Settings from './components/Settings';
import SessionStrengthInput from './components/SessionStrengthInput';
import Header from './components/Header';
import Footer from './components/Footer';
import SeatingArrangement from './components/SeatingArrangement';
import StudentsPage from './components/StudentsPage'; // Import the StudentsPage component

const App = () => {
  const [cycleDays, setCycleDays] = useState(6);
  const [sessionStrengths, setSessionStrengths] = useState(
    Array.from({ length: cycleDays }, (_, i) => ({
      day: i + 1,
      exam1: { strength: '' },
      exam2: { strength: '' }
    }))
  );

  useEffect(() => {
    // Fetch initial session strengths from the server
    axios.get('http://localhost:5000/api/session-strengths')
      .then(response => {
        const fetchedStrengths = response.data;
        const formattedStrengths = fetchedStrengths.map(item => ({
          day: item.day || 1,
          exam1: { strength: item.exam1_strength || '' },
          exam2: { strength: item.exam2_strength || '' }
        }));
        setSessionStrengths(formattedStrengths);
        setCycleDays(formattedStrengths.length);
      })
      .catch(error => console.error('Error fetching session strengths:', error));
  }, []);

  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/hall-management" element={<HallManagement />} />
          <Route
            path="/duty-scheduling"
            element={<DutyScheduling cycleDays={cycleDays} sessionStrengths={sessionStrengths} />}
          />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/session-strength-input"
            element={
              <SessionStrengthInput
                cycleDays={cycleDays}
                setCycleDays={setCycleDays}
                sessionStrengths={sessionStrengths}
                setSessionStrengths={setSessionStrengths}
              />
            }
          />
          <Route
            path="/SeatingArrangement"
            element={
              <SeatingArrangement rows={4} cols={4} /> // Ensure correct props are passed if needed
            }
          />
          <Route
            path="/students"
            element={<StudentsPage />} // Add the route for StudentsPage
          />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
