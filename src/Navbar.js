import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const role = localStorage.getItem("role");

  return (
    <nav style={styles.nav}>
      <Link to={role === "admin" ? "/home" : "/slotbooking"} style={styles.link}>Home</Link>

      {role === 'admin' && (
        <>
          <Link to="/staffmanagement" style={styles.link}>Staff</Link>
          <Link to="/hallmanagement" style={styles.link}>Hall</Link>
          <Link to="/sessionstrength" style={styles.link}>Session</Link>
          <Link to="/dutyscheduling" style={styles.link}>Duty</Link>
          <Link to="/allot-slots" style={styles.link}>Allot Slots</Link>
          <Link to="/bookinglist" style={styles.link}>Bookings</Link>
          <Link to="/student" style={styles.link}>Students</Link>
          <Link to="/seating" style={styles.link}>Seating</Link>
          <Link to="/" style={styles.link}>Seating</Link>
          <Link to="/reports" style={styles.link}>Reports</Link>
          <Link to="/settings" style={styles.link}>Settings</Link>
          <Link to="/merge" style={styles.link}>Merged</Link>
        </>
      )}

      {role === 'faculty' && (
        <>
        <Link to="/slotbooking" style={styles.link}>Slot Booking</Link>
        <Link to="/" style={styles.link}>Logout</Link>
        </>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#333',
    padding: '10px',
    display: 'flex',
    flexWrap: 'wrap',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    marginRight: '15px',
  },
};

export default Navbar;
