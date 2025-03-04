import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './HallManagement.css';

const HallManagement = () => {
  const [halls, setHalls] = useState([]);
  const [newHall, setNewHall] = useState({ name: '', ROW_S: '', COL_s: '' });
  const [editHallId, setEditHallId] = useState(null);
  const [editData, setEditData] = useState({ name: '', ROW_S: '', COL_s: '' });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/halls');
      setHalls(response.data);
    } catch (error) {
      console.error('Error fetching hall data:', error);
    }
  };

  const calculateCapacity = (rows, columns) => rows * columns;

  const addHall = async () => {
    const rows = parseInt(newHall.ROW_S, 10);
    const columns = parseInt(newHall.COL_s, 10);

    if (isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
      alert("Please enter valid rows and columns.");
      return;
    }

    const capacity = calculateCapacity(rows, columns);
    const hallData = { ...newHall, capacity };

    try {
      const response = await axios.post('http://localhost:5000/api/halls', hallData);
      // Here, we are appending the new hall rather than replacing all.
      setHalls([...halls, response.data]);
      setNewHall({ name: '', ROW_S: '', COL_s: '' });
    } catch (error) {
      console.error('Error adding hall:', error);
    }
  };

  const updateHall = async () => {
    const rows = parseInt(editData.ROW_S, 10);
    const columns = parseInt(editData.COL_s, 10);

    if (isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
      alert("Please enter valid rows and columns.");
      return;
    }

    const capacity = calculateCapacity(rows, columns);

    try {
      const response = await axios.put(`http://localhost:5000/api/halls/${editHallId}`, {
        name: editData.name,
        ROW_S: rows,
        COL_s: columns,
        capacity
      });
      setHalls(halls.map(hall =>
        hall.id === editHallId ? response.data : hall
      ));
      setEditHallId(null);
    } catch (error) {
      console.error('Error updating hall:', error);
    }
    localStorage.setItem("storedseating", JSON.stringify({}));
  };

  const handleEditClick = (hall) => {
    setEditHallId(hall.id);
    setEditData({ name: hall.name, ROW_S: hall.ROW_S, COL_s: hall.COL_s });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  // Process file upload using the new endpoint that replaces hall data
  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await axios.post('http://localhost:5000/api/halls/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(response.data.message);
      // After a successful upload, re-fetch halls to see the new data
      fetchHalls();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert("Failed to upload file.");
    }
  };

  return (
    <div className="hall-management">
      <h2>Hall Management</h2>

      {/* File Upload Section at the Top */}
      <div className="upload-section">
        <h3>Upload Hall Data (XLSX/CSV)</h3>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
        <button onClick={handleFileUpload}>Upload File</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Hall Name</th>
            <th>Rows</th>
            <th>Columns</th>
            <th>Capacity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {halls.map(hall => (
            <tr key={hall.id}>
              {editHallId === hall.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editData.ROW_S}
                      onChange={(e) => setEditData({ ...editData, ROW_S: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editData.COL_s}
                      onChange={(e) => setEditData({ ...editData, COL_s: e.target.value })}
                    />
                  </td>
                  <td>{calculateCapacity(editData.ROW_S, editData.COL_s)}</td>
                  <td>
                    <button onClick={updateHall}>Save</button>
                    <button onClick={() => setEditHallId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{hall.name}</td>
                  <td>{hall.ROW_S}</td>
                  <td>{hall.COL_s}</td>
                  <td>{hall.capacity}</td>
                  <td>
                    <button onClick={() => handleEditClick(hall)}>Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Add New Hall</h3>
      <input
        type="text"
        value={newHall.name}
        onChange={(e) => setNewHall({ ...newHall, name: e.target.value })}
        placeholder="Name"
      />
      <input
        type="number"
        value={newHall.ROW_S}
        onChange={(e) => setNewHall({ ...newHall, ROW_S: e.target.value })}
        placeholder="Rows"
      />
      <input
        type="number"
        value={newHall.COL_s}
        onChange={(e) => setNewHall({ ...newHall, COL_s: e.target.value })}
        placeholder="Columns"
      />
      <button onClick={addHall}>Add Hall</button>
    </div>
  );
};

export default HallManagement;
