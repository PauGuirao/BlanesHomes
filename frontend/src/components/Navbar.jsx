import React, { useState, useRef } from "react";
import "./Navbar.css";

const Navbar = ({
  onAbrirFormulario,
  onAbrirUrlForm,
  onAbrirVendor,
  onAbrirComparator,
  comparateCount,
  user,
  onLogout, // Add onLogout prop
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false); // State for user dropdown
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null); // Ref for user dropdown

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-actions">
        <button
          className="compare-button-action"
          onClick={onAbrirComparator}
        >
          Comparar ({comparateCount})
        </button>
        <div className="navbar-tools" ref={dropdownRef}>
          <button
            className="tools-button"
            onClick={() => setShowDropdown((v) => !v)}
          >
            Herramientas ▾
          </button>
          {showDropdown && (
            <div className="tools-dropdown">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onAbrirFormulario();
                }}
              >
                Buscar propiedad
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onAbrirUrlForm();
                }}
              >
                Buscar desde URL
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onAbrirVendor();
                }}
              >
                Las Agencias
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="navbar-title">Blanes Homes</div>
      <div className="navbar-user" ref={userDropdownRef}>
        <span onClick={() => setShowUserDropdown((v) => !v)}>{user.email}</span>
        {showUserDropdown && (
          <div className="user-dropdown">
            <button onClick={onLogout}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
