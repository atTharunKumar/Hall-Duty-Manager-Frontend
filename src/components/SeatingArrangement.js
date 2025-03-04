import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import bit from "./../assets/image.png";
import "./SeatingArrangement.css";

const SeatingArrangement = ({ students }) => {
  const [halls, setHalls] = useState([]);
  const [seatingGrids, setSeatingGrids] = useState({});
  const [commonCourseGroups, setCommonCourseGroups] = useState([]);
  const [hallDetails, setHallDetails] = useState({});

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const hallResponse = await axios.get("http://localhost:5000/api/halls");

        // Load saved common course groups from local storage
        const savedGroups = JSON.parse(localStorage.getItem("commonCourseGroups")) || [];
        setCommonCourseGroups(savedGroups);

        // Normalize student subject codes based on common course groups
        const updatedStudents = students.map((student) => {
          for (let i = 0; i < savedGroups.length; i++) {
            if (savedGroups[i].includes(student.subject_code)) {
              return {
                ...student,
                original_subject_code: student.subject_code,
                subject_code: `GROUP_${i + 1}`,
              };
            }
          }
          return student;
        });

        setHalls(hallResponse.data);
        const grids = generateSeatingArrangement(hallResponse.data, updatedStudents);
        setSeatingGrids(grids);
      } catch (error) {
        console.error("Error fetching halls data:", error);
      }
    };

    if (students && students.length > 0) {
      fetchHalls();
    }
  }, [students]);

  const generateSeatingArrangement = (halls, students) => {
    const grids = {};
    const hallDetails = {}; // to store hall details per hall
    const allSubjectCodes = Array.from(new Set(students.map((student) => student.subject_code)));
    let subjectCodesToUse = allSubjectCodes.slice(0, 4);
    let subjectCodeStudents = subjectCodesToUse.map((code) =>
      students.filter((student) => student.subject_code === code)
    );

    let studentIndices = Array(subjectCodesToUse.length).fill(0);
    let subjectCodeUsage = new Set(subjectCodesToUse);
    const assignedStudents = new Set();

    const canPlaceStudent = (grid, row, col, student) => {
      const subjectCode = student.subject_code;
      const adjacentOffsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];

      for (const [rowOffset, colOffset] of adjacentOffsets) {
        const newRow = row + rowOffset;
        const newCol = col + colOffset;
        if (
          newRow >= 0 &&
          newRow < grid.length &&
          newCol >= 0 &&
          newCol < grid[0].length &&
          grid[newRow][newCol] &&
          grid[newRow][newCol].subject_code === subjectCode
        ) {
          return false;
        }
      }
      return true;
    };

    const replaceExhaustedSubjectCode = () => {
      const exhaustedIndex = studentIndices.findIndex(
        (index, i) => index >= subjectCodeStudents[i].length
      );

      if (exhaustedIndex !== -1) {
        const newSubjectCode = allSubjectCodes.find((code) => !subjectCodeUsage.has(code));

        if (newSubjectCode) {
          subjectCodesToUse[exhaustedIndex] = newSubjectCode;
          subjectCodeStudents[exhaustedIndex] = students.filter(
            (student) => student.subject_code === newSubjectCode
          );
          studentIndices[exhaustedIndex] = 0;
          subjectCodeUsage.add(newSubjectCode);
        }
      }
    };

    for (const hall of halls) {
      const { ROW_S, COL_s } = hall;
      const grid = Array.from({ length: ROW_S }, () => Array(COL_s).fill(null));
      hallDetails[hall.id] = []; // initialize hall details for this hall

      let remainingStudents = students.slice();

      while (remainingStudents.length > 0) {
        let placedAny = false;

        for (let row = 0; row < ROW_S; row++) {
          for (let col = 0; col < COL_s; col++) {
            if (grid[row][col] === null) {
              let placed = false;
              for (let codeIndex = 0; codeIndex < subjectCodesToUse.length; codeIndex++) {
                const codeStudents = subjectCodeStudents[codeIndex];
                const studentIndex = studentIndices[codeIndex];

                if (studentIndex < codeStudents.length) {
                  const student = codeStudents[studentIndex];

                  if (
                    !assignedStudents.has(student.registration_number) &&
                    canPlaceStudent(grid, row, col, student)
                  ) {
                    grid[row][col] = student;
                    assignedStudents.add(student.registration_number);
                    studentIndices[codeIndex]++;
                    hallDetails[hall.id].push(student);
                    placed = true;
                    placedAny = true;
                    break;
                  }
                }
              }
              if (placed) {
                replaceExhaustedSubjectCode();
              }
            }
          }
        }
        if (!placedAny) break;
        remainingStudents = students.filter(
          (student) => !assignedStudents.has(student.registration_number)
        );
      }
      grids[hall.id] = grid;
    }

    setHallDetails(hallDetails);
    localStorage.setItem("storedseating", JSON.stringify(hallDetails));
    return grids;
  };

  const downloadPDF = (hall) => {
    // Create new jsPDF document in landscape mode (A3 size)
    const doc = new jsPDF("landscape", "mm", "a3");
    const pageWidth = doc.internal.pageSize.getWidth();

    // ------------------------------
    // A) INSTITUTE HEADER
    // ------------------------------
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    // Place the logo image (adjust coordinates/size as needed)
    doc.addImage(bit, 90, 2.5, 30, 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BANNARI  AMMAN  INSTITUTE  OF  TECHNOLOGY", pageWidth / 2, 10, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "An Autonomous Institution Affiliated to Anna University Chennai - Approved by AICTE - Accredited by NAAC with 'A+' Grade",
      pageWidth / 2,
      15,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      "SATHYAMANGALAM  -  638  401          ERODE   DISTRICT             TAMIL    NADU            INDIA",
      pageWidth / 2,
      20,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Ph:   04295-226001 / 221289       Fax:   04295-226668      E-mail:   stayahead@bitsathy.ac.in       Web:   www.bitsathy.ac.in",
      pageWidth / 2,
      25,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OFFICE OF THE CONTROLLER OF EXAMINATIONS", pageWidth / 2, 30, { align: "center" });
    doc.text("OPTIONAL TEST - JANUARY 2025", pageWidth / 2, 35, { align: "center" });
    doc.text("SEATING ARRANGEMENT", pageWidth / 2, 40, { align: "center" });

    // ------------------------------
    // B) PDF TITLE (Using student data for session and date)
    // ------------------------------
    // Use the first student record as a reference for session and date (or use defaults)
    const defaultSession = students[0]?.session || "Session not provided";
    const defaultDate = students[0]?.date || "Date not provided";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Degree : B.E./B.Tech`, pageWidth / 14, 45, { align: "center" });
    doc.text(`Session: ${defaultSession}`, pageWidth / 2.8, 45, { align: "center" });
    doc.text(`Date: ${defaultDate}`, pageWidth / 1.5, 45, { align: "center" });
    doc.text(`Venue: ${hall.name}`, pageWidth / 1.1, 45, { align: "center" });

    // ------------------------------
    // C) PREPARE THE SEATING ARRANGEMENT TABLE
    // ------------------------------
    const grid = seatingGrids[hall.id];
    const logicalColumns = hall.COL_s / 2;
    const headers = [
      [
        {
          content: "Row/Col",
          rowSpan: 2,
          styles: { halign: "center", valign: "middle" },
        },
        ...Array.from({ length: logicalColumns }, (_, i) => ({
          content: `Column ${i + 1}`,
          colSpan: 2,
          styles: { halign: "center" },
        })),
      ],
    ];

    const rows = [];
    grid.forEach((row, rowIndex) => {
      const rowHeader = String.fromCharCode(65 + rowIndex);
      const seatingRow = row.map((_, colIndex) => `${rowHeader}${colIndex + 1}`);
      rows.push([rowHeader, ...seatingRow]);

      const studentRow = row.map((student) => (student ? student.registration_number : ""));
      rows.push(["", ...studentRow]);
    });

    doc.autoTable({
      startY: 50,
      head: headers,
      body: rows,
      styles: {
        halign: "center",
        valign: "middle",
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
      },
      bodyStyles: {
        fontSize: 10,
        lineWidth: 0.1,
        textColor: [0, 0, 0],
      },
      tableWidth: "auto",
      theme: "grid",
      margin: { horizontal: 10 },
    });

    doc.text(`For any clarification contact 04295-226357`, pageWidth / 8, 280, { align: "center" });
    doc.text(`Sd/-`, pageWidth / 1.1, 270, { align: "center" });
    doc.text(`Controller of Examinations`, pageWidth / 1.1, 280, { align: "center" });

    // Save PDF file
    doc.save(`${hall.name}-seating-arrangement.pdf`);
  };

  return (
    <div>
      <h2>Seating Arrangement</h2>
      {halls.map((hall) => (
        <div key={hall.id}>
          <h3>
            {hall.name} (Rows: {hall.ROW_S}, Columns: {hall.COL_s})
          </h3>
          <table className="seating-arrangement-table">
            <thead>
              <tr>
                <th></th>
                {Array.from({ length: (seatingGrids[hall.id]?.[0]?.length || 0) / 2 }).map(
                  (_, colIndex) => (
                    <th key={colIndex} className="seating-arrangement-th" colSpan="2">
                      {`Column ${colIndex + 1}`}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {seatingGrids[hall.id] &&
                seatingGrids[hall.id].map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <tr>
                      <td className="seating-arrangement-row-header">
                        {String.fromCharCode(65 + rowIndex)}
                      </td>
                      {row.map((_, colIndex) => (
                        <td key={colIndex} className="seating-arrangement-td">
                          {`${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td></td>
                      {row.map((student, colIndex) => (
                        <td key={colIndex} className="seating-arrangement-td">
                          {student ? student.registration_number : ""}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
            </tbody>
          </table>
          <button
            onClick={() => {
              downloadPDF(hall);
              localStorage.setItem("storedseating", JSON.stringify(hallDetails));
            }}
          >
            Download {hall.name} PDF
          </button>
        </div>
      ))}
    </div>
  );
};

export default SeatingArrangement;
