// Auth: token JWT, sessão e helper de fetch

export const TOKEN_KEY  = 'fa_tk';
const SESSAO_KEY = 'fa_sessao';
const OFFLINE_QUEUE_KEY = 'fa_offline_queue';

export function setAuthToken(t)   { try { localStorage.setItem(TOKEN_KEY, t); } catch {} }
export function clearAuthToken()  { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSAO_KEY); } catch {} }
export function getAuthToken()    { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }

export function salvarSessao(u, tela, split) {
  try {
    const t = ['grupamentos','treino','rank','gerenciar-splits','cardio','historico','graficos','dieta','perfil'].includes(tela) ? tela : 'grupamentos';
    localStorage.setItem(SESSAO_KEY, JSON.stringify({ usuario: u, tela: t, splitAtivo: split || null }));
  } catch {}
}
export function carregarSessao() {
  try { const r = localStorage.getItem(SESSAO_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ─── OFFLINE QUEUE ──────────────────────────────────────────────────────────
// Fila persistente de requisições POST/DELETE que falharam por falta de conexão
export function getOfflineQueue() {
  try { const r = localStorage.getItem(OFFLINE_QUEUE_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveOfflineQueue(q) {
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q)); } catch {}
}
export function enqueueOffline(path, options, localId) {
  const q = getOfflineQueue();
  q.push({ path, options, localId, ts: Date.now() });
  saveOfflineQueue(q);
}
export function clearOfflineQueue() {
  try { localStorage.removeItem(OFFLINE_QUEUE_KEY); } catch {}
}
// Tenta sincronizar fila offline. Retorna { synced, failed }
export async function syncOfflineQueue() {
  const q = getOfflineQueue();
  if (q.length === 0) return { synced: 0, failed: 0 };
  const restante = [];
  let synced = 0;
  for (const item of q) {
    try {
      await apiFetch(item.path, item.options);
      synced++;
    } catch (err) {
      // Se for erro de rede, mantém na fila. Se for erro HTTP (4xx/5xx), descarta
      if (!err.status) restante.push(item);
      // else: erro HTTP real — descarta (série duplicada, etc)
    }
  }
  saveOfflineQueue(restante);
  return { synced, failed: restante.length };
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

// Versão offline-aware: se cair por rede, enfileira e retorna ok localmente
// Usar apenas para writes (POST série, DELETE série)
export async function apiFetchOffline(path, options = {}, localId = null) {
  try {
    return await apiFetch(path, options);
  } catch (err) {
    // Sem status = erro de rede/offline
    if (!err.status) {
      enqueueOffline(path, options, localId);
      return { offline: true, localId };
    }
    throw err;
  }
}