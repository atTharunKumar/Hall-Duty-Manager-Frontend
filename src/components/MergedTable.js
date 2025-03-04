import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './MergedTable.css';

const MergedComponent = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [filters, setFilters] = useState({});
    const [error, setError] = useState('');

    // Load data from localStorage on component mount  
    useEffect(() => {
        const savedData = localStorage.getItem('students');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setStudents(parsedData);
            setFilteredStudents(parsedData);
        } else {
            // Fetch data from the backend if no saved data
            axios.get('http://localhost:5000/api/students')
                .then(response => {
                    setStudents(response.data);
                    setFilteredStudents(response.data);
                })
                .catch(error => console.error('Error fetching student data:', error));
                
        }
    }, []);

    // Save data to localStorage whenever students data is updated
    useEffect(() => {
        if (students.length > 0) {
            localStorage.setItem('students', JSON.stringify(students));
        }
    }, [students]);

    // Handle Excel file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const binaryStr = e.target.result;
                const workbook = XLSX.read(binaryStr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const uploadedData = XLSX.utils.sheet_to_json(sheet);

                // Update the state and send data to the backend
                setStudents(uploadedData);
                setFilteredStudents(uploadedData); // Update filtered list
                axios.post('http://localhost:5000/api/upload-excel', uploadedData)
                    .then(() => console.log('Excel data uploaded successfully'))
                    .catch(error => console.error('Error uploading Excel data:', error));
            };
            reader.onerror = () => setError('Error reading file');
            reader.readAsBinaryString(file);
        }
    };

    // Update filters and apply filtering
    const handleFilterChange = (column, value) => {
        const updatedFilters = { ...filters, [column]: value };
        setFilters(updatedFilters);

        // Apply filters to the student data
        const filteredData = students.filter(student =>
            Object.keys(updatedFilters).every(key =>
                String(student[key])
                    .toLowerCase()
                    .includes(updatedFilters[key].toLowerCase())
            )
        );
        setFilteredStudents(filteredData);
    };

    return (
        <div className="merged-page">
            <h2>Uploaded Excel Data</h2>

            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
            />

            {error && <p className="error">{error}</p>}

            {filteredStudents.length > 0 ? (
                <table className="merged-table">
                    <thead>
                        <tr>
                            {Object.keys(filteredStudents[0]).map((key, index) => (
                                <th key={index}>
                                    {key}
                                    <input
                                        type="text"
                                        placeholder={`Filter ${key}`}
                                        value={filters[key] || ''}
                                        onChange={(e) =>
                                            handleFilterChange(key, e.target.value)
                                        }
                                        className="column-filter"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.values(row).map((value, colIndex) => (
                                    <td key={colIndex}>{value}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No data available</p>
            )}
        </div>
    );
};

export default MergedComponent;
