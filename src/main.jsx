import "./storage.js";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App, { LoginScreen, AppStyles } from "./App.jsx";
import { supabase, supabaseEnabled } from "./supabase.js";

window.__SUPABASE__ = supabaseEnabled;

function Gate() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (session) {
    return <App key={session.user.id} authEmail={session.user.email} onSignOut={() => supabase.auth.signOut()} />;
  }
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? "E-mail ou senha inválidos." : null;
  };
  return (
    <div className="app">
      <AppStyles />
      <LoginScreen users={[]} onLogin={() => {}} remote={{ signIn }} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(supabaseEnabled ? <Gate /> : <App />);
