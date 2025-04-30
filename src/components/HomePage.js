import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './HomePage.css'; // Import the enhanced CSS file

const HomePage = () => {
  return (
    <div className="home-page">
     

      <section className="overview">
        
        <div className="overview-item">
          <div><h2>Hall Management</h2></div>
          <p>Keep track of hall details, including capacity and assignments.</p>
          <Link to="/hallmanagement" className="btn">Go to Hall Management</Link>
        </div>

        <div className="overview-item">
        <h2>Allot Slot</h2>
        <p>Allot Slot allows you to assign time slots and halls to students or exams based on availability and constraints.</p>
        <Link to="/allot-slots" className="btn">Go to Allot Slot</Link>
         </div>


         <div className="overview-item">
         <h2>View Bookings</h2>
         <p>View Bookings displays the list of all booked halls and assigned slots for upcoming sessions and exams.</p>
        <Link to="/bookinglist" className="btn">Go to Bookings</Link>
        </div>

       
        <div className="overview-item">
          <h2>View Student List</h2>
          <p>View Student List displays students' names, registration numbers, departments and subject code.</p>
          <Link to="/student" className="btn">Go to Student List</Link>
        </div>


        <div className="overview-item">
          <h2>Seating Arrangement</h2>
          <p>Seating Arrangements allocate students to seats based on their subjectcode and exam schedules.</p>
          <Link to="/seating" className="btn">Go to Seating Arrangement</Link>
        </div>
        <div className="overview-item">
          <h2>Reports</h2>
          <p>Access and generate reports related to hall duties and staff performance.</p>
          <Link to="/reports" className="btn">Go to Reports</Link>
        </div>
        
      </section>

      
    </div>
  );
};

export default HomePage;
