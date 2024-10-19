import React from 'react';
import './Footer.css';  // Import the CSS file

const Footer = () => {
  return (
    <footer>
      <p>&copy; 2024 Hall Duty Manager. All rights reserved.</p>
  <p>
        <a href="/contact">Contact us</a> | 
        <a href="/privacy-policy">Privacy Policy</a> | 
        <a href="/terms-of-service">Terms of Service</a>
      </p>
      
    </footer>
  );
};

export default Footer;
