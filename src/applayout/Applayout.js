import { Routes, Route, Navigate } from "react-router-dom";
import axios from 'axios';
import { useState, useEffect } from "react";
import AllotSlots from "../components/AllotSlots";
import SlotBooking from "../components/SlotBooking";
import HomePage from '../components/HomePage';
import StaffManagement from '../components/StaffManagement';
import HallManagement from '../components/HallManagement';
import DutyScheduling from '../components/DutyScheduling';
import Reports from '../components/Reports';
import Settings from '../components/Settings';
import SessionStrengthInput from '../components/SessionStrengthInput';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SeatingArrangement from '../components/SeatingArrangement';
import MergedComponent from '../components/MergedTable';
import StudentPage from "../components/StudentsPage";
import BookingList from "../components/BookingList";

const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem("role");
  const roles = role.split("||");
  return roles.includes(userRole) ? children : <Navigate to="/" />;
};

function Applayout() {
  const [cycleDays, setCycleDays] = useState(6);
  const [sessionStrengths, setSessionStrengths] = useState(
    Array.from({ length: cycleDays }, (_, i) => ({
      day: i + 1,
      exam1: { strength: '' },
      exam2: { strength: '' }
    }))
  );

  const [students, setStudents] = useState([]);
  // const [availableSlots, setAvailableSlots] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch session strengths
  useEffect(() => {
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
      .catch(error => {
        console.error('Error fetching session strengths:', error);
        setError('Failed to fetch session strengths');
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch students data
  useEffect(() => {
    axios.get("http://localhost:5000/api/students")
      .then(response => setStudents(response.data))
      .catch(error => console.error("Error fetching student data:", error));
  }, []);

  return (
    <>
     
      <Header />
      {loading ? <div>Loading...</div> : error ? <div>{error}</div> : (
        <Routes>
          <Route path="/allot-slots" element={<ProtectedRoute role="admin"><AllotSlots  /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute role="admin"><HomePage /></ProtectedRoute>} />
          <Route path="/staffmanagement" element={<ProtectedRoute role="admin"><StaffManagement /></ProtectedRoute>} />
          <Route path="/hallmanagement" element={<ProtectedRoute role="admin"><HallManagement /></ProtectedRoute>} />
          <Route path="/dutyscheduling" element={<ProtectedRoute role="admin"><DutyScheduling cycleDays={cycleDays} sessionStrengths={sessionStrengths} /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute role="admin"><Settings /></ProtectedRoute>} />
          <Route path="/sessionstrength" element={<ProtectedRoute role="admin"><SessionStrengthInput cycleDays={cycleDays} setCycleDays={setCycleDays} sessionStrengths={sessionStrengths} setSessionStrengths={setSessionStrengths} /></ProtectedRoute>} />
          <Route path="/seating" element={<ProtectedRoute role="admin"><SeatingArrangement students={students} /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute role="admin"><StudentPage students={students} setStudents={setStudents} /></ProtectedRoute>} />
          <Route path="/merge" element={<ProtectedRoute role="admin"><MergedComponent /></ProtectedRoute>} />
          <Route path="/slotbooking" element={<ProtectedRoute role="faculty"><SlotBooking  /></ProtectedRoute>} />
          <Route path="/bookinglist" element={<ProtectedRoute role="admin"><BookingList /></ProtectedRoute>} />
        </Routes>
      )}
      <Footer />
    </>
  );
}

export default Applayout;

