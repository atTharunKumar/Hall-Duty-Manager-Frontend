import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HallManagement.css';  // Import the CSS file

const HallManagement = () => {
  const [halls, setHalls] = useState([]);
  const [newHall, setNewHall] = useState({ name: '', ROW_S: '', COL_s: '' });
  const [editHallId, setEditHallId] = useState(null); // Store the ID of the hall being edited
  const [editData, setEditData] = useState({ name: '', ROW_S: '', COL_s: '' }); // Store edited hall data

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
      setEditHallId(null);  // Exit edit mode
    } catch (error) {
      console.error('Error updating hall:', error);
    }
  };

  const handleEditClick = (hall) => {
    setEditHallId(hall.id);
    setEditData({ name: hall.name, ROW_S: hall.ROW_S, COL_s: hall.COL_s });
  };

  return (
    <div className="hall-management">
      <h2>Hall Management</h2>
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
                  {/* Render input fields if the hall is in edit mode */}
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
                  {/* Render hall data in normal mode */}
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
