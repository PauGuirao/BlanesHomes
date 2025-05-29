import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed editing state
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
  const { theme, toggleTheme } = useTheme();
  const [agencyMembers, setAgencyMembers] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ message: '', type: '' });
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchAgencyMembers();
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
  
      if (!user) throw new Error('No user logged in');
  
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, organization_id')
        .eq('id', user.id)
        .single();
  
      if (profileError) throw profileError;
  
      setProfile(profileData);
  
      let organizationInfo = {
        agencia: '',
        plan: ''
      };
  
      if (profileData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('plan, estado, agencias(nombre)')
          .eq('id', profileData.organization_id)
          .single();
  
        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else {
          setOrganizationData(orgData); // optional if you want to use it elsewhere
          organizationInfo = {
            agencia: orgData.agencias?.nombre || '',
            plan: orgData.plan || '',
            estado: orgData.estado || ''
          };
        }
      }
  
      setFormData({
        nombre: profileData.nombre || '',
        email: user.email || '',
        telefono: profileData.telefono || '',
        agencia: organizationInfo.agencia,
        plan: organizationInfo.plan,
        estado: organizationInfo.estado
      });
  
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencyMembers = async () => {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) throw new Error('No user logged in');
  
      // Obtener el organization_id del perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
  
      if (profileError) throw profileError;
  
      const organizationId = profileData?.organization_id;
  
      if (!organizationId) {
        console.warn('El usuario no tiene organization_id asociado');
        return;
      }
  
      // Buscar todos los perfiles con ese organization_id
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, nombre')
        .eq('organization_id', organizationId);
  
      if (membersError) throw membersError;
  
      setAgencyMembers(members || []);
    } catch (error) {
      console.error('Error fetching organization members:', error);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
  
    try {
      setInviteStatus({ message: 'Enviando invitación...', type: 'info' });
  
      const { data: { user } } = await supabase.auth.getUser();
  
      // Obtener organization_id del perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
  
      if (profileError) throw profileError;
  
      if (!profileData.organization_id) {
        setInviteStatus({
          message: 'No tienes una organización asociada para invitar miembros',
          type: 'error'
        });
        return;
      }
  
      // Llamar a tu endpoint /invite_user
      const response = await fetch(`${import.meta.env.VITE_API_URL}/invite_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail,
          organization_id: profileData.organization_id
        })
      });
  
      const result = await response.json();
  
      if (!response.ok) throw new Error(result.error || 'Error inesperado');
  
      setInviteStatus({
        message: 'Invitación enviada correctamente',
        type: 'success'
      });
  
      setInviteEmail('');
  
      setTimeout(() => {
        setShowInviteForm(false);
        setInviteStatus({ message: '', type: '' });
      }, 2000);
  
    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteStatus({
        message: 'Error al enviar la invitación: ' + error.message,
        type: 'error'
      });
    }
  };

  // Removed handleChange and handleSubmit functions since they're no longer needed

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
          {/* Removed edit button */}
        </div>
      </div>
      
      {/* Always show profile details, removed conditional rendering with editing state */}
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
            <span className="data-value">{formData.agencia || 'No especificada'}</span>
          </div>
          
          <div className="data-item">
            <span className="data-label">Estado de la cuenta</span>
            <span className="data-value status">
              <span className={`status-indicator ${formData.estado === 'pagado' ? 'active' : 'inactive'}`}></span>
              {formData.estado === 'pagado' ? 'Activa' : 'Pendiente de activación'}
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
        
        {/* Agency Members Section */}
        <div className="profile-agency-section">
          <div className="section-header">
            <h3>Miembros de la Agencia</h3>
            <button 
              className="invite-button"
              onClick={() => setShowInviteForm(true)}
            >
              Invitar miembro
            </button>
          </div>
          
          {showInviteForm && (
            <div className="invite-form-container">
              <form className="invite-form" onSubmit={handleInviteMember}>
                <h4>Invitar nuevo miembro</h4>
                
                {inviteStatus.message && (
                  <div className={`invite-status ${inviteStatus.type}`}>
                    {inviteStatus.message}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="send-invite-button">
                    Enviar invitación
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteStatus({ message: '', type: '' });
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="members-list">
            {agencyMembers.length === 0 ? (
              <p className="no-members">No hay miembros en tu agencia</p>
            ) : (
              <div className="members-table">
                <div className="members-header">
                  <span className="member-name">Nombre</span>
                  <span className="member-email">Email</span>
                  <span className="member-date">Fecha de unión</span>
                </div>
                
                {agencyMembers.map((member) => (
                  <div key={member.id} className="member-row">
                    <span className="member-name">{member.nombre || 'Sin nombre'}</span>
                    <span className="member-email">{member.email}</span>
                    <span className="member-date">
                      {new Date(member.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          
          {/* Theme Switcher */}
          <div className="config-item">
            <span className="config-label">{t('profile.theme', 'Tema')}</span>
            <div className="theme-switcher">
              <button 
                className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                onClick={() => toggleTheme()}
              >
                {theme === 'light' ? 
                  <span>🌙 {t('profile.darkMode', 'Modo Oscuro')}</span> : 
                  <span>☀️ {t('profile.lightMode', 'Modo Claro')}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
  </div>
  );
};

export default ProfilePage;