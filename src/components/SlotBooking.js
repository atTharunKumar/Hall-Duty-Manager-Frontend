import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SlotBooking.css";

const SlotBooking = ({ setBookedSlots }) => {
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlotsLocal] = useState([]);
  const [bookedSlot, setBookedSlot] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterVenue, setFilterVenue] = useState("");

  // Duty booking
  const [dutiesToBook, setDutiesToBook] = useState(1);
  const [dutiesBookedCount, setDutiesBookedCount] = useState(0);
  const [showSlots, setShowSlots] = useState(false); // Step 2: show available slots
  const [staffLevels, setStaffLevels] = useState({});
const [selectedStaff, setSelectedStaff] = useState("");


  // Fetch slots
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/slots")
      .then((res) => setSlots(res.data))
      .catch(() => setError("Error fetching slots"));
  }, []);

  // Fetch booked slots
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/bookings")
      .then((res) => {
        setBookedSlotsLocal(res.data);
        setDutiesBookedCount(res.data.length); // Sync duties count
      })
      .catch(() => console.error("Error fetching bookings"));
  }, []);

useEffect(() => {
  axios
    .get("http://localhost:5000/api/slots/duty-limits") // fetch from duty limits endpoint
    .then((res) => {
      // res.data = { AP1: 3, AP2: 2, AP3: 1, SPL: 1 }
      setStaffLevels(res.data);
 // ["AP1","AP2","AP3","SPL"]
    })
    .catch((err) => console.error("Error fetching staff levels", err));
}, []);



useEffect(() => {
  if (!selectedStaff) return;

  setDutiesToBook(staffLevels[selectedStaff] || 0);
}, [selectedStaff, staffLevels]);



  // Utils
  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const getSession = (startTime) =>
    parseInt(startTime.split(":")[0], 10) < 12 ? "FN" : "AN";

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForFilter = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Hide slots with same date & time already booked
const isSameDateTimeBooked = (slot) => {
  return bookedSlots.some((booking) => {
    return (
      booking.slot.date_from === slot.date_from &&
      booking.slot.start_time === slot.start_time &&
      booking.slot.end_time === slot.end_time
    );
  });
};


  const venues = [...new Set(slots.map((s) => s.venue))];
  

  // Apply filters
 const filteredSlots = slots
  .filter((s) => s.available_slots > 0) // hide full slots
  .filter((s) => !isSameDateTimeBooked(s)) // ✅ USE the function here
  .filter((s) => {
    if (filterDate && formatDateForFilter(s.date_from) !== filterDate)
      return false;

    if (filterSession && getSession(s.start_time) !== filterSession)
      return false;

    if (filterVenue && s.venue !== filterVenue)
      return false;

    return true;
  });



  // Book slot
  const bookSlot = async (slot) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setError("Please login to book a slot.");
      return;
    }

    if (dutiesBookedCount >= dutiesToBook) {
      setError("You have already booked the maximum number of duties.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/bookings", {
        slotId: slot.id,
        user: {
          name: user.name,
          email: user.email,
        },
      });

      const newBooking = {
        id: res.data.bookingId,
        slot,
        user,
        bookedAt: res.data.bookedAt,
      };

      setBookedSlot(newBooking);
      setBookedSlotsLocal((prev) => [...prev, newBooking]);
      setDutiesBookedCount((prev) => prev + 1);

      if (setBookedSlots) {
        setBookedSlots((prev) => [...prev, newBooking]);
      }
    } catch {
      setError("Failed to book slot.");
    }
  };

  // Reset to book another
  const bookAnother = () => setBookedSlot(null);

  // Step 1: Enter duties
if (!showSlots && dutiesBookedCount === 0) {
  return (
    <div className="slot-booking-container">
      <h2>Select Your Staff Level</h2>
      <select
        value={selectedStaff}
        onChange={(e) => setSelectedStaff(e.target.value)}
      >
        <option value="">-- Select Staff Level --</option>
       {Object.keys(staffLevels).map((level) => (
  <option key={level} value={level}>
    {level} ({staffLevels[level]} duties)
  </option>
))}

      </select>

      <button
        className="book-duties-btn"
        disabled={!selectedStaff}
        onClick={() => setShowSlots(true)}
      >
        Continue
      </button>
    </div>
  );
}


  // After booking view
  if (bookedSlot) {
    return (
      <div className="slot-booking-container">
        <h2 className="success-title">✅ Slot Booked Successfully</h2>
        <div className="booked-card">
          <p>
            <strong>Date:</strong> {formatDate(bookedSlot.slot.date_from)}
          </p>
          <p>
            <strong>Session:</strong> {getSession(bookedSlot.slot.start_time)}
          </p>
          <p>
            <strong>Time:</strong> {formatTime(bookedSlot.slot.start_time)} –{" "}
            {formatTime(bookedSlot.slot.end_time)}
          </p>
          <p>
            <strong>Venue:</strong> {bookedSlot.slot.venue}
          </p>
          <p>
            <strong>Course:</strong> {bookedSlot.slot.courseDetails}
          </p>
        </div>

        {dutiesBookedCount < dutiesToBook ? (
          <button className="book-another" onClick={bookAnother}>
            Book Another ({dutiesBookedCount}/{dutiesToBook})
          </button>
        ) : (
          <p>All duties booked ✅</p>
        )}

        {/* Display all booked slots */}
        <h3>Your Booked Slots</h3>
        {bookedSlots.length === 0 ? (
          <p>No slots booked yet.</p>
        ) : (
          <div className="booked-slots-list">
            {bookedSlots.map((b) => (
              <div key={b.id} className="booked-card">
                <p>
                  <strong>Date:</strong> {formatDate(b.slot.date_from)}
                </p>
                <p>
                  <strong>Session:</strong> {getSession(b.slot.start_time)}
                </p>
                <p>
                  <strong>Time:</strong> {formatTime(b.slot.start_time)} –{" "}
                  {formatTime(b.slot.end_time)}
                </p>
                <p>
                  <strong>Venue:</strong> {b.slot.venue}
                </p>
                <p>
                  <strong>Course:</strong> {b.slot.courseDetails}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Show available slots
  return (
    <div className="slot-booking-container">
      <h2>Available Slots ({dutiesBookedCount}/{dutiesToBook} booked)</h2>
      {error && <p className="error">{error}</p>}

      {/* Display all booked slots above the available slots */}
      <h3>Your Booked Slots</h3>
      {bookedSlots.length === 0 ? (
        <p>No slots booked yet.</p>
      ) : (
        <div className="booked-slots-list">
          {bookedSlots.map((b) => (
            <div key={b.id} className="booked-card">
              <p>
                <strong>Date:</strong> {formatDate(b.slot.date_from)}
              </p>
              <p>
                <strong>Session:</strong> {getSession(b.slot.start_time)}
              </p>
              <p>
                <strong>Time:</strong> {formatTime(b.slot.start_time)} –{" "}
                {formatTime(b.slot.end_time)}
              </p>
              <p>
                <strong>Venue:</strong> {b.slot.venue}
              </p>
              <p>
                <strong>Course:</strong> {b.slot.courseDetails}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* FILTER BAR */}
      <div className="filter-bar">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
          <option value="">All Sessions</option>
          <option value="FN">FN</option>
          <option value="AN">AN</option>
        </select>

      

        <button
          className="clear-filter"
          onClick={() => {
            setFilterDate("");
            setFilterSession("");
            setFilterVenue("");
          }}
        >
          Clear
        </button>
      </div>

      {/* SLOT CARDS */}
      {filteredSlots.length === 0 ? (
        <p className="no-slots">No slots match your filters</p>
      ) : (
        <div className="slots-grid">
          {filteredSlots.map((slot) => (
            <div key={slot.id} className="slot-card">
              <div className="slot-top">
                <span className="date">{formatDate(slot.date_from)}</span>
                <span className="session">{getSession(slot.start_time)}</span>
              </div>

              <p className="time">
                ⏰ {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </p>

              <p className="course">🎓 {slot.courseDetails}</p>

              <button className="book-btn" onClick={() => bookSlot(slot)}>
                Book Duty
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlotBooking;
