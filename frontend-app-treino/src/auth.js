// Auth: token JWT, sessão e helper de fetch

// ─── AUTH TOKEN — armazenado em memória, não no bundle ───────────────────────
// Nunca fica visível em código estático; é preenchido após login bem-sucedido
export const TOKEN_KEY  = 'fa_tk';
const SESSAO_KEY = 'fa_sessao';
// localStorage sobrevive ao kill do iOS (sessionStorage não)
export function setAuthToken(t)   { try { localStorage.setItem(TOKEN_KEY, t); } catch {} }
export function clearAuthToken()  { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSAO_KEY); } catch {} }
export function getAuthToken()    { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function salvarSessao(u, tela, split) {
  try {
    const t = ['grupamentos','treino','rank','gerenciar-splits','cardio'].includes(tela) ? tela : 'grupamentos';
    localStorage.setItem(SESSAO_KEY, JSON.stringify({ usuario: u, tela: t, splitAtivo: split || null }));
  } catch {}
}
export function carregarSessao() {
  try { const r = localStorage.getItem(SESSAO_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ─── FETCH HELPER ─────────────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const tk = getAuthToken();
  if (tk) headers['Authorization'] = `Bearer ${tk}`;

  const res = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    let detalhe = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(texto);
      detalhe = json.detail || json.message || JSON.stringify(json);
    } catch {
      detalhe = texto || res.statusText || `HTTP ${res.status}`;
    }
    const error = new Error(detalhe);
    error.status = res.status;
    throw error;
  }
  return res.json();
}