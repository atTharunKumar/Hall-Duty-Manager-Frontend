import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';  // Import the CSS file


const Header = () => {
  return (
    <header>
      <h1>Hall Duty Manager</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/staff-management">Staff</Link>
        <Link to="/hall-management">Halls</Link>
        <Link to="/Session-Strength-Input">SessionStrength</Link>
        <Link to="/duty-scheduling">Schedule</Link>
        <Link to="/students">View Student List</Link>
        <Link to="/SeatingArrangement">SeatingArrangement</Link>
        <Link to="/reports">Reports</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/mergedTable">SessionDetails</Link>
        <Link to="/SlotBooking">SlotBookingpage</Link>
        <Link to="/AllotSlots">AllotSlotspage</Link>
        <Link to="/BookingList">Booking</Link>
      </nav>
    </header>
  );
};

export default Header;
