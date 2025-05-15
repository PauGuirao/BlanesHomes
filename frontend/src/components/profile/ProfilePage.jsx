import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    agencia: '',
    plan: ''
  });
  
  // Get Stripe portal URL from environment variable
  const stripePortalUrl = 'https://billing.stripe.com/p/login/test_fZu6oJgnf5AA9kR0XfcEw00';
  
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'es');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Function to change language
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  // Function to go back
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Function to redirect to Stripe Customer Portal
  const handleManageSubscription = () => {
    window.open(stripePortalUrl, '_blank');
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      setProfile(data);
      setFormData({
        nombre: data.nombre || '',
        email: user.email || '',
        telefono: data.telefono || '',
        agencia: data.agencia_id || '',
        plan: data.plan || 'Básico'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
          agencia_id: formData.agencia
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="profile-container">
        <div className="profile-loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t('profile.title')}</h1>
        <div className="profile-header-actions">
          <button 
            className="back-button"
            onClick={handleGoBack}
          >
            ← {t('common.back')}
          </button>
          {!editing && (
            <button 
              className="edit-button"
              onClick={() => setEditing(true)}
            >
              {t('profile.editProfile')}
            </button>
          )}
        </div>
      </div>
      
      {editing ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="disabled-input"
            />
            <small>El email no se puede cambiar</small>
          </div>
          
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Agencia</label>
            <input
              type="text"
              name="agencia"
              value={formData.agencia}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Plan Actual</label>
            <input
              type="text"
              value={formData.plan}
              disabled
              className="disabled-input"
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-button">
              Guardar Cambios
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details">
          <div className="profile-section">
            <div className="profile-avatar">
              {profile.nombre ? profile.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <h2>{profile.nombre || 'Usuario'}</h2>
              <span className="profile-plan">{profile.plan || 'Plan Básico'}</span>
            </div>
          </div>
          
          <div className="profile-data">
            <div className="data-item">
              <span className="data-label">Email</span>
              <span className="data-value">{formData.email}</span>
            </div>
            
            <div className="data-item">
              <span className="data-label">Teléfono</span>
              <span className="data-value">{profile.telefono || 'No especificado'}</span>
            </div>
            
            <div className="data-item">
              <span className="data-label">Agencia</span>
              <span className="data-value">{profile.agencia_id || 'No especificada'}</span>
            </div>
            
            <div className="data-item">
              <span className="data-label">Estado de la cuenta</span>
              <span className="data-value status">
                <span className={`status-indicator ${profile.estado === 'pagado' ? 'active' : 'inactive'}`}></span>
                {profile.estado === 'pagado' ? 'Activa' : 'Pendiente de activación'}
              </span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className="upgrade-button"
              onClick={handleManageSubscription}
            >
              Gestionar suscripción
            </button>
          </div>
          
          {/* Configuration Section */}
          <div className="profile-config-section">
            <h3>{t('profile.configuration', 'Configuración')}</h3>
            
            <div className="config-item">
              <span className="config-label">{t('profile.language', 'Idioma')}</span>
              <div className="language-options">
                <button 
                  className={`language-button ${currentLanguage === 'es' ? 'active' : ''}`}
                  onClick={() => changeLanguage('es')}
                >
                  Español
                </button>
                <button 
                  className={`language-button ${currentLanguage === 'ca' ? 'active' : ''}`}
                  onClick={() => changeLanguage('ca')}
                >
                  Català
                </button>
                <button 
                  className={`language-button ${currentLanguage === 'en' ? 'active' : ''}`}
                  onClick={() => changeLanguage('en')}
                >
                  English
                </button>
              </div>
            </div>
            
            {/* You can add more configuration options here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;