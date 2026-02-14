import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import bit from "./../assets/image.png";
import "./BookingList.css";

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/bookings")
      .then((response) => {
        setBookings(response.data);
      })
      .catch((err) => {
        console.error("Error fetching bookings:", err);
        setError("Error fetching bookings");
      });
  }, []);

  // -------- FORMAT TIME --------
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(+hours, +minutes);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -------- FORMAT DATE FOR TABLE --------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return !isNaN(date) ? date.toLocaleDateString() : "N/A";
  };

  // -------- FORMAT DATE FOR FILTER (NO TIMEZONE ISSUE) --------
  const getFormattedDateForFilter = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  

  // -------- FILTER BOOKINGS --------

// -------- GET UNIQUE TIME SLOTS --------
const uniqueTimeSlots = [
  ...new Set(
    bookings
      .filter((b) => b.slot?.start_time && b.slot?.end_time)
      .map(
        (b) =>
          `${b.slot.start_time}-${b.slot.end_time}`
      )
  ),
];


  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = getFormattedDateForFilter(
      booking.slot?.date_from
    );

  const bookingTimeSlot =
  booking.slot?.start_time && booking.slot?.end_time
    ? `${booking.slot.start_time}-${booking.slot.end_time}`
    : "";

    const dateMatch = selectedDate
      ? bookingDate === selectedDate
      : true;

  const sessionMatch = selectedSession
  ? bookingTimeSlot === selectedSession
  : true;

    return dateMatch && sessionMatch;
  });

  // -------- DOWNLOAD PDF --------
  const downloadBookingReport = () => {
    if (filteredBookings.length === 0) {
      alert("No bookings available!");
      return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    const groupedBookings = {};

    filteredBookings.forEach((booking) => {
      const examName = booking.slot?.courseDetails || "N/A";

      const date = booking.slot?.date_from
        ? new Date(booking.slot.date_from).toLocaleDateString()
        : "N/A";

      const session =
  booking.slot?.start_time && booking.slot?.end_time
    ? `${formatTime(booking.slot.start_time)} - ${formatTime(
        booking.slot.end_time
      )}`
    : "N/A";


      const key = `${examName}_${date}_${session}`;

      if (!groupedBookings[key]) {
        groupedBookings[key] = {
          examName,
          date,
          session,
          data: [],
        };
      }

      groupedBookings[key].data.push(booking);
    });

    const groupKeys = Object.keys(groupedBookings);

    groupKeys.forEach((key, groupIndex) => {
      const group = groupedBookings[key];

      if (groupIndex !== 0) {
        doc.addPage();
      }

      // ---------------- BIT HEADER ----------------
      doc.addImage(bit, 40, 30, 50, 50);

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(
        "BANNARI  AMMAN  INSTITUTE  OF  TECHNOLOGY",
        pageWidth / 1.8,
        45,
        { align: "center" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        "An Autonomous Institution Affiliated to Anna University Chennai - Approved by AICTE - Accredited by NAAC with 'A+' Grade",
        pageWidth / 1.8,
        60,
        { align: "center" }
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        "SATHYAMANGALAM  -  638  401          ERODE   DISTRICT             TAMIL    NADU            INDIA",
        pageWidth / 1.8,
        75,
        { align: "center" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        "Ph:   04295-226001 / 221289       Fax:   04295-226668      E-mail:   stayahead@bitsathy.ac.in       Web:   www.bitsathy.ac.in",
        pageWidth / 1.8,
        90,
        { align: "center" }
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        "OFFICE OF THE CONTROLLER OF EXAMINATIONS",
        pageWidth / 2,
        105,
        { align: "center" }
      );

      doc.text(
        "FACULTY HALL DUTY ALLOTMENT",
        pageWidth / 2,
        120,
        { align: "center" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(`Exam: ${group.examName}`, 40, 150);

      doc.text(`Date: ${group.date}`, pageWidth / 2, 150, {
        align: "center",
      });

      doc.text(`Session: ${group.session}`, pageWidth - 40, 150, {
        align: "right",
      });

      const tableBody = group.data.map((booking, index) => [
        index + 1,
        booking.user?.staffId || "N/A",
        booking.user?.name || "N/A",
        booking.slot?.venue || "N/A",
        "",
      ]);

      doc.autoTable({
        startY: 180,
        theme: "grid",
        head: [
          [
            "S.No",
            "Faculty ID",
            "Faculty Name",
            "Allotted Venue",
            "Signature",
          ],
        ],
        body: tableBody,
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.6,
        },
        bodyStyles: {
          fontSize: 10,
          halign: "center",
          lineWidth: 0.6,
          textColor: [0, 0, 0],
        },
        styles: {
          font: "helvetica",
          fontSize: 10,
          lineColor: [0, 0, 0],
        },
      });
    });

    doc.save("Staff_Duty_Allotment.pdf");
  };

  return (
    <div className="booking-list-container">
      <h2>All Bookings</h2>

     {/* -------- FILTER SECTION -------- */}
<div className="filter-container">
  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    className="filter-input"
  />

 <select
  value={selectedSession}
  onChange={(e) => setSelectedSession(e.target.value)}
  className="filter-input"
>
  <option value="">Select Time Slot</option>
  {uniqueTimeSlots.map((slot, index) => {
    const [start, end] = slot.split("-");
    return (
      <option key={index} value={slot}>
        {formatTime(start)} - {formatTime(end)}
      </option>
    );
  })}
</select>


  <button
    className="download-btn"
    onClick={downloadBookingReport}
  >
    Download PDF
  </button>

  <button
    className="clear-btn"
    onClick={() => {
      setSelectedDate("");
      setSelectedSession("");
    }}
  >
    Clear Filter
  </button>
</div>


      {error && <p className="error">{error}</p>}

      {filteredBookings.length > 0 ? (
        <table className="booking-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Faculty ID</th>
              <th>Faculty Name</th>
              <th>Allotted Venue</th>
              <th>DUTY Date</th>
              <th>DUTY Time</th>
              <th>Booked At</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking, index) => {
              const slotStart = formatTime(
                booking.slot?.start_time
              );
              const slotEnd = formatTime(
                booking.slot?.end_time
              );

              return (
                <tr key={booking.id || booking.bookingId}>
                  <td>{index + 1}</td>
                  <td>{booking.user?.staffId || "N/A"}</td>
                  <td>{booking.user?.name || "N/A"}</td>
                  <td>{booking.slot?.venue || "N/A"}</td>
                  <td>
                    {formatDate(booking.slot?.date_from)}
                  </td>
                  <td>{`${slotStart} - ${slotEnd}`}</td>
                  <td>
                    {booking.bookedAt
                      ? new Date(
                          booking.bookedAt
                        ).toLocaleString()
                      : "N/A"}
                  </td>
                  <td></td>
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
