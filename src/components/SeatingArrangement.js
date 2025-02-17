import React, { useState, useEffect } from "react";
import axios from 'axios';
import './SeatingArrangement.css';

const SeatingArrangement = () => {
    const [halls, setHalls] = useState([]);
    const [students, setStudents] = useState([]);
    const [seatingGrids, setSeatingGrids] = useState({});
    const [commonCourseGroups, setCommonCourseGroups] = useState([]);
 
    useEffect(() => {
        const fetchHallsAndStudents = async () => {
            try {
                const hallResponse = await axios.get('http://localhost:5000/api/halls');
                const studentResponse = await axios.get('http://localhost:5000/api/students');

                // Load saved common course groups from local storage
                const savedGroups = JSON.parse(localStorage.getItem("commonCourseGroups")) || [];
                setCommonCourseGroups(savedGroups);

                // Normalize student subject codes based on common course groups
                const updatedStudents = studentResponse.data.map(student => {
                    for (let i = 0; i < savedGroups.length; i++) {
                        if (savedGroups[i].includes(student.subject_code)) {
                            return { ...student, subject_code: `GROUP_${i + 1}` }; // Assign GROUP_1, GROUP_2, etc.
                        }
                    }
                    return student; // Keep original subject code if not grouped
                });

                setHalls(hallResponse.data);
                setStudents(updatedStudents);

                const grids = generateSeatingArrangement(hallResponse.data, updatedStudents);
                setSeatingGrids(grids);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchHallsAndStudents();
    }, []);

    const generateSeatingArrangement = (halls, students) => {
        const grids = {};
        const allSubjectCodes = Array.from(new Set(students.map(student => student.subject_code)));
        let subjectCodesToUse = allSubjectCodes.slice(0, 4);
        let subjectCodeStudents = subjectCodesToUse.map(code =>
            students.filter(student => student.subject_code === code)
        );

        let studentIndices = Array(subjectCodesToUse.length).fill(0);
        let subjectCodeUsage = new Set(subjectCodesToUse);
        const assignedStudents = new Set();

        const canPlaceStudent = (grid, row, col, student) => {
            const subjectCode = student.subject_code;
            const adjacentOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

            for (const [rowOffset, colOffset] of adjacentOffsets) {
                const newRow = row + rowOffset;
                const newCol = col + colOffset;

                if (
                    newRow >= 0 && newRow < grid.length &&
                    newCol >= 0 && newCol < grid[0].length &&
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
                const newSubjectCode = allSubjectCodes.find(
                    code => !subjectCodeUsage.has(code)
                );

                if (newSubjectCode) {
                    subjectCodesToUse[exhaustedIndex] = newSubjectCode;
                    subjectCodeStudents[exhaustedIndex] = students.filter(student => student.subject_code === newSubjectCode);
                    studentIndices[exhaustedIndex] = 0;
                    subjectCodeUsage.add(newSubjectCode);
                }
            }
        };

        for (const hall of halls) {
            const { ROW_S, COL_s } = hall;
            const grid = Array.from({ length: ROW_S }, () => Array(COL_s).fill(null));
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

                                    if (!assignedStudents.has(student.registration_number) && canPlaceStudent(grid, row, col, student)) {
                                        grid[row][col] = student;
                                        assignedStudents.add(student.registration_number);
                                        studentIndices[codeIndex]++;
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
                remainingStudents = students.filter(student => !assignedStudents.has(student.registration_number));
            }

            grids[hall.id] = grid;
        }

        return grids;
    };

    return (
        <div>
            <h2>Seating Arrangement</h2>
            {halls.map(hall => (
                <div key={hall.id}>
                    <h3>{hall.name} (Rows: {hall.ROW_S}, Columns: {hall.COL_s})</h3>
                    <table className="seating-arrangement-table">
                        <thead>
                            <tr>
                                <th></th>
                                {Array.from({ length: seatingGrids[hall.id]?.[0]?.length || 0 }).map((_, colIndex) => (
                                    <th key={colIndex} className="seating-arrangement-th">
                                        {`Column ${colIndex + 1}`}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {seatingGrids[hall.id] && seatingGrids[hall.id].map((row, rowIndex) => (
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
                                                {student ? student.registration_number : ''}
                                            </td>
                                        ))}
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default SeatingArrangement;
