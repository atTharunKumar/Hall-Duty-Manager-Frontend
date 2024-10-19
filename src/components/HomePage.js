import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './HomePage.css'; // Import the enhanced CSS file

const HomePage = () => {
  return (
    <div className="home-page">
      <header className="header">
        <h2>Welcome to the Hall Duty Manager</h2>
        <p>Your one-stop solution for managing halls, staff, schedules, seating arrangements.</p>
      </header>

      <section className="overview">
        <div className="overview-item">
          <div className='heaaa'>
          <h2>Staff Management</h2>
          </div>
          <div className='hee2'>
          <p>Manage your staff members, including adding, editing, and viewing details.</p>
          </div>
          <div className='hee3'>
          <Link to="/staff-management" className="btn">Go to Staff Management</Link>
          </div>
        </div>
        <div className="overview-item">
          <div><h2>Hall Management</h2></div>
          <p>Keep track of hall details, including capacity and assignments.</p>
          <Link to="/hall-management" className="btn">Go to Hall Management</Link>
        </div>
        <div className="overview-item">
          <h2>Session Strength</h2>
          <p>Session strength is the number of students assigned to a specific exam session per day.</p>
          <Link to="/session-strength-input" className="btn">Go to Session Strength</Link>
        </div>
        <div className="overview-item">
          <h2>Duty Scheduling</h2>
          <p>Generate and view duty schedules for staff across different exam cycles.</p>
          <Link to="/duty-scheduling" className="btn">Go to Duty Scheduling</Link>
        </div>
        <div className="overview-item">
          <h2>View Student List</h2>
          <p>View Student List displays students' names, registration numbers, departments and subject code.</p>
          <Link to="/students" className="btn">Go to Student List</Link>
        </div>
        <div className="overview-item">
          <h2>Seating Arrangement</h2>
          <p>Seating Arrangements allocate students to seats based on their subjectcode and exam schedules.</p>
          <Link to="/SeatingArrangement" className="btn">Go to Seating Arrangement</Link>
        </div>
        <div className="overview-item">
          <h2>Reports</h2>
          <p>Access and generate reports related to hall duties and staff performance.</p>
          <Link to="/reports" className="btn">Go to Reports</Link>
        </div>
        <div className="overview-item">
          <h2>Settings</h2>
          <p>Customize the application settings according to your preferences.</p>
          <Link to="/settings" className="btn">Go to Settings</Link>
        </div>
      </section>

      
    </div>
  );
};

export default HomePage;
