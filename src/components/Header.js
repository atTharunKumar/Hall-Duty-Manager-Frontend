import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Custom styles if needed

const Header = () => {
  const role = localStorage.getItem("role");

  return (
    <header>
      <h1>Hall Duty Manager</h1>
      <nav>
        <Link to={role === "admin" ? "/home" : "/slotbooking"}>Home</Link>

        {role === "admin" && (
          <>
          {/* <Link to="/staffmanagement">Staff</Link> */}
            <Link to="/hallmanagement">Hall</Link>
            {/* <Link to="/sessionstrength">Session</Link> */}
            {/* <Link to="/dutyscheduling">Duty</Link> */}
            <Link to="/allot-slots">Allot Slots</Link>
            <Link to="/bookinglist">Bookings</Link>
            <Link to="/student">Students</Link>
            <Link to="/seating">Seating</Link>
            <Link to="/reports">Reports</Link>
            {/* <Link to="/settings">Settings</Link> */}
            {/* <Link to="/merge">Merged</Link> */}
            <Link to="/">Logout</Link>
          </>
        )}

        {role === "faculty" && (
          <>
            <Link to="/slotbooking">Slot Booking</Link>
            <Link to="/">Logout</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
