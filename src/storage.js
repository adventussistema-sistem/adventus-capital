// Camada de armazenamento usada pelo App (window.storage). Hoje: localStorage.
// Etapa 3: será substituída por Supabase mantendo a mesma interface.
const keyFor = (key, shared) => (shared ? "shared:" : "priv:") + key;
window.storage = {
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
