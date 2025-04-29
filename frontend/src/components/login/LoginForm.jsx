// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import './LoginForm.css';

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error){
      setErrorMsg(error.message);
    } else{
      const { data: agenciaData, error: agenciaError } = await supabase
      .from('agencias')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

      if (agenciaError) {
        setErrorMsg('No se encontró la agencia vinculada');
      } else {
        // ✅ Pasamos la agencia y el usuario al padre
        onLoginSuccess({ user: data.user, agencia: agenciaData });
      }
    } 
  };

  return (
    <div className="login-form-container">
      <div className="login-form-title">Iniciar sesión</div>
      {errorMsg && <div className="login-form-error">{errorMsg}</div>}
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default LoginForm;
