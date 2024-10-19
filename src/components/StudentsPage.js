import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentsPage.css'; // Import CSS file for styling
import Papa from 'papaparse'; // CSV parsing library

const StudentsPage = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        // Fetch student data from the backend
        const fetchStudents = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/students');
                setStudents(response.data);
                console.log(response.data)
            } catch (error) {
                console.error("Error fetching student data:", error);
            }
        };
        

        fetchStudents();
    }, []);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    const uploadedStudents = results.data;
                    // Assuming each student object has the following structure:
                    // { registration_number: '', name: '', department: '', subject_code: '' }
                    if (Array.isArray(uploadedStudents)) {
                        setStudents(uploadedStudents);
                        // Optionally, you can also send the data to your backend
                        axios.post('http://localhost:5000/api/students/upload', uploadedStudents)
                            .then(() => console.log('Students data uploaded successfully'))
                            .catch(error => console.error('Error uploading students data:', error));
                    }
                },
                error: (error) => {
                    console.error('Error parsing CSV file:', error);
                }
            });
        }
    };

    return (
        <div className="students-page">
            <h2>Student Details</h2>

            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
            />

            <table className="students-table">
                <thead>
                    <tr>
                        <th>Registration Number</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Subject Code</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.registration_number}>
                            <td>{student.registration_number}</td>
                            <td>{student.name}</td>
                            <td>{student.department}</td>
                            <td>{student.subject_code}</td> 
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentsPage;
