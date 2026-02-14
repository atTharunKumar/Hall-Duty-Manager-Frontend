import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import bit from "./../assets/image.png";
import "./SeatingArrangement.css";


// Precompute neighbor indices for a grid with given rows and cols.
const computeNeighbors = (rows, cols) => {
  const neighbors = Array(rows * cols).fill(null).map(() => []);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            neighbors[index].push(nr * cols + nc);
          }
        }
      }
    }
  }
  return neighbors;
};

// Convert flat index to row, col.
const indexToRowCol = (index, cols) => ({
  row: Math.floor(index / cols),
  col: index % cols
});

// PHASE 0: Strict rule: no neighbor (all eight directions) has the same course code.
const canPlaceStudentStrict = (grid, index, student, neighbors) => {
  for (let nbr of neighbors[index]) {
    if (grid[nbr] && grid[nbr].subject_code === student.subject_code) {
      return false;
    }
  }
  return true;
};

// PHASE 1: Relaxed vertical rule with department check.
// All non-vertical neighbors are checked strictly.
// For vertical neighbors, allow only if department differs.
const canPlaceStudentDeptRelaxed = (grid, index, student, neighbors, cols) => {
  const { row, col } = indexToRowCol(index, cols);
  for (let nbr of neighbors[index]) {
    const { row: nbrRow, col: nbrCol } = indexToRowCol(nbr, cols);
    if (grid[nbr] && grid[nbr].subject_code === student.subject_code) {
      // If not vertical, then reject.
      if (nbrCol !== col) return false;
      // If vertical, allow only if department differs.
      if (grid[nbr].department === student.department) return false;
    }
  }
  return true;
};

// PHASE 2: Fully relaxed vertical rule:
// All non-vertical neighbors are checked strictly; vertical ones are ignored.
const canPlaceStudentFullyRelaxed = (grid, index, student, neighbors, cols) => {
  const { col } = indexToRowCol(index, cols);
  for (let nbr of neighbors[index]) {
    const { col: nbrCol } = indexToRowCol(nbr, cols);
    if (nbrCol !== col) {
      if (grid[nbr] && grid[nbr].subject_code === student.subject_code) return false;
    }
  }
  return true;
};

const SeatingArrangement = ({ students }) => {
  const [examName, setExamName] = useState("");
  const [halls, setHalls] = useState([]);
  const [seatingGrids, setSeatingGrids] = useState({});
  const [commonCourseGroups, setCommonCourseGroups] = useState([]);
  const [hallDetails, setHallDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedHall, setSelectedHall] = useState("ALL");


  // Total number of students (e.g., 1879)
  const totalStudents = students.length;

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const hallResponse = await axios.get("http://localhost:5000/api/halls");
        const hallsData = hallResponse.data;
        // Compute total seating capacity.
        const totalCapacity = hallsData.reduce((acc, hall) => acc + hall.ROW_S * hall.COL_s, 0);
        if (totalCapacity < totalStudents) {
          setErrorMessage("Not enough halls to place all the students.");
          return;
        }
        const savedGroups = JSON.parse(localStorage.getItem("commonCourseGroups")) || [];
        setCommonCourseGroups(savedGroups);

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

        setHalls(hallsData);
        const { grids, hallDetailsLocal } = generateSeatingArrangement(hallsData, updatedStudents);
        setSeatingGrids(grids);
        setHallDetails(hallDetailsLocal);

        // After seating, compute total allocated students across all halls.
        const allocated = Object.values(hallDetailsLocal).reduce(
          (sum, arr) => sum + arr.length,
          0
        );
        if (allocated < totalStudents) {
          setErrorMessage("Could not allocate all students with the given constraints.");
        }
      } catch (error) {
        console.error("Error fetching halls data:", error);
        setErrorMessage("Error fetching hall data.");
      }
    };
    if (students && students.length > 0) {
      fetchHalls();
    }
  }, [students, totalStudents]);

  // Global arrays for subject grouping.
  const generateSeatingArrangement = (halls, students) => {
    const grids = {};
    const hallDetailsLocal = {};
    const allSubjectCodes = Array.from(new Set(students.map(s => s.subject_code)));
    let subjectCodesToUse = allSubjectCodes.slice(0, 4);
    let subjectCodeStudents = subjectCodesToUse.map(code =>
      students.filter(s => s.subject_code === code)
    );
    let studentIndices = Array(subjectCodesToUse.length).fill(0);
    let subjectCodeUsage = new Set(subjectCodesToUse);

    const replaceExhaustedSubjectCode = () => {
      const exhaustedIndex = studentIndices.findIndex((index, i) =>
        index >= subjectCodeStudents[i].length
      );
      if (exhaustedIndex !== -1) {
        const newSubjectCode = allSubjectCodes.find(code => !subjectCodeUsage.has(code));
        if (newSubjectCode) {
          subjectCodesToUse[exhaustedIndex] = newSubjectCode;
          subjectCodeStudents[exhaustedIndex] = students.filter(s => s.subject_code === newSubjectCode);
          studentIndices[exhaustedIndex] = 0;
          subjectCodeUsage.add(newSubjectCode);
        }
      }
    };

    // Process each hall independently.
    for (const hall of halls) {
      const { ROW_S, COL_s, id } = hall;
      const totalCells = ROW_S * COL_s;
      // Precompute neighbor indices.
      const precomputedNeighbors = computeNeighbors(ROW_S, COL_s);
      // Create a flat grid.
      const grid = Array(totalCells).fill(null);
      hallDetailsLocal[id] = [];
      const assignedStudents = new Set();

      // Helper: fillPhase makes a full pass over the grid using a given check function.
      const fillPhase = (checkFn) => {
        let placementsMade = 0;
        for (let idx = 0; idx < totalCells; idx++) {
          if (assignedStudents.size >= totalStudents) break;
          if (grid[idx] === null) {
            for (let codeIndex = 0; codeIndex < subjectCodesToUse.length; codeIndex++) {
              const codeStudents = subjectCodeStudents[codeIndex];
              const studentIndex = studentIndices[codeIndex];
              if (studentIndex < codeStudents.length) {
                const student = codeStudents[studentIndex];
                if (!assignedStudents.has(student.registration_number) &&
                    checkFn(grid, idx, student, precomputedNeighbors, COL_s)) {
                  grid[idx] = student;
                  assignedStudents.add(student.registration_number);
                  studentIndices[codeIndex]++;
                  hallDetailsLocal[id].push(student);
                  placementsMade++;
                  break;
                }
              }
            }
            if (grid[idx] !== null) {
              replaceExhaustedSubjectCode();
            }
          }
        }
        return placementsMade;
      };

      // PHASE 0: Strict rule.
      let phase0;
      do {
        phase0 = fillPhase(canPlaceStudentStrict);
      } while (phase0 > 0 && assignedStudents.size < totalStudents);

      // PHASE 1: Relaxed vertical rule with department check.
      let phase1;
      do {
        phase1 = fillPhase(canPlaceStudentDeptRelaxed);
      } while (phase1 > 0 && assignedStudents.size < totalStudents);

      // PHASE 2: Fully relaxed vertical rule.
      let phase2;
      do {
        phase2 = fillPhase(canPlaceStudentFullyRelaxed);
      } while (phase2 > 0 && assignedStudents.size < totalStudents);

      grids[id] = grid;
    }
    localStorage.setItem("storedseating", JSON.stringify(hallDetailsLocal));
    return { grids, hallDetailsLocal };
  };

  // Helper to convert a flat grid into a two-dimensional array for rendering.
  const get2DGrid = (flatGrid, cols) => {
    const grid2D = [];
    for (let i = 0; i < flatGrid.length; i += cols) {
      grid2D.push(flatGrid.slice(i, i + cols));
    }
    return grid2D;
  };

 const downloadPDF = (hall, doc = null) => {
  const isSingleDownload = !doc;

  if (!doc) {
    doc = new jsPDF("landscape", "mm", "a3");
  } else {
    doc.addPage(); // add new page if reusing
  }

 

    const pageWidth = doc.internal.pageSize.getWidth();
    // PDF generation code remains similar.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.addImage(bit, 90, 2.5, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BANNARI  AMMAN  INSTITUTE  OF  TECHNOLOGY", pageWidth / 2, 10, { align: "center" });
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
    doc.text(
  examName || "EXAMINATION NAME NOT PROVIDED",
  pageWidth / 2,
  35,
  { align: "center" }
);

    doc.text("SEATING ARRANGEMENT", pageWidth / 2, 40, { align: "center" });
    const defaultSession = students[0]?.session || "Session not provided";
    const defaultDate = students[0]?.date || "Date not provided";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Degree : B.E./B.Tech`, pageWidth / 14, 45, { align: "center" });
    doc.text(`Session: ${defaultSession}`, pageWidth / 2.8, 45, { align: "center" });
    doc.text(`Date: ${defaultDate}`, pageWidth / 1.5, 45, { align: "center" });
    doc.text(`Venue: ${hall.name}`, pageWidth / 1.1, 45, { align: "center" });
    const grid = seatingGrids[hall.id];
    const grid2D = get2DGrid(grid, hall.COL_s);
    const logicalColumns = hall.COL_s / 2;
    const headers = [
      [
        { content: "Row/Col", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        ...Array.from({ length: logicalColumns }, (_, i) => ({
          content: `Column ${i + 1}`,
          colSpan: 2,
          styles: { halign: "center" },
        })),
      ],
    ];
    const rowsPdf = [];
    grid2D.forEach((row, rowIndex) => {
      const rowHeader = String.fromCharCode(65 + rowIndex);
      const seatingRow = row.map((_, colIndex) => `${rowHeader}${colIndex + 1}`);
      rowsPdf.push([rowHeader, ...seatingRow]);
      const studentRow = row.map(student => (student ? student.registration_number : ""));
      rowsPdf.push(["", ...studentRow]);
    });
    doc.autoTable({
      startY: 50,
      head: headers,
      body: rowsPdf,
      styles: {
        halign: "center",
        valign: "middle",
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        lineColor: [0, 0, 0],
      },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 30 } },
      bodyStyles: { fontSize: 10, lineWidth: 0.1, textColor: [0, 0, 0] },
      tableWidth: "auto",
      theme: "grid",
      margin: { horizontal: 10 },
    });
    doc.text(`For any clarification contact 04295-226357`, pageWidth / 8, 280, { align: "center" });
    doc.text(`Sd/-`, pageWidth / 1.1, 270, { align: "center" });
    doc.text(`Controller of Examinations`, pageWidth / 1.1, 280, { align: "center" });
    if (isSingleDownload) {
  doc.save(`${hall.name}-seating-arrangement.pdf`);
}

  };

const downloadAllPDFs = () => {
  const doc = new jsPDF("landscape", "mm", "a3");

  halls.forEach((hall) => {
    if (
      seatingGrids[hall.id] &&
      hallDetails[hall.id] &&
      hallDetails[hall.id].length > 0
    ) {
      downloadPDF(hall, doc);
    }
  });

  doc.save("All_Venues_Seating_Arrangement.pdf");
};




  return (
    <div>
      <h2>Seating Arrangement</h2>
      <div style={{ marginBottom: "15px" }}>
  <div className="exam-name-container">
  <label>Examination Name:</label>
  <input
    type="text"
    placeholder="e.g. Internal Test - Feb 2025"
    value={examName}
    onChange={(e) => setExamName(e.target.value)}
  />
</div>

</div>

<div className="venue-filter-container">
  <label>Venue:</label>
  <select
    value={selectedHall}
    onChange={(e) => setSelectedHall(e.target.value)}
  >
    <option value="ALL">All Venues</option>
    {halls.map((hall) => (
      <option key={hall.id} value={hall.id}>
        {hall.name}
      </option>
    ))}
  </select>
</div>


<button
  style={{ marginBottom: "20px" }}
  onClick={downloadAllPDFs}
>
  Download All Venues PDF
</button>

      {errorMessage ? (
        <p className="error-message">{errorMessage}</p>
      ) : (
      halls
  .filter((hall) => {
    const hasStudents =
      hallDetails[hall.id] && hallDetails[hall.id].length > 0;

    const matchesSelection =
      selectedHall === "ALL" || hall.id === Number(selectedHall);

    return hasStudents && matchesSelection;
  })

  .map((hall) => (

          <div key={hall.id}>
            <h3>
              {hall.name} (Rows: {hall.ROW_S}, Columns: {hall.COL_s})
            </h3>
            {seatingGrids[hall.id] && (
              <table className="seating-arrangement-table">
                <thead>
                  <tr>
                    <th></th>
                    {Array.from({ length: hall.COL_s / 2 }).map((_, colIndex) => (
                      <th key={colIndex} className="seating-arrangement-th" colSpan="2">
                        {`Column ${colIndex + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seatingGrids[hall.id] &&
                    get2DGrid(seatingGrids[hall.id], hall.COL_s).map((row, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <tr>
                          <td className="seating-arrangement-row-header">{String.fromCharCode(65 + rowIndex)}</td>
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
            )}
            <button
              onClick={() => {
                downloadPDF(hall);
                localStorage.setItem("storedseating", JSON.stringify(hallDetails));
              }}
            >
              Download {hall.name} PDF
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default SeatingArrangement;
