// window.storage usado pelo App. Com Supabase configurado grava na tabela
// app_state; sem as variáveis (dev local) cai para localStorage.
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
};

window.storage = supabaseEnabled ? remote : local;
