import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BookingList.css";

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/bookings")
      .then((response) => {
        console.log("Fetched bookings:", response.data);
        setBookings(response.data);
        setFilteredBookings(response.data);
      })
      .catch((err) => {
        console.error("Error fetching bookings:", err);
        setError("Error fetching bookings");
      });
  }, []);

  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
    const searchText = e.target.value.toLowerCase();
    setFilteredBookings(
      bookings.filter((booking) =>
        booking.user?.name.toLowerCase().includes(searchText) ||
        booking.user?.email.toLowerCase().includes(searchText) ||
        booking.slot?.courseDetails.toLowerCase().includes(searchText)
      )
    );
  };

  return (
    <div className="booking-list-container">
      <h2>All Bookings</h2>
      <input
        type="text"
        placeholder="Filter by name, email, or slot"
        value={filterText}
        onChange={handleFilterChange}
        className="filter-input"
      />
      {error && <p className="error">{error}</p>}
      {filteredBookings.length > 0 ? (
        <table className="booking-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Slot</th>
              <th>Booked At</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => {
              const userName = booking.user?.name || "N/A";
              const userEmail = booking.user?.email || "N/A";
              const courseDetails =
                booking.slot?.courseDetails ||
                booking.courseDetails ||
                "N/A";
              const dateFrom =
                booking.slot?.date_from || booking.date_from || "N/A";
              const bookedAt = booking.bookedAt
                ? new Date(booking.bookedAt).toLocaleString()
                : "N/A";

              return (
                <tr key={booking.id || booking.bookingId}>
                  <td>{userName}</td>
                  <td>{userEmail}</td>
                  <td>{courseDetails} on {dateFrom}</td>
                  <td>{bookedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No bookings available.</p>
      )}
    </div>
  );
};

export default BookingList;