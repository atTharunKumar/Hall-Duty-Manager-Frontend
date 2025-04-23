// import React, { useState } from "react";
// import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
// import { useNavigate } from "react-router-dom";
// import useAuthStore from "./AuthStore";
// import image from "../assets/login.png";
// import "./AuthLogin.css";

// const AuthLogin = () => {
//   const [errorMessage, setErrorMessage] = useState("");
//   const navigate = useNavigate();
//   const { loginWithGoogle } = useAuthStore();
//   const CLIENT_ID = "361374319106-batvm6m2ctt8mbse8cjf71lsgdusl06f.apps.googleusercontent.com";

//   const handleGoogleSuccess = async (response) => {
//     if (!response || !response.credential) {
//       setErrorMessage("Google login failed. No credential received.");
//       return;
//     }

//     const token = response.credential;
//     try {
//       const role = await loginWithGoogle(token);
//       if (role === "admin") navigate("/homepage");
//       else if (role === "faculty") navigate("/settings");
//       else navigate("/");
//     } catch (error) {
//       setErrorMessage("Google login failed. Please try again.");
//     }
//   };

//   return (
//     <div className="container">
//       <h1>Welcome Back</h1>
//       <img src={image} alt="BIT PORTAL" />
//       <h2>Bit Venue Allocator</h2>
//       <hr />

//       {errorMessage && <p className="error-message">{errorMessage}</p>}

//       <div className="google-login-button">
//         <GoogleOAuthProvider clientId={CLIENT_ID}>
//           <GoogleLogin
//             onSuccess={handleGoogleSuccess}
//             onError={(error) => {
//               console.error("Google login error:", error);
//               setErrorMessage("Google login failed. Please try again.");
//             }}
//           />
//         </GoogleOAuthProvider>
//       </div>

//       <p>Sign in with your BIT account</p>
//     </div>
//   );
// };

// export default AuthLogin;