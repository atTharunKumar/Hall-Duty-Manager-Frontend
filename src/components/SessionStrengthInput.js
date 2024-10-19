import React from 'react';
import axios from 'axios';
import './SessionStrengthInput.css'; // Import the CSS file

const SessionStrengthInput = ({ cycleDays, setCycleDays, sessionStrengths, setSessionStrengths }) => {
  const [isEditing, setIsEditing] = React.useState(true);

  const handleInputChange = (dayIndex, exam, field, value) => {
    const updatedStrengths = [...sessionStrengths];
    updatedStrengths[dayIndex][exam][field] = value;
    setSessionStrengths(updatedStrengths);
  };

  const handleAddDay = () => {
    const newDayIndex = sessionStrengths.length;
    setSessionStrengths([...sessionStrengths, {
      day: newDayIndex + 1,
      exam1: { strength: '' },
      exam2: { strength: '' }
    }]);
    setCycleDays(newDayIndex + 1);
  };

  const handleDeleteDay = (dayIndex) => {
    const updatedStrengths = sessionStrengths.filter((_, index) => index !== dayIndex);
    setSessionStrengths(updatedStrengths);
    setCycleDays(updatedStrengths.length);
  };

  const handleSubmit = () => {
    axios.post('http://localhost:5000/api/session-strengths', { sessionStrengths })
      .then(response => {
        console.log('Session strengths saved successfully:', response.data);
        setIsEditing(false);
      })
      .catch(error => {
        console.error('Error saving session strengths:', error);
      });
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className='SessionStrengthfullpage'>
      <div className='SessionStrength'>
        <h2>Session Strength Input</h2>
        <label>Number of Days in Exam Cycle:</label>
        <input
          type="number"
          value={cycleDays}
          onChange={(e) => {
            const days = parseInt(e.target.value, 10);
            setCycleDays(days);
            setSessionStrengths(Array.from({ length: days }, (_, i) => ({
              day: i + 1,
              exam1: { strength: '' },
              exam2: { strength: '' }
            })));
          }}
          min="1"
        />
        <div>
          <button onClick={handleAddDay}>Add Day</button>
          <button onClick={toggleEditMode}>
            {isEditing ? 'Switch to View Mode' : 'Switch to Edit Mode'}
          </button>
        </div>
        <table className="session-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Exam 1 Strength</th>
              <th>Exam 2 Strength</th>
              <th>Actions</th> {/* Add "Actions" column */}
            </tr>
          </thead>
          <tbody>
            {sessionStrengths.map((item, index) => (
              <tr key={index}>
                <td>{item.day}</td>
                {isEditing ? (
                  <>
                    <td>
                      <input
                        type="number"
                        value={item.exam1.strength}
                        onChange={(e) => handleInputChange(index, 'exam1', 'strength', e.target.value)}
                        placeholder="Exam 1 Strength"
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.exam2.strength}
                        onChange={(e) => handleInputChange(index, 'exam2', 'strength', e.target.value)}
                        placeholder="Exam 2 Strength"
                        min="0"
                      />
                    </td>
                    <td>
                      <button onClick={() => handleDeleteDay(index)}>Delete Day</button> {/* Add Delete button */}
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.exam1.strength}</td>
                    <td>{item.exam2.strength}</td>
                    <td></td> {/* Empty column for actions in view mode */}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isEditing && <button onClick={handleSubmit}>Save Session Strengths</button>}
      </div>
    </div>
  );
};

export default SessionStrengthInput;
