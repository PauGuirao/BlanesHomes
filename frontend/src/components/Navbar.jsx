import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./Navbar.css";

const Navbar = ({
  onAbrirFormulario,
  onAbrirUrlForm,
  onAbrirVendor,
  onAbrirComparator,
  comparateCount,
  onAnalizaMiAgencia,
  onAbrirParticulares,
  user,
  agencia,
  onLogout,
  selectedCity,
  availableCities,
  onCityChange,
  isMobile,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  // Add state to store user display name
  const [displayName, setDisplayName] = useState("Cargando...");
  
  // Update display name whenever user or agencia changes
  useEffect(() => {
    if (agencia?.nombre) {
      setDisplayName(agencia.nombre);
      localStorage.setItem('userDisplayName', agencia.nombre);
    } else if (user?.user_metadata?.name) {
      setDisplayName(user.user_metadata.name);
      localStorage.setItem('userDisplayName', user.user_metadata.name);
    } else {
      const savedName = localStorage.getItem('userDisplayName');
      if (savedName) {
        setDisplayName(savedName);
      }
    }
  }, [user, agencia]);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { t, i18n } = useTranslation();

  return (
    <nav className={`navbar ${isMobile ? 'navbar-mobile' : ''}`}>
      {isMobile ? (
        <>
          <div className="mobile-navbar-container">
            <div className="mobile-menu-toggle" ref={mobileMenuRef}>
              <button 
                className="hamburger-button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                ☰
              </button>
              {showMobileMenu && (
                <div className="mobile-menu">
                  <div className="navbar-city-selector">
                    <select 
                      value={selectedCity} 
                      onChange={(e) => onCityChange(e.target.value)}
                      className="city-select"
                    >
                      {availableCities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="compare-button-action"
                    onClick={() => {
                      onAbrirComparator();
                      setShowMobileMenu(false);
                    }}
                  >
                    {t('navbar.compare')} ({comparateCount})
                  </button>
                  <button
                    onClick={() => {
                      onAbrirFormulario();
                      setShowMobileMenu(false);
                    }}
                  >
                    {t('navbar.searchProperty')}
                  </button>
                  <button
                    onClick={() => {
                      onAbrirUrlForm();
                      setShowMobileMenu(false);
                    }}
                  >
                    {t('navbar.analyzeAd')}
                  </button>
                  <button
                    onClick={() => {
                      onAbrirVendor();
                      setShowMobileMenu(false);
                    }}
                  >
                    Las Agencias
                  </button>
                  <button
                    onClick={() => {
                      onAnalizaMiAgencia();
                      setShowMobileMenu(false);
                    }}
                  >
                    Analiza mi agencia
                  </button>
                  <button
                    onClick={() => {
                      onAbrirParticulares();
                      setShowMobileMenu(false);
                    }}
                  >
                    Ver particulares
                  </button>
                </div>
              )}
            </div>
            
            <div className="navbar-title">Blanes Homes</div>
            
            <div className="navbar-user" ref={userDropdownRef}>
              <div className="user-avatar" onClick={() => setShowUserDropdown((v) => !v)}>
                {displayName !== "Cargando..." ? displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              {showUserDropdown && (
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                    {t('navbar.profile')}
                  </Link>
                  <button onClick={() => {
                    setShowUserDropdown(false);
                    localStorage.removeItem('userDisplayName');
                    onLogout();
                  }}>
                    {t('navbar.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="navbar-actions">
            <div className="navbar-city-selector">
              <select 
                value={selectedCity} 
                onChange={(e) => onCityChange(e.target.value)}
                className="city-select"
              >
                {availableCities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="compare-button-action"
              onClick={onAbrirComparator}
            >
              {t('navbar.compare')} ({comparateCount})
            </button>
            <div className="navbar-tools" ref={dropdownRef}>
              <button
                className="tools-button"
                onClick={() => setShowDropdown((v) => !v)}
              >
                {t('navbar.tools')} ▾
              </button>
              {showDropdown && (
                <div className="tools-dropdown">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onAbrirFormulario();
                    }}
                  >
                    {t('navbar.searchProperty')}
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onAbrirUrlForm();
                    }}
                  >
                    {t('navbar.analyzeAd')}
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onAbrirVendor();
                    }}
                  >
                    Las Agencias
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onAnalizaMiAgencia();
                    }}
                  >
                    Analiza mi agencia
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onAbrirParticulares();
                    }}
                  >
                    Ver particulares
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="navbar-title">Blanes Homes</div>
          <div className="navbar-user" ref={userDropdownRef}>
            <div className="user-info" onClick={() => setShowUserDropdown((v) => !v)}>
              <div className="user-avatar">
                {displayName !== "Cargando..." ? displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-name">
                {displayName}
              </span>
            </div>
            {showUserDropdown && (
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                  {t('navbar.profile')}
                </Link>
                <button onClick={() => {
                  setShowUserDropdown(false);
                  localStorage.removeItem('userDisplayName');
                  onLogout();
                }}>
                  {t('navbar.logout')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
