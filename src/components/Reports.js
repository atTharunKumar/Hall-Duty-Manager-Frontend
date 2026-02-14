import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import bit from "./../assets/image.png";
import "./Reports.css";

const Reports = () => {
  const [halls, setHalls] = useState([]);
  const [matchedHalls, setMatchedHalls] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState("");

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/halls");
        setHalls(response.data);
        const savedSeating = JSON.parse(localStorage.getItem("storedseating")) || {};

        const hallStudentMapping = {};
        response.data.forEach((hall) => {
          if (savedSeating[hall.id]) {
            hallStudentMapping[hall.id] = savedSeating[hall.id].map((student) => ({
              ...student,
              original_subject_code: student.original_subject_code || student.subject_code,
              booklet_code: student.booklet_code || "",
              signature: ""
            }));
          }
        });

        setMatchedHalls(hallStudentMapping);
      } catch (error) {
        console.error("Error fetching halls:", error);
      }
    };

    fetchHalls();
  }, []);

  // Function to format registration numbers into proper ranges
  const formatRegistrationNumbers = (registrationNumbers) => {
    registrationNumbers.sort(); // Sort registration numbers
    let formattedNumbers = [];
    let start = registrationNumbers[0];
    let prev = registrationNumbers[0];

    for (let i = 1; i < registrationNumbers.length; i++) {
      let current = registrationNumbers[i];

      // Check continuity
      if (parseInt(current.slice(-3)) !== parseInt(prev.slice(-3)) + 1) {
        if (start === prev) {
          formattedNumbers.push(start);
        } else {
          formattedNumbers.push(`${start} to ${prev}`);
        }
        start = current;
      }
      prev = current;
    }

    // Handle last range
    if (start === prev) {
      formattedNumbers.push(start);
    } else {
      formattedNumbers.push(`${start} to ${prev}`);
    }

    return formattedNumbers.join(", ");
  };

  const generateOverallReport = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // -----------------------------------
    // A) INSTITUTE HEADER (same as hall report)
    // -----------------------------------
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
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
    doc.setFontSize(10);
    doc.text(
      "OFFICE OF THE CONTROLLER OF EXAMINATIONS",
      pageWidth / 2,
      105,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      "OPTIONAL TEST - JANUARY 2025",
      pageWidth / 2,
      120,
      { align: "center" }
    );

    // Replace "ATTENDANCE SHEET" with the overall report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      "OVERALL SEATING ARRANGEMENT",
      pageWidth / 2,
      140,
      { align: "center" }
    );

    // -----------------------------------
    // B) PREPARE TABLE DATA
    // -----------------------------------
    let tableData = [];
    let serialNo = 1;

    halls.forEach((hall) => {
      if (matchedHalls[hall.id]?.length) {
        // Group students by department for each hall
        const departmentGroups = matchedHalls[hall.id].reduce((acc, student) => {
          if (!acc[student.department]) {
            acc[student.department] = [];
          }
          acc[student.department].push(student);
          return acc;
        }, {});

        Object.entries(departmentGroups).forEach(([department, students]) => {
          const courseCodes = [
            ...new Set(students.map((student) => student.original_subject_code)),
          ].join(", ");
          const registrationNumbers = students.map(
            (student) => student.registration_number
          );
          const formattedRegNos = formatRegistrationNumbers(registrationNumbers);

          tableData.push([
            serialNo++,
            hall.name,
            `B.E. ${department}`,
            courseCodes,
            formattedRegNos,
            students.length,
          ]);
        });
      }
    });

    if (tableData.length === 0) {
      alert("No student data available for report generation.");
      return;
    }

    // -----------------------------------
    // C) DISPLAY THE TABLE
    // -----------------------------------
    // Starting the table a bit lower to give room for the header
    doc.autoTable({
      head: [
        [
          "S.No",
          "Hall No.",
          "Degree & Branch",
          "Course Code",
          "Register Nos.",
          "No. of Candidates",
        ],
      ],
      body: tableData,
      startY: 210,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "normal",
        lineWidth: 0.5,
      },
      bodyStyles: {
        fontSize: 10,
        halign: "left",
        lineWidth: 0.8,
        textColor: [0, 0, 0],
      },
      styles: {
        font: "helvetica",
        fontSize: 10,
        lineColor: [0, 0, 0],
      },
    });

    // Finally, save the PDF
    doc.save("Overall_Seating_Arrangement.pdf");
  };

  // Function to add footer content on each page for the seating report PDF
 const addFooterContent = (doc) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  const startY = pageHeight - 150; // adjust spacing from bottom

  // 1) No. of Absentees
  doc.text("No. of Absentees :", 40, startY);

  // 2) Notes
  doc.text(
    "Note 1: Candidates who are Absent must be marked ABSENT in Red ink.",
    40,
    startY + 20
  );
  doc.text(
    "     2. This sheet must be handed over to the Chief Superintendent along with Answer Books.",
    40,
    startY + 35
  );

  // 3) Footer Table
  doc.autoTable({
    startY: startY + 45,
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
      lineWidth: 0.8,
      textColor: [0, 0, 0],
    },
    styles: {
      font: "helvetica",
      fontSize: 10,
      lineColor: [0, 0, 0],
    },
    body: [
      ["S. No", "Name", "Designation & Department", "Signature with Date"],
      ["", "", "", ""],
      ["", "", "Chief Superintendent", ""],
    ],
  });
};


  const generateHallReport = (hall) => {
    // 1) Filter the students for the selected hall & department
    const students = matchedHalls[hall.id]?.filter((student) =>
      selectedDepartment ? student.department === selectedDepartment : true
    );

    if (!students || students.length === 0) {
      alert(`No student data available for ${hall.name}.`);
      return;
    }

    // 2) Prepare data for the table
    const tableBody = students.map((student, index) => [
      index + 1,
      student.registration_number || "",
      { content:  student.name || "",styles: { halign: "left" } },
      "",
      "", // Signature column empty
    ]);

    // 3) Create a new jsPDF document (A4, portrait, measured in points)
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // -----------------------------------
    // A) INSTITUTE HEADER
    // -----------------------------------
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
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
    doc.setFontSize(10);
    doc.text(
      "OFFICE OF THE CONTROLLER OF EXAMINATIONS",
      pageWidth / 2,
      105,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OPTIONAL TEST - JANUARY 2025", pageWidth / 2, 120, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ATTENDANCE SHEET", pageWidth / 2, 140, {
      align: "center",
    });

    // -----------------------------------
    // B) SHEET DETAILS
    // -----------------------------------
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const firstStudent = students[0];
    const department = firstStudent.department || "Computer Science and Engineering";
    const hallNo = hall.name || "COE";
    const courseCode = firstStudent.original_subject_code || "N/A";
    const date = firstStudent.date || "N/A";
    const session = firstStudent.session || "N/A";


    doc.text(`Degree & Branch: B.E. ${department}`, 40, 160);
    doc.text(`Hall No: ${hallNo}`, 480, 160);
    doc.text(`Course Code & Title : ${courseCode}`, 40, 175);
    doc.text(`Date & Session : ${date} & ${session} ` ,395, 175);
    doc.text("Semester : ", 40, 190);

    // -----------------------------------
    // C) MAIN TABLE WITH FOOTER ON EACH PAGE
    // -----------------------------------
    // Use didDrawPage hook to insert the footer content on each page.
    doc.autoTable({
      startY: 180,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.5,
      },
      bodyStyles: {
        fontSize: 10,
        halign: "center",
        lineWidth: 0.8,
        textColor: [0, 0, 0],
      },
      styles: {
        font: "helvetica",
        fontSize: 10,
        lineColor: [0, 0, 0],
      },
      head: [
        [
          { content: "S. No", styles: { halign: "center" } },
          { content: "Register No.", styles: { halign: "center" } },
          { content: "Name of the Candidate", styles: { halign: "center" } },
          { content: "Answer Book No.", styles: { halign: "center" } },
          { content: "Signature of the Candidate", styles: { halign: "center" } },
        ],
      ],
      body: tableBody,
   didDrawPage: () => {
  addFooterContent(doc);
},

      // Reserve space at the bottom of each page for footer content.
      margin: { bottom: 160 },
    });

    // Finally, save the PDF
    doc.save(`${hall.name}_Seating_Report.pdf`);
  };

const generateDepartmentCombinedReport = () => {
  if (!selectedDepartment) {
    alert("Please select a department first.");
    return;
  }

  const doc = new jsPDF("p", "pt", "a4");
  let firstPage = true;

  halls.forEach((hall) => {
    const students =
      matchedHalls[hall.id]?.filter(
        (student) => student.department === selectedDepartment
      ) || [];

    if (students.length === 0) return;

    if (!firstPage) {
      doc.addPage();
    }
    firstPage = false;

    const pageWidth = doc.internal.pageSize.getWidth();

    // ===============================
    // SAME HEADER (Copied from your generateHallReport)
    // ===============================
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
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
    doc.setFontSize(10);
    doc.text(
      "OFFICE OF THE CONTROLLER OF EXAMINATIONS",
      pageWidth / 2,
      105,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OPTIONAL TEST - JANUARY 2025", pageWidth / 2, 120, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ATTENDANCE SHEET", pageWidth / 2, 140, {
      align: "center",
    });

    // ===============================
    // SHEET DETAILS
    // ===============================
    const firstStudent = students[0];

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Degree & Branch: B.E. ${selectedDepartment}`, 40, 160);
    doc.text(`Hall No: ${hall.name}`, 480, 160);
    doc.text(
      `Course Code & Title : ${firstStudent.original_subject_code || "N/A"}`,
      40,
      175
    );
    doc.text(
      `Date & Session : ${firstStudent.date || "N/A"} & ${
        firstStudent.session || "N/A"
      }`,
      395,
      175
    );
    doc.text("Semester : ", 40, 190);

    // ===============================
    // TABLE
    // ===============================
    const tableBody = students.map((student, index) => [
      index + 1,
      student.registration_number || "",
      { content: student.name || "", styles: { halign: "left" } },
      "",
      "",
    ]);

    doc.autoTable({
      startY: 200,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.5,
      },
      bodyStyles: {
        fontSize: 10,
        halign: "center",
        lineWidth: 0.8,
        textColor: [0, 0, 0],
      },
      styles: {
        font: "helvetica",
        fontSize: 10,
        lineColor: [0, 0, 0],
      },
      head: [
        [
          "S. No",
          "Register No.",
          "Name of the Candidate",
          "Answer Book No.",
          "Signature of the Candidate",
        ],
      ],
      body: tableBody,
      didDrawPage: (data) => {
        addFooterContent(doc, data.cursor.y);
      },
      margin: { bottom: 191 },
    });
  });

  doc.save(`${selectedDepartment}_All_Venues_Attendance.pdf`);
};



  return (
    <div className="reports">
      <h2>Seating Reports</h2>

      <div className="filter-section">
        <label>Select Department:</label>
        <select
          onChange={(e) => setSelectedDepartment(e.target.value)}
          value={selectedDepartment}
        >
          <option value="">All</option>
          {[...new Set(Object.values(matchedHalls).flat().map((student) => student.department))].map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <button onClick={generateOverallReport}>
        Download Overall Seating Report
      </button>

      {selectedDepartment && (
  <button onClick={generateDepartmentCombinedReport}>
    Download {selectedDepartment} - All Venues Report
  </button>
)}


     {halls.length > 0 ? (
  halls.map((hall) => {
    const filteredStudents =
      matchedHalls[hall.id]?.filter((student) =>
        selectedDepartment
          ? student.department === selectedDepartment
          : true
      ) || [];

    // ❗ Skip hall if no students match filter
    if (filteredStudents.length === 0) return null;

    return (
      <div key={hall.id} className="hall-section">
        <h3>{hall.name}</h3>

        <button onClick={() => generateHallReport(hall)}>
          Download {hall.name} Report
        </button>

        <table className="students-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student Name</th>
              <th>Registration Number</th>
              <th>Department</th>
              <th>Course Code</th>
              <th>Booklet Code</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.registration_number}>
                <td>{index + 1}</td>
                <td>{student.name || "N/A"}</td>
                <td>{student.registration_number || "N/A"}</td>
                <td>{student.department || "N/A"}</td>
                <td>{student.original_subject_code || "N/A"}</td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  })
) : (
  <p>Loading halls...</p>
)}

    </div>
  );
};

export default Reports;
