import "./storage.js";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { supabase, supabaseEnabled } from "./supabase.js";

const box = { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0B1220", fontFamily: "system-ui, sans-serif", margin: 0 };
const card = { background: "#fff", padding: 32, borderRadius: 14, width: 340, display: "flex", flexDirection: "column", gap: 12 };
const inp = { padding: "10px 12px", border: "1px solid #E4DDCB", borderRadius: 8, fontSize: 14 };
const btn = { padding: "11px", border: 0, borderRadius: 8, background: "#0B1220", color: "#F7F1E4", fontSize: 14, cursor: "pointer" };

function Gate() {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (session) return <App />;

  const entrar = async (e) => {
    e.preventDefault();
    setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha inválidos.");
  };
  return (
    <div style={box}>
      <form style={card} onSubmit={entrar}>
        <h2 style={{ margin: 0 }}>Adventus Capital</h2>
        <span style={{ fontSize: 13, color: "#6B6456" }}>Acesso à plataforma</span>
        <input style={inp} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={inp} type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <span style={{ color: "#8C3B3B", fontSize: 13 }}>{erro}</span>}
        <button style={btn} type="submit">Entrar</button>
      </form>
    </div>
  );
}

createRoot(document.getElementById("root")).render(supabaseEnabled ? <Gate /> : <App />);
