import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SlotBooking.css";

const SlotBooking = ({ setBookedSlots }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookedSlot, setBookedSlot] = useState(null);
  const [error, setError] = useState(null);

  // Fetch available slots from backend when component mounts
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

  // Helper to format time (e.g., "13:30" -> "01:30 pm")
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minute} ${ampm}`;
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    // Dummy user info; in a real app, get this from your auth or user context
    const userInfo = { name: "John Doe", email: "john@example.com" };

    try {
      const response = await axios.post("http://localhost:5000/api/bookings", {
        slotId: selectedSlotId,
        user: userInfo,
      });
      // Assume response.data returns:
      // { bookingId, bookedAt, updatedSlot }
      const { bookingId, bookedAt, updatedSlot } = response.data;
      // Find the full slot details for display purposes
      const selectedSlot = slots.find(
        (slot) => String(slot.id) === String(selectedSlotId)
      );
      // Create a normalized booking object
      const newBooking = {
        id: bookingId,
        user: userInfo,
        slot: {
          courseDetails: selectedSlot.courseDetails,
          date_from: selectedSlot.date_from,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          venue: selectedSlot.venue,
        },
        bookedAt: bookedAt,
      };

      setBookedSlot(newBooking);
      if (setBookedSlots) {
        setBookedSlots((prev) => {
          const updatedBookings = [...prev, newBooking];
          console.log("Updated bookedSlots in SlotBooking:", updatedBookings);
          return updatedBookings;
        });
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("Failed to book slot. Please try again.");
    }
  };

  if (bookedSlot) {
    // Display booked slot details in a card format
    const dateObj = new Date(bookedSlot.slot.date_from);
    const dateString = dateObj.toISOString().split("T")[0];
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
            Slot Timings
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
              const dateObj = new Date(slot.date_from);
              const dateString = dateObj.toISOString().split("T")[0];
              const start = formatTime(slot.start_time);
              const end = formatTime(slot.end_time);
              return (
                <option key={slot.id} value={slot.id}>
                  {`${slot.courseDetails} | ${dateString} (${start} - ${end}) - Available: ${slot.available_slots}`}
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
