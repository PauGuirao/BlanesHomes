import React from "react";
import "./ExportModal.css";

function ExportModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  hasAgencyOption = false, 
  exportOnlyAgency, 
  setExportOnlyAgency 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="export-modal">
        <h3>Exportar Análisis</h3>
        
        {hasAgencyOption && (
          <div className="export-option">
            <label>
              <input 
                type="checkbox" 
                checked={exportOnlyAgency}
                onChange={(e) => setExportOnlyAgency(e.target.checked)}
              />
              Exportar solo propiedades de mi agencia
            </label>
          </div>
        )}
        
        <div className="modal-buttons">
          <button 
            onClick={onClose} 
            className="cancel-button"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="confirm-button"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;