// window.storage usado pelo App. Com Supabase configurado grava na tabela
// app_state; sem as variáveis (dev local) cai para localStorage.
//
// Controle de versão: se a tabela tiver a coluna "version" (supabase/versao.sql),
// getV/setV gravam só se ninguém tiver mudado os dados desde a leitura (evita que
// duas pessoas se sobrescrevam). Sem a coluna, tudo continua funcionando como antes
// (o App ainda junta as alterações antes de gravar, só sem a trava do servidor).
import { supabase, supabaseEnabled } from "./supabase.js";
const keyFor = (key, shared) => (shared ? "shared:" : "priv:") + key;

const local = {
  async get(key, shared) {
    const v = window.localStorage.getItem(keyFor(key, shared));
    return { key, value: v === null ? undefined : v, shared: !!shared };
  },
  async set(key, value, shared) {
    window.localStorage.setItem(keyFor(key, shared), value);
    return { key, value, shared: !!shared };
  },
  async delete(key, shared) {
    window.localStorage.removeItem(keyFor(key, shared));
    return { key, shared: !!shared };
  },
};

let semColunaVersao = false; // vira true se o banco ainda não tem a coluna "version"
const colunaAusente = (error) => !!error && (error.code === "42703" || error.code === "PGRST204" || (/version/i.test(error.message || "") && /column/i.test(error.message || "")));

const remote = {
  async get(key, shared) {
    const { data, error } = await supabase.from("app_state").select("value").eq("key", keyFor(key, shared)).maybeSingle();
    if (error) throw error;
    return { key, value: data ? data.value : undefined, shared: !!shared };
  },
  async set(key, value, shared) {
    const { error } = await supabase.from("app_state").upsert({ key: keyFor(key, shared), value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { key, value, shared: !!shared };
  },
  async delete(key, shared) {
    const { error } = await supabase.from("app_state").delete().eq("key", keyFor(key, shared));
    if (error) throw error;
    return { key, shared: !!shared };
  },
  // lê o valor e a versão atual (version = null quando a coluna ainda não existe)
  async getV(key, shared) {
    const k = keyFor(key, shared);
    if (!semColunaVersao) {
      const { data, error } = await supabase.from("app_state").select("value,version").eq("key", k).maybeSingle();
      if (!error) return { value: data ? data.value : undefined, version: data ? Number(data.version) || 0 : null };
      if (!colunaAusente(error)) throw error;
      semColunaVersao = true;
    }
    const r = await remote.get(key, shared);
    return { value: r.value, version: null };
  },
  // grava só se a versão ainda for a que foi lida; devolve { ok:false } se alguém gravou antes
  async setV(key, value, shared, versaoLida) {
    const k = keyFor(key, shared);
    if (semColunaVersao || versaoLida === null || versaoLida === undefined) {
      if (!semColunaVersao && versaoLida === null) {
        // linha ainda não existe: cria; se outra pessoa criou antes, é conflito
        const { error } = await supabase.from("app_state").insert({ key: k, value, version: 1, updated_at: new Date().toISOString() });
        if (!error) return { ok: true, version: 1 };
        if (error.code === "23505") return { ok: false };
        if (!colunaAusente(error)) throw error;
        semColunaVersao = true;
      }
      await remote.set(key, value, shared);
      return { ok: true, version: null };
    }
    const { data, error } = await supabase
      .from("app_state")
      .update({ value, version: versaoLida + 1, updated_at: new Date().toISOString() })
      .eq("key", k)
      .eq("version", versaoLida)
      .select("version");
    if (error) throw error;
    return data && data.length ? { ok: true, version: data[0].version } : { ok: false };
  },
  // consulta barata (só a data da última gravação) para saber se vale baixar tudo de novo
  async peek(key, shared) {
    const { data, error } = await supabase.from("app_state").select("updated_at").eq("key", keyFor(key, shared)).maybeSingle();
    if (error) throw error;
    return data ? data.updated_at : null;
  },
};

window.storage = supabaseEnabled ? remote : local;
