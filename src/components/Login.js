import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/login.png';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const parseJwt = (token) => {
      const base64 = token.split('.')[1];
      return JSON.parse(atob(base64));
    };

    const handleCredentialResponse = async (response) => {
      const decoded = parseJwt(response.credential); 
      const email = decoded.email;
      const name = decoded.name; // ✅ get user's name

      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success && data.role) {
        // ✅ Store name along with email and role
        localStorage.setItem("role", data.role);
        localStorage.setItem("user", JSON.stringify({ name, email, role: data.role }));

        if (data.role === "admin") {
          navigate("/home");
        } else if (data.role === "faculty") {
          navigate("/slotbooking");
        } else {
          alert("Unauthorized role");
        }
      }
    };

    window.google.accounts.id.initialize({
      client_id: '457327571508-b1udcf5o8dt1m2fa03ndkgs4puhd11e4.apps.googleusercontent.com',
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      { theme: "outline", size: "large" }
    );
  }, [navigate]);

  return (
    <div className="container">
      <div className="logincard">
        <h2>Welcome Back!</h2>
        <img src={logo} alt="BIT Logo" className="logo" />
        <h3>BIT Venue Allocator</h3>
        <hr />
        <div id="googleSignInDiv" className="flex justify-center mt-10" />
        <p className="info-text">Sign in with your BIT account</p>
      </div>
    </div>
  );
}
