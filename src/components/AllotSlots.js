import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AllotSlots.css";

const AllotSlots = () => {
  const [formData, setFormData] = useState({
    courseDetails: "",
    date_from: "",
    start_time: "",
    end_time: "",
    venue: "",
    total_slots: ""
  });
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);

  // Fetch slots from backend when component mounts
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = () => {
    axios.get("http://localhost:5000/api/slots")
      .then((response) => {
        setSlots(response.data);
      })
      .catch((err) => {
        console.error("Error fetching slots:", err);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const { courseDetails, date_from, start_time, end_time, venue, total_slots } = formData;
    if (!courseDetails || !date_from || !start_time || !end_time || !venue || !total_slots) {
      setError("Please fill in all fields.");
      return;
    }

    axios.post("http://localhost:5000/api/slots", formData)
      .then((response) => {
        // Refresh slots after successful insert
        fetchSlots();
        // Reset form
        setFormData({
          courseDetails: "",
          date_from: "",
          start_time: "",
          end_time: "",
          venue: "",
          total_slots: ""
        });
      })
      .catch((err) => {
        console.error("Error creating slot:", err);
        setError("Failed to create slot.");
      });
  };

  return (
    <div className="allot-slots-container">
      <h2>Admin Slot Management</h2>
      <form onSubmit={handleSubmit} className="allot-slots-form">
        <div className="form-row">
          <label>Course Details:</label>
          <input
            type="text"
            value={formData.courseDetails}
            onChange={(e) =>
              setFormData({ ...formData, courseDetails: e.target.value })
            }
            required
          />
        </div>
        <div className="form-row">
          <label>Date:</label>
          <input
            type="date"
            value={formData.date_from}
            onChange={(e) =>
              setFormData({ ...formData, date_from: e.target.value })
            }
            required
          />
        </div>
        <div className="form-row">
          <label>Start Time:</label>
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) =>
              setFormData({ ...formData, start_time: e.target.value })
            }
            required
          />
        </div>
        <div className="form-row">
          <label>End Time:</label>
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) =>
              setFormData({ ...formData, end_time: e.target.value })
            }
            required
          />
        </div>
        <div className="form-row">
          <label>Venue:</label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) =>
              setFormData({ ...formData, venue: e.target.value })
            }
            required
          />
        </div>
        <div className="form-row">
          <label>Total Slots:</label>
          <input
            type="number"
            value={formData.total_slots}
            onChange={(e) =>
              setFormData({ ...formData, total_slots: e.target.value })
            }
            required
          />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="upload-slot-button">
          Upload Slot
        </button>
      </form>

      <h3>Existing Slots</h3>
      {slots.length > 0 ? (
        <table className="slots-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Date</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Available/Total Slots</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.courseDetails}</td>
                <td>{slot.date_from}</td>
                <td>
                  {slot.start_time} - {slot.end_time}
                </td>
                <td>{slot.venue}</td>
                <td>
                  {slot.available_slots}/{slot.total_slots}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No slots available.</p>
      )}
    </div>
  );
};

export default AllotSlots;
