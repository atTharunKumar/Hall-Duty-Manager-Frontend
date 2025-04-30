import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BookingList.css";

// Format time (e.g., "10:00:00" -> "10:00 AM")
const formatTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return "N/A";
  const [hours, minutes] = timeStr.split(":");
  if (!hours || !minutes) return "N/A";
  const date = new Date();
  date.setHours(+hours, +minutes);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date (e.g., "2024-04-30" -> "04/30/2024")
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return !isNaN(date) ? date.toLocaleDateString() : "N/A";
};

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/bookings")
      .then((response) => {
        console.log("Raw data from backend:", response.data);
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

              // Format the slot's date and time
              const dateFrom = formatDate(booking.slot?.date_from);
              const startTime = formatTime(booking.slot?.start_time);
              const endTime = formatTime(booking.slot?.end_time);
              const bookedAt = booking.bookedAt
                ? new Date(booking.bookedAt).toLocaleString()
                : "N/A";

              return (
                <tr key={booking.id || booking.bookingId}>
                  <td>{userName}</td>
                  <td>{userEmail}</td>
                  <td>{`${dateFrom} from ${startTime} to ${endTime}`}</td>
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
