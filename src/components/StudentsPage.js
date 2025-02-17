import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentsPage.css';
import Papa from 'papaparse';

const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [commonCourseGroups, setCommonCourseGroups] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/students');
                setStudents(response.data);
            } catch (error) {
                console.error("Error fetching student data:", error);
            }
        };

        fetchStudents();

        // Load saved Common Course Groups from Local Storage
        const savedGroups = JSON.parse(localStorage.getItem("commonCourseGroups"));
        if (savedGroups) {
            setCommonCourseGroups(savedGroups);
        }
    }, []);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    if (Array.isArray(results.data)) {
                        setStudents(results.data);
                        axios.post('http://localhost:5000/api/students/upload', results.data)
                            .then(() => console.log('Students data uploaded successfully'))
                            .catch(error => console.error('Error uploading students data:', error));
                    }
                },
                error: (error) => console.error('Error parsing CSV file:', error)
            });
        }
    };

    // Get unique subject codes
    const subjectCodes = [...new Set(students.map(student => student.subject_code))];

    // Handle selection of subject codes for a new common course group
    const handleSubjectSelection = (code) => {
        setSelectedSubjects(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    // Save a new common course code group
    const saveCommonCourseGroup = () => {
        if (selectedSubjects.length > 0) {
            const updatedGroups = [...commonCourseGroups, selectedSubjects];
            setCommonCourseGroups(updatedGroups);
            localStorage.setItem("commonCourseGroups", JSON.stringify(updatedGroups)); // Save to Local Storage
            setSelectedSubjects([]);
        }
    };

    // Clear all saved Common Course Groups
    const clearCommonCourseGroups = () => {
        setCommonCourseGroups([]);
        localStorage.removeItem("commonCourseGroups");
    };

    // Normalize students' subject codes based on grouped course codes
    const normalizedStudents = students.map(student => {
        for (let i = 0; i < commonCourseGroups.length; i++) {
            if (commonCourseGroups[i].includes(student.subject_code)) {
                return { ...student, subject_code: `GROUP_${i + 1}` }; // Assign GROUP_1, GROUP_2, etc.
            }
        }
        return student; // Keep original subject code if not grouped
    });

    return (
        <div className="students-page">
            <h2>Student Details</h2>

            <input type="file" accept=".csv" onChange={handleFileUpload} />

            {/* Common Course Code Section */}
            <div className="common-course-code">
                <h3>Common Course Code</h3>
                <div className="subject-selection">
                    {subjectCodes.map((code) => (
                        <label key={code}>
                            <input
                                type="checkbox"
                                checked={selectedSubjects.includes(code)}
                                onChange={() => handleSubjectSelection(code)}
                            />
                            {code}
                        </label>
                    ))}
                </div>
                <button onClick={saveCommonCourseGroup}>Save Common Course Code</button>
                <button onClick={clearCommonCourseGroups} style={{ marginLeft: '10px' }}>
                    Clear Common Course Codes
                </button>
            </div>

            {/* Display common course groups */}
            <div className="common-course-list">
                <h3>Grouped Common Course Codes</h3>
                {commonCourseGroups.length > 0 ? (
                    commonCourseGroups.map((group, index) => (
                        <div key={index} className="common-course-group">
                            <strong>Group {index + 1}:</strong> {group.join(', ')}
                        </div>
                    ))
                ) : (
                    <p>No Common Course Codes saved.</p>
                )}
            </div>

            {/* Student Table */}
            <table className="students-table">
                <thead>
                    <tr>
                        <th>Registration Number</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Subject Code</th>
                        <th>Date</th>
                        <th>Session</th>
                    </tr>
                </thead>
                <tbody>
                    {normalizedStudents.map((student, index) => (
                        <tr key={index}>
                            <td>{student.registration_number}</td>
                            <td>{student.name}</td>
                            <td>{student.department}</td>
                            <td>{student.subject_code}</td>
                            <td>{student.date}</td>
                            <td>{student.session}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentsPage;
