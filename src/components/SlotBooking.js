import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SlotBooking.css";

const SlotBooking = ({ setBookedSlots }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookedSlot, setBookedSlot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/slots")
      .then((response) => {
        setSlots(response.data);
      })
      .catch((err) => {
        console.error("Error fetching slots:", err);
        setError("Error fetching slots");
      });
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minute} ${ampm}`;
  };

  const getSession = (startTime) => {
    const hour = parseInt(startTime.split(":")[0], 10);
    return hour < 12 ? "FN" : "AN";
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) return;
  
    const userInfo = JSON.parse(localStorage.getItem("user"));
    if (!userInfo) {
      setError("User not logged in. Please login first.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/bookings", {
        slotId: selectedSlotId,
        user: {
          name: userInfo.name,
          email: userInfo.email,
        },
      });
  
      const { bookingId, bookedAt } = response.data;
      const selectedSlot = slots.find(
        (slot) => String(slot.id) === String(selectedSlotId)
      );
  
      const newBooking = {
        id: bookingId,
        user: {
          name: userInfo.name,
          email: userInfo.email,
        },
        slot: selectedSlot,
        bookedAt,
      };
  
      setBookedSlot(newBooking);
      if (setBookedSlots) {
        setBookedSlots((prev) => [...prev, newBooking]);
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("Failed to book slot. Please try again.");
    }
  };

  const formatDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString(); // Adjusts to local time zone
  };

  if (bookedSlot) {
    const dateObj = new Date(bookedSlot.slot.date_from);
    const dateString = dateObj.toLocaleDateString();
    const session = getSession(bookedSlot.slot.start_time);
    const start = formatTime(bookedSlot.slot.start_time);
    const end = formatTime(bookedSlot.slot.end_time);

    return (
      <div className="slot-booking-container">
        <h2>Booked Slot</h2>
        <div className="booked-slot-card">
          <p className="label">User</p>
          <p className="value">{bookedSlot.slot.courseDetails}</p>
          <p className="label">Duty Date</p>
          <p className="value">{dateString}</p>
          <p className="label">Session</p>
          <p className="value">{session}</p>
          <p className="label">Duty Timings</p>
          <p className="value">
            {start} to {end}
          </p>
          <p className="label">Assessment Venue</p>
          <p className="value">{bookedSlot.slot.venue}</p>
          <p className="label">Booked By</p>
          <p className="value">
            {bookedSlot.user.name} ({bookedSlot.user.email})
          </p>
          <p className="label">Booking Time</p>
          <p className="value">{new Date(bookedSlot.bookedAt).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="slot-booking-container">
      <h2>Book Slot</h2>
      {error && <p className="error">{error}</p>}
      {slots.length === 0 ? (
        <p>No available slots for booking.</p>
      ) : (
        <form onSubmit={handleBookSlot} className="slot-booking-form">
          <label htmlFor="slotSelect" className="slot-label">
            Available Slots
          </label>
          <select
            id="slotSelect"
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            required
            className="slot-select"
          >
            <option value="">Select a slot...</option>
            {slots.map((slot) => {
              const session = getSession(slot.start_time);
              const date = formatDate(slot.date_from); // Format the date correctly
              return (
                <option key={slot.id} value={slot.id}>
                  {`${date} | ${session} | ${formatTime(slot.start_time)} - ${formatTime(
                    slot.end_time
                  )}`}
                </option>
              );
            })}
          </select>
          <button type="submit" className="book-slot-button">
            Book Slot
          </button>
        </form>
      )}
    </div>
  );
};

export default SlotBooking;
