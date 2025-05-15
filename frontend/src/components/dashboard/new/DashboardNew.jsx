import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RegisterStep2 from '../../register/step2/RegisterStep2';
import RegisterStep3 from '../../register/step3/RegisterStep3';
import './DashboardNew.css';

// Define the steps for the onboarding process
const onboardingSteps = [
  { number: 1, label: 'Información de agencia' },
  { number: 2, label: 'Confirmar pago' }
];

const DashboardNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  
  // State for user data
  const [userData, setUserData] = useState({
    id: location.state?.userId || '',
    name: location.state?.name || '',
    email: location.state?.email || '',
    agencyId: '',
    plan: '',
  });
  
  // Check if user is authenticated
  useEffect(() => {
    // You might want to add authentication check here
    // If not authenticated, redirect to login
    // if (!authenticated) navigate('/login');
  }, []);
  
  const nextStep = (updatedData) => {
    setUserData({...userData, ...updatedData});
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <RegisterStep2 
                 userData={userData} 
                 onNext={nextStep} 
                 onBack={() => navigate('/dashboard')} 
               />;
      case 2:
        return <RegisterStep3 
                 userData={userData} 
                 onBack={prevStep} 
                 onComplete={() => navigate('/dashboard')}
               />;
      default:
        return <RegisterStep2 
                 userData={userData} 
                 onNext={nextStep} 
                 onBack={() => navigate('/dashboard')} 
               />;
    }
  };
  
  return (
    <div className="dashboard-new-container">
      <div className="dashboard-new-header">
        <h1>Completa tu perfil</h1>
        <p>Configura tu agencia para comenzar a usar BlanesHomes</p>
      </div>
      
      <div className="dashboard-new-steps">
        {onboardingSteps.map((stepItem, index) => (
          <React.Fragment key={stepItem.number}>
            <div 
              className={`step-inline ${
                stepItem.number === step 
                  ? 'active' 
                  : stepItem.number < step 
                    ? 'completed' 
                    : ''
              }`}
            >
              <span className="step-number-inline">
                {stepItem.number < step ? '✓' : stepItem.number}
              </span>
              <span className="step-label-inline">{stepItem.label}</span>
            </div>
            {index < onboardingSteps.length - 1 && (
              <div className={`step-connector ${stepItem.number < step ? 'completed' : ''}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="dashboard-new-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default DashboardNew;