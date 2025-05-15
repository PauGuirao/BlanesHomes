import { useState } from 'react';
import './ActionPanel.css';

const ActionPanel = ({ onClose, visible, children }) => {
  if (!visible) return null;
  return (
    <div className="action-panel">
        <button className="close-button" onClick={onClose}>✕</button> 
        {children}
    </div>
  );
};

export default ActionPanel;