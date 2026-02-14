import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import "./StudentsPage.css";

const StudentsPage = ({ students: propStudents, setStudents: updateStudents }) => {
  const [students, setStudents] = useState(propStudents || []);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [commonCourseGroups, setCommonCourseGroups] = useState([]);

  useEffect(() => {
    // If no student data is passed via props, fetch from API
    if (!propStudents || propStudents.length === 0) {
      const fetchStudents = async () => {
        try {
          const response = await axios.get("http://localhost:5000/api/students");
          setStudents(response.data);
          if (updateStudents) {
            updateStudents(response.data);
          }
          console.log("Students data:", response.data);
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      };
      fetchStudents();
    } else {
      setStudents(propStudents);
    }

    // Load saved Common Course Groups from local storage
    const savedGroups = JSON.parse(localStorage.getItem("commonCourseGroups"));
    if (savedGroups) {
      setCommonCourseGroups(savedGroups);
    }
  }, [propStudents, updateStudents]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          if (Array.isArray(results.data)) {
            setStudents(results.data);
            if (updateStudents) {
              updateStudents(results.data);
            }
            // Replace student data on backend
            axios
              .post("http://localhost:5000/api/students/upload", results.data)
              .then(() => {
                console.log("Student data replaced successfully from CSV");
                axios
                  .get("http://localhost:5000/api/students")
                  .then((response) => {
                    setStudents(response.data);
                    if (updateStudents) {
                      updateStudents(response.data);
                    }
                  })
                  .catch((error) => console.error("Error fetching updated student data:", error));
              })
              .catch((error) => console.error("Error uploading student data:", error));
          }
        },
        error: (error) => console.error("Error parsing CSV file:", error),
      });
    } else if (extension === "xlsx") {
      const formData = new FormData();
      formData.append("file", file);
      axios
        .post("http://localhost:5000/api/students/upload-xlsx", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then(() => {
          console.log("Student data replaced successfully from XLSX");
          axios
            .get("http://localhost:5000/api/students")
            .then((response) => {
              setStudents(response.data);
              if (updateStudents) {
                updateStudents(response.data);
              }
            })
            .catch((error) => console.error("Error fetching updated student data:", error));
        })
        .catch((error) => console.error("Error uploading XLSX file:", error));
    } else {
      console.error("Unsupported file type. Please upload a CSV or XLSX file.");
    }
  };

  // Get unique subject codes from the student data
  const subjectCodes = [...new Set(students.map((student) => student.subject_code))];

  const handleSubjectSelection = (code) => {
    setSelectedSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const saveCommonCourseGroup = () => {
    if (selectedSubjects.length > 0) {
      const updatedGroups = [...commonCourseGroups, selectedSubjects];
      setCommonCourseGroups(updatedGroups);
      localStorage.setItem("commonCourseGroups", JSON.stringify(updatedGroups));
      setSelectedSubjects([]);
    }
  };

  const clearCommonCourseGroups = () => {
    setCommonCourseGroups([]);
    localStorage.removeItem("commonCourseGroups");
  };

  // Normalize student subject codes based on grouped course codes
  const normalizedStudents = students.map((student) => {
    for (let i = 0; i < commonCourseGroups.length; i++) {
      if (commonCourseGroups[i].includes(student.subject_code)) {
        return { ...student, subject_code: `GROUP_${i + 1}` };
      }
    }
    return student;
  });

  return (
    <div className="students-page">
      <h2>Student Details</h2>

      {/* File Upload for CSV/XLSX */}
      <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />

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
      <div style={{ display: "flex", gap: "10px" }}>
  <button onClick={saveCommonCourseGroup}>Save Common Course Code</button>
  <button onClick={clearCommonCourseGroups}>Clear Common Course Codes</button>
</div>

      </div>

      {/* Display Grouped Common Course Codes */}
      <div className="common-course-list">
        <h3>Grouped Common Course Codes</h3>
        {commonCourseGroups.length > 0 ? (
          commonCourseGroups.map((group, index) => (
            <div key={index} className="common-course-group">
              <strong>Group {index + 1}:</strong> {group.join(", ")}
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
