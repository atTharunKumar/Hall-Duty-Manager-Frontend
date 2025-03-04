import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffManagement.css';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({ id: '', name: '', type: '', designation: '' });
  const [editStaffId, setEditStaffId] = useState(null);
  const [updatedStaff, setUpdatedStaff] = useState({ id: '', name: '', type: '', designation: '' });
  const [file, setFile] = useState(null); // State to store the uploaded file

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/staff')
      .then((response) => setStaff(response.data))
      .catch((error) => console.error('Error fetching staff data:', error));
  }, []);

  const addStaff = () => {
    axios
      .post('http://localhost:5000/api/staff', newStaff)
      .then((response) => {
        setStaff([...staff, response.data]);
        setNewStaff({ id: '', name: '', type: '', designation: '' });
      })
      .catch((error) => console.error('Error adding staff:', error));
  };

  const editStaffHandler = (id) => {
    if (updatedStaff.type === '') {
      alert('Please select a level.');
      return;
    }
    axios
      .put(`http://localhost:5000/api/staff/${id}`, updatedStaff)
      .then((response) => {
        setStaff(staff.map((s) => (s.id === id ? response.data : s)));
        setEditStaffId(null);
      })
      .catch((error) => console.error('Error updating staff:', error));
  };

  const handleEditClick = (staffMember) => {
    setEditStaffId(staffMember.id);
    setUpdatedStaff({
      id: staffMember.id,
      name: staffMember.name,
      type: staffMember.type,
      designation: staffMember.designation,
    });
  };

  // Handler for file selection with logging to ensure the file is captured
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log('Selected file:', selectedFile);
    setFile(selectedFile);
  };

  // Handler for file upload with FormData logging
  const handleFileUpload = () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    // Create FormData and append file with key "staffFile" (ensure backend expects this key)
    const formData = new FormData();
    formData.append('staffFile', file);

    // Log FormData entries for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] && pair[1].name ? pair[1].name : pair[1]));
    }

    axios
      .post('http://localhost:5000/api/staff/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        // Assuming backend returns updated staff data
        setStaff(response.data);
        setFile(null);
        alert('File uploaded and staff data updated successfully!');
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        alert('Error uploading file. Please check the console for more details.');
      });
  };

  return (
    <div className="staff-management">
      <h2>Staff Management</h2>
      <table>
        <thead>
          <tr>
            <th>Staff ID</th>
            <th>Staff Name</th>
            <th>Level</th>
            <th>Designation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              {editStaffId === s.id ? (
                <>
                  <td>
                    <input type="text" value={updatedStaff.id} disabled />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={updatedStaff.name}
                      onChange={(e) => setUpdatedStaff({ ...updatedStaff, name: e.target.value })}
                      placeholder="Name"
                    />
                  </td>
                  <td>
                    <select
                      value={updatedStaff.type}
                      onChange={(e) => setUpdatedStaff({ ...updatedStaff, type: e.target.value })}
                    >
                      <option value="AP1">AP1</option>
                      <option value="AP2">AP2</option>
                      <option value="AP3">AP3</option>
                      <option value="SPL">Special</option>
                      <option value="SPL1">Special 1</option>
                      <option value="SPL2">Special 2</option>
                      <option value="SPL3">Special 3</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={updatedStaff.designation}
                      onChange={(e) =>
                        setUpdatedStaff({ ...updatedStaff, designation: e.target.value })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => editStaffHandler(s.id)}>Save</button>
                    <button onClick={() => setEditStaffId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.type}</td>
                  <td>{s.designation}</td>
                  <td>
                    <button onClick={() => handleEditClick(s)}>Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Add New Staff</h3>
      <input
        type="text"
        value={newStaff.id}
        onChange={(e) => setNewStaff({ ...newStaff, id: e.target.value })}
        placeholder="ID"
      />
      <input
        type="text"
        value={newStaff.name}
        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
        placeholder="Name"
      />
      <select
        value={newStaff.type}
        onChange={(e) => setNewStaff({ ...newStaff, type: e.target.value })}
      >
        <option value="">Select Level</option>
        <option value="AP1">AP1</option>
        <option value="AP2">AP2</option>
        <option value="AP3">AP3</option>
        <option value="SPL">Special</option>
        <option value="SPL1">Special 1</option>
        <option value="SPL2">Special 2</option>
        <option value="SPL3">Special 3</option>
      </select>
      <select
        value={newStaff.designation}
        onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <button onClick={addStaff}>Add Staff</button>

      <h3>Upload Staff Data File</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>
    </div>
  );
};

export default StaffManagement;
