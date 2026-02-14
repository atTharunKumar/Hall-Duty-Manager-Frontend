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
    total_slots: "",
    studentsPerSlot: ""
  });

  const [dutyLimits, setDutyLimits] = useState({
  AP1: "",
  AP2: "",
  AP3: "",
  SPL: ""
});


  const [timeMode, setTimeMode] = useState("");
  const [createMode, setCreateMode] = useState("single"); // single | all
  const [error, setError] = useState(null);

  const [slots, setSlots] = useState([]);
  const [halls, setHalls] = useState([]);
  const [skipCount, setSkipCount] = useState(0);

  const fetchDutyLimits = () => {
  axios
    .get("http://localhost:5000/api/slots/duty-limits")
    .then((res) => {
      setDutyLimits(res.data);
    })
    .catch((err) => console.error(err));
};



useEffect(() => {
  fetchSlots();
  fetchHalls();
  fetchDutyLimits();   // 🔥 add this
}, []);


  // Fetch slots
  const fetchSlots = () => {
    axios
      .get("http://localhost:5000/api/slots")
      .then((res) => setSlots(res.data))
      .catch((err) => console.error(err));
  };

  // Fetch halls
  const fetchHalls = () => {
    axios
      .get("http://localhost:5000/api/halls")
      .then((res) => setHalls(res.data))
      .catch((err) => console.error(err));
  };

  const storedSeating =
  JSON.parse(localStorage.getItem("storedseating")) || {};

const hallsWithStudents = halls.filter((hall) => {
  return (
    storedSeating[hall.id] &&
    storedSeating[hall.id].length > 0
  );
});


const availableHalls = hallsWithStudents.filter((hall) => {

  return !slots.some((slot) => {

    const d = new Date(slot.date_from);

    const slotDateFormatted =
      String(d.getDate()).padStart(2, "0") + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      d.getFullYear();

    const selectedDate = (() => {
      if (!formData.date_from) return "";
      const parts = formData.date_from.split("-");
      return parts[2] + "-" + parts[1] + "-" + parts[0];
    })();

    return (
      slot.venue === hall.name &&
      slotDateFormatted === selectedDate &&
      slot.start_time.slice(0, 5) === formData.start_time &&
      slot.end_time.slice(0, 5) === formData.end_time
    );
  });
});


  const handleSubmit = async (e) => {
     setSkipCount(0);
    e.preventDefault();
    setError(null);
   


    const {
      courseDetails,
      date_from,
      start_time,
      end_time,
      venue,
      total_slots,
      studentsPerSlot
    } = formData;

    if (!courseDetails || !date_from || !start_time || !end_time) {
      setError("Please fill all common fields.");
      return;
    }

    try {
      // 🔹 SINGLE VENUE MODE
      if (createMode === "single") {
        if (!venue || !total_slots) {
          setError("Venue and total slots are required.");
          return;
        }

        await axios.post("http://localhost:5000/api/slots", {
          courseDetails,
          date_from,
          start_time,
          end_time,
          venue,
          total_slots
        });
      }

      // 🔹 ALL VENUES MODE
 if (createMode === "all") {
  if (!studentsPerSlot) {
    setError("Students per staff is required.");
    return;
  }

  let skipped = 0;
  let created = 0;

  const requests = halls.map((hall) => {

    const alreadyExists = slots.some((slot) => {
      const slotDateObj = new Date(slot.date_from);
      const selectedDateObj = new Date(date_from);

      const sameDate =
        slotDateObj.getFullYear() === selectedDateObj.getFullYear() &&
        slotDateObj.getMonth() === selectedDateObj.getMonth() &&
        slotDateObj.getDate() === selectedDateObj.getDate();

      const sameTime =
        slot.start_time.slice(0, 5) === start_time &&
        slot.end_time.slice(0, 5) === end_time;

      return (
        slot.venue === hall.name &&
        sameDate &&
        sameTime
      );
    });

    if (alreadyExists) {
      skipped++;
      return null;
    }

    const calculatedSlots = Math.floor(
      hall.capacity / studentsPerSlot
    );

    if (calculatedSlots <= 0) return null;

    created++;

    return axios.post("http://localhost:5000/api/slots", {
      courseDetails,
      date_from,
      start_time,
      end_time,
      venue: hall.name,
      total_slots: calculatedSlots
    });
  });

  await Promise.all(requests.filter(Boolean));

  setSkipCount(skipped);

  if (created === 0) {
    setError("All venues already have slots for this date & time.");
  }
}
      fetchSlots();
      setFormData({
        courseDetails: "",
        date_from: "",
        start_time: "",
        end_time: "",
        venue: "",
        total_slots: "",
        studentsPerSlot: ""
      });
      setTimeMode("");
      setCreateMode("single");
    } catch (err) {
      setError("Failed to create slots.");
    }
  };

 const allHallsAlreadyCreated =
  createMode === "all" &&
  formData.date_from &&
  formData.start_time &&
  formData.end_time &&
  halls.length > 0 &&
  halls.every((hall) =>
    slots.some((slot) => {
      const slotDate = new Date(slot.date_from).toISOString().split("T")[0];
      const selectedDate = formData.date_from;

      return (
        slot.venue === hall.name &&
        slotDate === selectedDate &&
        slot.start_time.slice(0, 5) === formData.start_time &&
        slot.end_time.slice(0, 5) === formData.end_time
      );
    })
  );

const getPredefinedSlots = () => {
  const exam = formData.courseDetails;

  if (exam === "PT1" || exam === "PT2") {
    return [
      { label: "9:00 AM – 10:30 AM", start: "09:00", end: "10:30" },
      { label: "1:30 PM – 3:00 PM", start: "13:30", end: "15:00" }
    ];
  }

  if (exam === "Optional") {
    return [
      { label: "9:00 AM – 10:30 AM", start: "09:00", end: "10:30" },
      { label: "11:00 AM – 12:30 PM", start: "11:00", end: "12:30" },
      { label: "1:00 PM – 2:30 PM", start: "13:00", end: "14:30" },
      { label: "3:00 PM – 4:30 PM", start: "15:00", end: "16:30" }
    ];
  }

  if (exam === "End Semester") {
    return [
      { label: "9:00 AM – 12:00 PM", start: "09:00", end: "12:00" },
      { label: "1:15 PM – 4:15 PM", start: "13:15", end: "16:15" }
    ];
  }

  return [];
};


  return (
    <div className="allot-slots-container">
      <h2>Admin Slot Management</h2>

      <form onSubmit={handleSubmit} className="allot-slots-form">
        {/* Course */}
        <div className="form-row">
          <label>Exam:</label>
          <select
            value={formData.courseDetails}
            onChange={(e) =>
              setFormData({ ...formData, courseDetails: e.target.value })
            }
            required
          >
            <option value="">Select</option>
            <option value="PT1">PT1</option>
            <option value="PT2">PT2</option>
            <option value="End Semester">End Semester</option>
            <option value="Optional">Optional</option>
          </select>
        </div>

        {/* Date */}
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

        {/* Create Mode */}
        <div className="form-row">
          <label>Create Mode:</label>
          <select
            value={createMode}
            onChange={(e) => setCreateMode(e.target.value)}
          >
            <option value="single">Single Venue</option>
            <option value="all">Create slots for all venues</option>
          </select>
        </div>

        {/* Time Type */}
        <div className="form-row">
          <label>Time Type:</label>
          <select
            value={timeMode}
            onChange={(e) => {
              setTimeMode(e.target.value);
              setFormData({ ...formData, start_time: "", end_time: "" });
            }}
            required
          >
            <option value="">Select</option>
            <option value="predefined">Predefined</option>
            
          </select>
        </div>

        {/* Predefined Time */}
      {timeMode === "predefined" && (
  <div className="form-row">
    <label>Time Slot:</label>
    <select
      value={`${formData.start_time}-${formData.end_time}`}
      onChange={(e) => {
        const [start, end] = e.target.value.split("-");
        setFormData({
          ...formData,
          start_time: start,
          end_time: end
        });
      }}
      required
    >
      <option value="">Select</option>

      {getPredefinedSlots().map((slot, index) => (
        <option
          key={index}
          value={`${slot.start}-${slot.end}`}
        >
          {slot.label}
        </option>
      ))}
    </select>
  </div>
)}


        {/* Manual Time */}
        {timeMode === "manual" && (
          <>
            <div className="form-row">
              <label>Start:</label>
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
              <label>End:</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {/* Single Venue */}
        {createMode === "single" && (
          <>
            <div className="form-row">
              <label>Venue:</label>
              <select
  value={formData.venue}
  onChange={(e) =>
    setFormData({ ...formData, venue: e.target.value })
  }
  required
>
  <option value="">Select Venue</option>

  {availableHalls.map((hall) => (
    <option key={hall.id} value={hall.name}>
      {hall.name} (Cap: {hall.capacity})
    </option>
  ))}
</select>

            </div>

            <div className="form-row">
              <label>Total Staff:</label>
              <input
                type="number"
                value={formData.total_slots}
                onChange={(e) =>
                  setFormData({ ...formData, total_slots: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {/* All Venues */}
        {createMode === "all" && (
          <div className="form-row">
            <label>Students per Staff:</label>
            <input
              type="number"
              value={formData.studentsPerSlot}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  studentsPerSlot: e.target.value
                })
              }
              required
            />
          </div>
        )}



        
        {error && <p className="error">{error}</p>}

{createMode === "all" && skipCount > 0 && (
  <p className="info-message">
    {skipCount} venue(s) skipped (already exists)
  </p>
)}



       <button
  type="submit"
  className="upload-slot-button"
  disabled={allHallsAlreadyCreated}
>

          Upload Slot
        </button>
      </form>

{/* 🔹 Duty Limits Card */}
<div className="duty-card">
  <h3>Staff Duty Limits</h3>

  <div className="duty-limits-container">
    {Object.keys(dutyLimits).map((level) => (
      <div key={level} className="form-row">
        <label>{level} Max Duties:</label>
        <input
          type="number"
          min="0"
          value={dutyLimits[level]}
          onChange={(e) =>
            setDutyLimits({
              ...dutyLimits,
              [level]: e.target.value
            })
          }
        />
      </div>
    ))}

    <button
      type="button"
      className="save-duty-button"
      onClick={async () => {
        try {
          await axios.post(
            "http://localhost:5000/api/slots/duty-limits",
            dutyLimits
          );
          alert("Duty limits updated successfully");
        } catch {
          alert("Failed to update duty limits");
        }
      }}
    >
      Save Duty Limits
    </button>
  </div>
</div>


      <h3>Existing Slots</h3>

      {slots.length > 0 ? (
        <table className="slots-table">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Date</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Available / Total</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.courseDetails}</td>
                <td>
  {new Date(slot.date_from).toLocaleDateString("en-GB")}
</td>

                <td>{slot.start_time} - {slot.end_time}</td>
                <td>{slot.venue}</td>
                <td>{slot.available_slots}/{slot.total_slots}</td>
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
//tharun kumar