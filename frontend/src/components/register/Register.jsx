import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RegisterStep1 from './step1/RegisterStep1';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State for user data
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const handleRegistrationComplete = (updatedData) => {
    // After registration is complete, redirect to login
    navigate('/login');
  };
  
  return (
    <div className="register-container">
      <div className="register-form-container">
        <RegisterStep1 
          userData={userData} 
          onNext={handleRegistrationComplete} 
        />
      </div>
    </div>
  );
};

export default Register;