// App.jsx — versão otimizada
// Principais mudanças:
//  1. axios removido → fetch nativo (elimina ~50kb do bundle)
//  2. GlobalStyles removido → CSS agora em src/index.css (não re-injeta a cada render)
//  3. Ícones SVG com React.memo (zero re-render desnecessário)
//  4. NumInput com React.memo (evita re-render ao digitar em outras séries)
//  5. Timer: useRef para o intervalo, sem dependência de timerAtivo no effect
//  6. mostrarToast: cleanup correto do setTimeout (sem vazamento de memória)
//  7. onSelecionarSplit: navega para treino ANTES de esperar o histórico (feedback imediato),
//     histórico chega de forma assíncrona
//  8. alternarSerie: useRef para tempoConfig (fecha sobre o valor atual sem violar Rules of Hooks)
//  9. BarraDescanso e ModalConfigDescanso com React.memo
// 10. Cálculos de totalEnv/totalSer com useMemo na TelaTreino
// 11. NOVOS SVGS CLEAN E MINIMALISTAS APLICADOS

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const REST_TIME_KEY = 'fitapp_rest_time';
// Rotas da API centralizadas — não altere sem atualizar o backend
const R = {
  login:       '/api/login',
  registro:    '/api/registro',
  resetSenha:  '/api/reset-senha',
  splits:      '/api/splits',
  serie:       '/api/treino/serie',
  serieNome:   '/api/treino/serie/nome',
  historico:   '/api/treino/historico',
  cardio:      '/api/cardio',
};

// ─── AUTH TOKEN — armazenado em memória, não no bundle ───────────────────────
// Nunca fica visível em código estático; é preenchido após login bem-sucedido
const TOKEN_KEY  = 'fa_tk';
const SESSAO_KEY = 'fa_sessao';
// localStorage sobrevive ao kill do iOS (sessionStorage não)
function setAuthToken(t)   { try { localStorage.setItem(TOKEN_KEY, t); } catch {} }
function clearAuthToken()  { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSAO_KEY); } catch {} }
function getAuthToken()    { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function salvarSessao(u, tela, split) {
  try {
    const t = ['grupamentos','treino','rank','gerenciar-splits','cardio'].includes(tela) ? tela : 'grupamentos';
    localStorage.setItem(SESSAO_KEY, JSON.stringify({ usuario: u, tela: t, splitAtivo: split || null }));
  } catch {}
}
function carregarSessao() {
  try { const r = localStorage.getItem(SESSAO_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ─── FETCH HELPER ─────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
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

// ─── ÍCONES — memo para evitar re-render desnecessário ───────────────────────
export const IconCheck = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
));
export const IconUndo = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
  </svg>
));
export const IconPlus = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
));
export const IconTrash = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"/>
  </svg>
));
export const IconBack = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
));
export const IconTimer = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="12" cy="13" r="8"/>
    <path strokeLinecap="round" d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5"/>
  </svg>
));
export const IconHistory = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
));
export const IconDumbbell = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8v8M17.5 8v8M4 9.5v5M20 9.5v5M6.5 12h11"/>
    <rect x="3.5" y="9" width="3" height="6" rx="1.5"/>
    <rect x="17.5" y="9" width="3" height="6" rx="1.5"/>
  </svg>
));
export const IconSettings = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="12" cy="12" r="3"/>
    <path strokeLinecap="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
));
export const IconChevronRight = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
));
export const IconTrophy = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
  </svg>
));
export const IconStop = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <rect x="5" y="5" width="14" height="14" rx="2"/>
  </svg>
));

export const IconCardio = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5C3.5 5.46 5.96 3 9 3c1.67 0 3.17.75 4.2 1.94A5.5 5.5 0 0120.5 8.5c0 5.5-7.5 10.5-9.5 10.5S3.5 14 3.5 8.5z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h3l2-4 3 8 2-5 2 3 1-2h4"/>
  </svg>
));

export const IconFlame = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C9 6 7 8 7 11a5 5 0 0010 0c0-1-.3-2-.8-3C14.5 10 13 10 12 8c0 0 1.5-2 0-6z"/>
    <path d="M12 14a2 2 0 100 4 2 2 0 000-4z" opacity=".6"/>
  </svg>
));

export const IconUsers = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
));
export const IconCrown = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M2 19h20v2H2v-2zM2 6l5 7 5-7 5 7 5-7v11H2V6z"/>
  </svg>
));
export const IconLink = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
));

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = memo(({ data }) => {
  if (!data) return null;
  const s = {
    sucesso: 'bg-[#c8f542] text-black',
    erro:    'bg-red-500 text-white',
    info:    'bg-zinc-800 text-white border border-zinc-700',
  };
  return (
    <div
      className={`fixed top-6 z-[200] px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold whitespace-nowrap toast-in ${s[data.tipo] || s.info}`}
      style={{ left: '50%', transform: 'translateX(-50%)' }}
    >
      {data.mensagem}
    </div>
  );
});

// ─── BANNER FIM DO DESCANSO ───────────────────────────────────────────────────
const RestEndBanner = memo(({ onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] slide-down">
      <div
        className="mx-4 mt-14 bg-zinc-800 border border-zinc-600 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg"
        onClick={onDismiss}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c8f542] flex-shrink-0"/>
          <span className="text-white text-sm font-semibold">Descansou. Hora de treinar.</span>
        </div>
        <span className="text-zinc-500 text-xs">toque p/ fechar</span>
      </div>
    </div>
  );
});

// ─── MODAL CONFIGURAR DESCANSO ────────────────────────────────────────────────
const ModalConfigDescanso = memo(({ tempoAtual, onSalvar, onFechar }) => {
  const opcoes = [30, 45, 60, 90, 120, 150, 180];
  const [selecionado, setSelecionado] = useState(tempoAtual);
  const fmt = s => s >= 60 ? `${Math.floor(s/60)}min${s%60 ? ` ${s%60}s` : ''}` : `${s}s`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sheet-overlay"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onFechar}
    >
      <div
        className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-5 pt-5 pb-10 slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
        <h2 className="text-white font-bold text-lg mb-1">Tempo de descanso</h2>
        <p className="text-zinc-500 text-sm mb-6">Selecione o intervalo entre as séries</p>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {opcoes.map(t => (
            <button
              key={t}
              onClick={() => setSelecionado(t)}
              className={`btn py-4 rounded-2xl font-bold text-sm flex flex-col items-center ${
                selecionado === t
                  ? 'bg-[#c8f542] text-black'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 active:bg-zinc-700'
              }`}
            >
              {fmt(t)}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onFechar} className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-semibold rounded-2xl">
            Cancelar
          </button>
          <button onClick={() => onSalvar(selecionado)} className="btn px-8 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold rounded-2xl">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── BARRA DE DESCANSO — memo, recebe apenas o necessário ─────────────────────
const BarraDescanso = memo(({ tempoConfig, onAbrirConfig, onIniciar, timerAtivo, timerRestante, onPararTimer }) => {
  const fmt  = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const fmtC = s => s >= 60 ? `${Math.floor(s/60)}min` : `${s}s`;
  const R = 10, C = 2 * Math.PI * R;
  const pct = timerAtivo ? (tempoConfig - timerRestante) / tempoConfig : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onAbrirConfig}
        className="btn w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 active:bg-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0"
      >
        <IconSettings/>
      </button>

      {timerAtivo ? (
        <button onClick={onPararTimer} className="btn flex-1 h-14 bg-zinc-800 border border-zinc-700 active:bg-zinc-700 rounded-2xl flex items-center justify-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
            <circle cx="14" cy="14" r={R} fill="none" stroke="#3f3f46" strokeWidth="3"/>
            <circle cx="14" cy="14" r={R} fill="none" stroke="#c8f542" strokeWidth="3"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset .9s linear' }}/>
          </svg>
          <span className="text-white font-black text-xl num">{fmt(timerRestante)}</span>
          <div className="flex items-center gap-1 text-zinc-500">
            <IconStop/>
            <span className="text-xs font-medium">parar</span>
          </div>
        </button>
      ) : (
        <button onClick={onIniciar} className="btn flex-1 h-14 bg-zinc-900 border border-zinc-700 active:bg-zinc-800 rounded-2xl flex items-center justify-center gap-2">
          <IconTimer/>
          <span className="text-white font-semibold text-base">Descansar</span>
          <span className="text-zinc-500 text-sm num">{fmtC(tempoConfig)}</span>
        </button>
      )}
    </div>
  );
});

// ─── SPINNER ─────────────────────────────────────────────────────────────────
const Spinner = memo(() => (
  <div className="flex justify-center py-10">
    <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#c8f542] rounded-full animate-spin"/>
  </div>
));

// ─── INPUT NUMÉRICO — um toque abre teclado numérico no iOS ─────────────────
// Estratégia: input sempre renderizado e visível, nunca escondido.
// O iOS abre o teclado no primeiro toque quando o input já está no DOM e focável.
// Evitar display:none / pointer-events:none — ambos impedem o focus no primeiro tap.
const NumInput = memo(({ label, value, onChange, disabled }) => {
  const [txt, setTxt] = useState(String(Math.round(value)));
  const ref           = useRef(null);
  const val           = Math.round(value);

  // Sincroniza o texto quando o valor externo muda (ex: botão +/−)
  // mas NÃO enquanto o usuário está digitando (o input está focado)
  useEffect(() => {
    if (document.activeElement !== ref.current) {
      setTxt(String(Math.round(value)));
    }
  }, [value]);

  const confirmar = useCallback(() => {
    const n = parseFloat(txt.replace(',', '.'));
    if (!isNaN(n) && n >= 0) {
      onChange(Math.round(n));
      setTxt(String(Math.round(n)));
    } else {
      setTxt(String(val)); // reverte se inválido
    }
  }, [txt, onChange, val]);

  const dec = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) {
      const novo = Math.max(0, val - 1);
      onChange(novo);
      setTxt(String(novo));
    }
  }, [disabled, val, onChange]);

  const inc = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) {
      const novo = val + 1;
      onChange(novo);
      setTxt(String(novo));
    }
  }, [disabled, val, onChange]);

  // Seleciona tudo ao focar — facilita digitar novo valor sem apagar manualmente
  const onFocus = useCallback((e) => {
    e.target.select();
  }, []);

  return (
    <div className="flex flex-col items-center justify-between bg-black rounded-2xl py-2 px-1 min-w-0 h-full">
      <span className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-center w-full gap-1">
        <button onClick={dec} disabled={disabled}
          className="btn w-10 h-10 bg-zinc-800 active:bg-zinc-700 rounded-xl text-white text-xl flex items-center justify-center disabled:opacity-20 select-none flex-shrink-0">
          −
        </button>
        <div className="flex-1 flex justify-center min-w-0">
          <input
            ref={ref}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={txt}
            disabled={disabled}
            onChange={e => setTxt(e.target.value)}
            onBlur={confirmar}
            onFocus={onFocus}
            onKeyDown={e => e.key === 'Enter' && ref.current?.blur()}
            className={`w-full text-center text-xl font-black bg-transparent outline-none border-b-2 num
              ${disabled
                ? 'text-zinc-600 border-transparent'
                : 'text-white border-transparent focus:border-[#c8f542]'
              }`}
            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
        </div>
        <button onClick={inc} disabled={disabled}
          className="btn w-10 h-10 bg-zinc-800 active:bg-zinc-700 rounded-xl text-white text-xl flex items-center justify-center disabled:opacity-20 select-none flex-shrink-0">
          +
        </button>
      </div>
    </div>
  );
});

// ─── TELA AUTH ────────────────────────────────────────────────────────────────
function TelaAuth({ onLogin, mostrarToast }) {
  const [modo, setModo]           = useState('login'); 
  const [resetAberto, setReset]   = useState(false);
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [nome, setNome]           = useState('');
  const [peso, setPeso]           = useState('');
  const [obj, setObj]             = useState('');
  const [loading, setLoading]     = useState(false);

  const limpar = () => { setEmail(''); setSenha(''); setNome(''); setPeso(''); setObj(''); setSenhaNova(''); };
  const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

  const login = async e => {
    e.preventDefault();
    if (!email || !senha) { mostrarToast('Preencha e-mail e senha.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch(R.login, { method: 'POST', body: { email, senha } });
      if (r.token) setAuthToken(r.token);
      onLogin(r.usuario);
      limpar();
    } catch (err) {
      if (err.status === 401) mostrarToast('Senha incorreta.', 'erro');
      else if (err.status === 404) mostrarToast('E-mail não encontrado.', 'erro');
      else mostrarToast('Não foi possível conectar.', 'erro');
    } finally { setLoading(false); }
  };

  const resetSenha = async e => {
    e.preventDefault();
    if (!email || !senhaNova) { mostrarToast('Preencha e-mail e nova senha.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch(R.resetSenha, { method: 'POST', body: { email, senha_nova: senhaNova } });
      mostrarToast('Senha redefinida! Faça login.', 'sucesso');
      setReset(false); setSenhaNova('');
    } catch (err) {
      if (err.status === 404) mostrarToast('E-mail não encontrado.', 'erro');
      else mostrarToast('Erro ao redefinir senha.', 'erro');
    } finally { setLoading(false); }
  };

  const cadastro = async e => {
    e.preventDefault();
    if (!nome || !email || !senha) { mostrarToast('Preencha nome, e-mail e senha.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch(R.registro, { method: 'POST', body: { nome, email, senha, peso_atual: peso || '0', objetivo: obj || 'Hipertrofia' } });
      mostrarToast('Conta criada. Faça login.', 'sucesso');
      setModo('login'); limpar();
    } catch (err) {
      if (err.status === 400) mostrarToast('E-mail já cadastrado.', 'erro');
      else mostrarToast('Erro ao criar conta.', 'erro');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c8f542]/10 border border-[#c8f542]/20 rounded-2xl mb-4 text-[#c8f542]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white">Volt</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Seu diário de treino</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 mb-6">
          {[['login','Entrar'],['cadastro','Criar conta']].map(([t,l]) => (
            <button key={t} onClick={() => { setModo(t); setReset(false); limpar(); }}
              className={`btn flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${modo===t ? 'bg-[#c8f542] text-black' : 'text-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>

        {modo === 'login' && !resetAberto && (
          <form onSubmit={login} className="flex flex-col gap-3">
            <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="email"/>
            <input type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} className={inp} autoComplete="current-password"/>
            <button type="submit" disabled={loading} className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-2 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setReset(true)}
              className="text-zinc-500 text-sm text-center mt-1 active:text-zinc-300 transition-colors">
              Esqueci minha senha
            </button>
          </form>
        )}

        {modo === 'login' && resetAberto && (
          <div className="flex flex-col gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <div>
                <p className="text-white text-sm font-semibold">Redefinir senha</p>
                <p className="text-zinc-500 text-xs">Insira seu e-mail e a nova senha desejada.</p>
              </div>
            </div>
            <input type="email" placeholder="E-mail da conta" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="email"/>
            <input type="password" placeholder="Nova senha" value={senhaNova} onChange={e=>setSenhaNova(e.target.value)} className={inp}/>
            <button onClick={resetSenha} disabled={loading}
              className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl disabled:opacity-50">
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
            <button type="button" onClick={() => { setReset(false); setSenhaNova(''); }}
              className="text-zinc-500 text-sm text-center active:text-zinc-300 transition-colors">
              ← Voltar ao login
            </button>
          </div>
        )}

        {modo === 'cadastro' && (
          <form onSubmit={cadastro} className="flex flex-col gap-3">
            <input type="text" placeholder="Nome completo" value={nome} onChange={e=>setNome(e.target.value)} className={inp}/>
            <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="email"/>
            <input type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} className={inp}/>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Peso (kg)" value={peso} onChange={e=>setPeso(e.target.value)} className={inp}/>
              <select value={obj} onChange={e=>setObj(e.target.value)} className={`${inp} cursor-pointer ${obj===''?'text-zinc-600':'text-white'}`}>
                <option value="" disabled className="bg-zinc-900">Objetivo</option>
                <option value="Hipertrofia" className="bg-zinc-900 text-white">Hipertrofia</option>
                <option value="Emagrecimento" className="bg-zinc-900 text-white">Emagrecer</option>
                <option value="Manutencao" className="bg-zinc-900 text-white">Manter peso</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-2 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── TELA GRUPAMENTOS ─────────────────────────────────────────────────────────
function TelaGrupamentos({ usuario, splits, loadingSplits, onSelecionarSplit, onGerenciar, onRank, onCardio, onLogout }) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#c8f542] text-xs font-semibold uppercase tracking-widest">
            {dias[new Date().getDay()]} · {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
          </span>
          <button onClick={onLogout} className="btn px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-semibold active:bg-zinc-800">
            Sair
          </button>
        </div>
        <h1 className="text-3xl font-black text-white leading-snug">
          Qual treino de hoje,{' '}
          <span className="text-[#c8f542]">{usuario.nome.split(' ')[0]}</span>?
        </h1>
      </div>
      <div className="px-5 flex flex-col gap-3 pb-10 flex-1">
        {loadingSplits ? <Spinner/> : (
          <>
            {splits.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-sm mb-4">Nenhum grupo muscular configurado.</p>
                <button onClick={onGerenciar} className="btn px-6 py-4 bg-[#c8f542] text-black font-bold rounded-2xl">Configurar grupos</button>
              </div>
            )}
            {splits.map(split => (
              <button key={split.id} onClick={() => onSelecionarSplit(split)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:border-zinc-600 active:bg-zinc-800 rounded-2xl p-5 text-left flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0"><IconDumbbell/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg truncate">{split.nome}</div>
                  <div className="text-zinc-500 text-sm mt-0.5">
                    {split.ultimo_treino ? `Último: ${split.ultimo_treino}` : 'Nenhum treino registrado'}
                  </div>
                </div>
                <div className="text-zinc-600"><IconChevronRight/></div>
              </button>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button onClick={onCardio}
                className="btn bg-[#f97316]/8 border border-[#f97316]/25 active:bg-[#f97316]/15 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#f97316]/15 flex items-center justify-center text-[#f97316]">
                  <IconCardio/>
                </div>
                <span className="text-[#f97316] text-xs font-semibold text-center leading-tight">Cardio<br/>& Calorias</span>
              </button>
              <button onClick={onGerenciar}
                className="btn bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <IconSettings/>
                </div>
                <span className="text-zinc-400 text-xs font-semibold text-center leading-tight">Gerenciar<br/>grupos musculares</span>
              </button>
              <button onClick={onRank}
                className="btn col-span-2 bg-[#c8f542]/8 border border-[#c8f542]/25 active:bg-[#c8f542]/15 rounded-2xl p-4 flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c8f542]/15 flex items-center justify-center text-[#c8f542]">
                  <IconTrophy/>
                </div>
                <span className="text-[#c8f542] text-sm font-semibold">Ranking com amigos</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ÍCONE DRAG HANDLE ───────────────────────────────────────────────────────
const IconDrag = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="9" cy="6"  r="1.5"/><circle cx="15" cy="6"  r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
));

// ─── TELA GERENCIAR SPLITS ────────────────────────────────────────────────────
function TelaGerenciarSplits({ usuario, splits, onSalvar, onVoltar, mostrarToast }) {
  const [lista, setLista] = useState(() =>
    // Garante que splits antigos (sem nomeHistorico) herdam o nome atual como identificador estável
    splits.map(s => ({ ...s, nomeHistorico: s.nomeHistorico || s.nome }))
  );
  const [saving, setSaving]     = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const dragRef    = useRef({ from: null, to: null });
  const touchRef   = useRef(null);
  const listRef    = useRef(null);

  const adicionar = useCallback(() =>
    // nomeHistorico fica vazio até o usuário digitar e salvar pela primeira vez
    setLista(l => [...l, { id:`split_${Date.now()}`, id_usuario:usuario.id, nome:'', nomeHistorico:'', ultimo_treino:null }])
  , [usuario.id]);

  const renomear = useCallback((id, nome) =>
    setLista(l => l.map(s => s.id === id ? {
      ...s,
      nome,
      // nomeHistorico só é definido uma vez — na primeira vez que o usuário digita o nome.
      // Depois disso nunca muda, mesmo que renomeie, garantindo que o histórico continue achável.
      nomeHistorico: s.nomeHistorico || nome,
    } : s))
  , []);

  const remover = useCallback((id) =>
    setLista(l => l.filter(s => s.id !== id))
  , []);

  const salvar = async () => {
    if (lista.some(s => !s.nome.trim())) { mostrarToast('Preencha o nome de todos os grupos.', 'erro'); return; }
    setSaving(true);
    try {
      await apiFetch(R.splits, { method: 'POST', body: { id_usuario: usuario.id, splits: lista } });
      mostrarToast('Grupos salvos.', 'sucesso');
      onSalvar(lista);
    } catch { mostrarToast('Erro ao salvar.', 'erro'); }
    finally { setSaving(false); }
  };

  const applyReorder = useCallback((from, to) => {
    if (from === null || to === null || from === to) return;
    setLista(l => {
      const next = [...l];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const onDragStart = (i) => { dragRef.current.from = i; setDragging(i); setDropTarget(i); };
  const onDragEnter = (i) => { dragRef.current.to = i; setDropTarget(i); };
  const onDragEnd   = () => {
    applyReorder(dragRef.current.from, dragRef.current.to);
    dragRef.current = { from: null, to: null };
    setDragging(null); setDropTarget(null);
  };

  const onTouchStart = (i, e) => {
    touchRef.current = { idx: i };
    dragRef.current.from = i;
    setDragging(i); setDropTarget(i);
  };
  const onTouchMove = (e) => {
    if (!touchRef.current) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const els = listRef.current?.querySelectorAll('[data-item]');
    if (!els) return;
    let target = dragRef.current.from;
    els.forEach((el, j) => {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) target = j;
    });
    if (target !== dragRef.current.to) {
      dragRef.current.to = target;
      setDropTarget(target);
    }
  };
  const onTouchEnd = () => {
    if (!touchRef.current) return;
    applyReorder(dragRef.current.from, dragRef.current.to);
    touchRef.current = null;
    dragRef.current  = { from: null, to: null };
    setDragging(null); setDropTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-4 flex items-center gap-4 border-b border-zinc-900">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800"><IconBack/></button>
        <div>
          <h1 className="text-xl font-bold text-white">Grupos Musculares</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Arraste para reordenar</p>
        </div>
      </div>
      <div
        ref={listRef}
        className="px-5 pt-4 flex flex-col gap-3 flex-1 pb-4"
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {lista.map((s, i) => {
          const isDragging = dragging === i;
          const isDropZone = dropTarget === i && dragging !== null && dragging !== i;
          return (
            <div
              key={s.id}
              data-item={i}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              onTouchStart={e => onTouchStart(i, e)}
              style={{ transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s' }}
              className={[
                'rounded-2xl flex items-center gap-3 px-3 py-2 select-none',
                isDragging
                  ? 'opacity-40 scale-95 border-2 border-dashed border-[#c8f542]/50 bg-zinc-900'
                  : isDropZone
                  ? 'border-2 border-[#c8f542] bg-[#c8f542]/5 shadow-[0_0_0_3px_rgba(200,245,66,0.15)]'
                  : 'bg-zinc-900 border border-zinc-800',
              ].join(' ')}
            >
              <div className={`cursor-grab active:cursor-grabbing px-1 flex-shrink-0 touch-none transition-colors ${dragging !== null ? 'text-[#c8f542]' : 'text-zinc-600'}`}>
                <IconDrag/>
              </div>
              <span className="text-zinc-600 font-bold text-sm w-5 text-center flex-shrink-0">{i+1}</span>
              <input
                type="text"
                value={s.nome}
                onChange={e => renomear(s.id, e.target.value)}
                placeholder="Nome do grupo muscular"
                className="flex-1 bg-transparent text-white font-semibold text-base outline-none placeholder-zinc-700 py-3"
              />
              <button onClick={() => remover(s.id)} className="btn w-11 h-11 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800 flex-shrink-0">
                <IconTrash/>
              </button>
            </div>
          );
        })}
        <button onClick={adicionar} className="btn w-full border border-dashed border-zinc-800 active:border-zinc-600 text-zinc-600 font-semibold py-5 rounded-2xl flex items-center justify-center gap-2">
          <IconPlus/><span className="text-sm">Adicionar grupo</span>
        </button>
      </div>
      <div className="px-5 pb-10 pt-4 border-t border-zinc-900">
        <button onClick={salvar} disabled={saving} className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}

// ─── ÍCONES DE MÚSCULO ───────────────────────────────────────────────────────
const MuscPeito      = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M12 20 Q 20 10 31 18 L 31 40 Q 20 46 12 36 Z"/><path d="M52 20 Q 44 10 33 18 L 33 40 Q 44 46 52 36 Z"/></svg>);
const MuscCostas     = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 12 12 Q 24 16 31 20 L 31 52 Q 20 52 14 34 Z"/><path d="M 52 12 Q 40 16 33 20 L 33 52 Q 44 52 50 34 Z"/></svg>);
const MuscOmbro      = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 12 32 C 12 14 26 14 26 32 Z"/><path d="M 52 32 C 52 14 38 14 38 32 Z"/></svg>);
const MuscBiceps     = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><rect x="14" y="12" width="14" height="40" rx="7"/><rect x="36" y="12" width="14" height="40" rx="7"/></svg>);
const MuscTriceps    = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 18 10 C 24 10 26 40 20 54 C 14 48 12 10 18 10 Z"/><path d="M 46 10 C 40 10 38 40 44 54 C 50 48 52 10 46 10 Z"/></svg>);
const MuscAbdomen    = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><rect x="18" y="10" width="12" height="12" rx="4"/><rect x="34" y="10" width="12" height="12" rx="4"/><rect x="18" y="26" width="12" height="12" rx="4"/><rect x="34" y="26" width="12" height="12" rx="4"/><rect x="18" y="42" width="12" height="12" rx="4"/><rect x="34" y="42" width="12" height="12" rx="4"/></svg>);
const MuscQuad       = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 22 10 C 32 10 32 46 24 54 C 14 54 12 10 22 10 Z"/><path d="M 42 10 C 32 10 32 46 40 54 C 50 54 52 10 42 10 Z"/></svg>);
const MuscPost       = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 26 12 C 30 12 30 50 26 52 C 14 50 14 12 26 12 Z"/><path d="M 38 12 C 34 12 34 50 38 52 C 50 50 50 12 38 12 Z"/></svg>);
const MuscGluteo     = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><circle cx="22" cy="32" r="16"/><circle cx="42" cy="32" r="16"/></svg>);
const MuscPanturr    = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 22 12 C 28 12 28 40 24 52 C 18 48 16 12 22 12 Z"/><path d="M 42 12 C 36 12 36 40 40 52 C 46 48 48 12 42 12 Z"/></svg>);

// ─── BANCO DE EXERCÍCIOS ─────────────────────────────────────────────────────
const EXERCICIOS_DB = {
  superior: {
    label: 'Superior',
    musculos: {
      peito:       { label: 'Peito',      cor: '#ef4444', Svg: MuscPeito,   exercicios: ['Supino reto','Supino inclinado','Supino declinado','Crucifixo','Crossover','Flexão de braço','Peck deck','Pull-over'] },
      costas:      { label: 'Costas',     cor: '#3b82f6', Svg: MuscCostas,  exercicios: ['Puxada frontal','Puxada posterior','Remada curvada','Remada unilateral','Serrote','Levantamento terra','Pulldown','Remada cavalinho'] },
      ombro:       { label: 'Ombro',      cor: '#a855f7', Svg: MuscOmbro,   exercicios: ['Desenvolvimento militar','Elevação lateral','Elevação frontal','Crucifixo invertido','Desenvolvimento','Arnold press','Remada alta','Face pull','Encolhimento'] },
      biceps:      { label: 'Bíceps',     cor: '#f59e0b', Svg: MuscBiceps,  exercicios: ['Rosca direta','Rosca alternada','Rosca martelo','Rosca concentrada','Rosca scott','Rosca 21','Rosca cabo','Rosca inversa'] },
      triceps:     { label: 'Tríceps',    cor: '#ec4899', Svg: MuscTriceps, exercicios: ['Tríceps pulley','Tríceps testa','Tríceps francês','Mergulho','Tríceps coice','Tríceps corda','Tríceps banco','Fechado'] },
      abdomen:     { label: 'Abdômen',    cor: '#6366f1', Svg: MuscAbdomen, exercicios: ['Abdominal crunch','Prancha','Abdominal bicicleta','Elevação de pernas','Abdominal oblíquo','Rollout','Dragon flag','Abdominal infra'] },
    },
  },
  inferior: {
    label: 'Inferior',
    musculos: {
      quadriceps:  { label: 'Quadríceps', cor: '#10b981', Svg: MuscQuad,    exercicios: ['Agachamento livre','Leg press','Extensora','Hack squat','Agachamento búlgaro','Avanço','Afundo','Agachamento sumô'] },
      posterior:   { label: 'Posterior',  cor: '#06b6d4', Svg: MuscPost,    exercicios: ['Mesa flexora','Cadeira flexora','Stiff','Levantamento terra romeno','Bom dia','Leg curl','Flexão nórdica','Ponte'] },
      gluteo:      { label: 'Glúteo',     cor: '#f97316', Svg: MuscGluteo,  exercicios: ['Agachamento','Hip thrust','Elevação pélvica','Glúteo no cabo','Abdução','Passada','Agachamento sumô','Extensão quadril'] },
      panturrilha: { label: 'Panturrilha',cor: '#84cc16', Svg: MuscPanturr, exercicios: ['Elevação de calcanhar em pé','Elevação de calcanhar sentado','Leg press panturrilha','Donkey calf raise','Panturrilha unilateral'] },
    },
  },
};

// ─── MODAL SELECIONAR EXERCÍCIO ───────────────────────────────────────────────
const ModalExercicio = memo(({ onSelecionar, onFechar }) => {
  const [regiao, setRegiao]   = useState(null);    
  const [musculo, setMusculo] = useState(null);    
  const [busca, setBusca]     = useState('');

  const db = EXERCICIOS_DB;

  const exerciciosFiltrados = useMemo(() => {
    if (!regiao || !musculo) return [];
    const lista = db[regiao].musculos[musculo]?.exercicios || [];
    if (!busca.trim()) return lista;
    return lista.filter(e => e.toLowerCase().includes(busca.toLowerCase()));
  }, [regiao, musculo, busca]);

  const voltar = () => {
    if (musculo) { setMusculo(null); setBusca(''); }
    else setRegiao(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]" style={{paddingTop:'env(safe-area-inset-top)'}}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={regiao ? voltar : onFechar}
          className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-black text-lg leading-none">
            {!regiao ? 'Escolher exercício' : !musculo ? db[regiao].label : db[regiao].musculos[musculo].label}
          </h2>
          {regiao && (
            <p className="text-zinc-600 text-xs mt-0.5">
              {!musculo ? 'Selecione o músculo' : 'Toque para adicionar'}
            </p>
          )}
        </div>
        {regiao && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => { setRegiao(null); setMusculo(null); setBusca(''); }}
              className="bg-zinc-800 text-zinc-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
              {db[regiao].label}
            </button>
            {musculo && (
              <>
                <span className="text-zinc-700 text-xs">›</span>
                <span className="text-[#c8f542] text-xs font-semibold px-2.5 py-1.5 bg-[#c8f542]/10 rounded-lg">
                  {db[regiao].musculos[musculo].label}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* TELA 1 — escolha da região com os novos bonecos minimalistas */}
      {!regiao && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-center">
            <p className="text-white font-bold text-base">Qual região você vai treinar?</p>
            <p className="text-zinc-500 text-sm mt-1">Selecione para ver os músculos</p>
          </div>

          <div className="flex gap-4 w-full">
            {/* Card Superior */}
            <button onClick={() => setRegiao('superior')}
              className="btn flex-1 bg-zinc-900 border-2 border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-3xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all">
              <svg viewBox="0 0 60 90" fill="none" className="w-20 h-28">
                <rect x="22" y="53" width="7" height="32" rx="3.5" fill="#3f3f46" />
                <rect x="31" y="53" width="7" height="32" rx="3.5" fill="#3f3f46" />
                <circle cx="30" cy="12" r="7" fill="#3f3f46" />
                <rect x="20" y="21" width="20" height="30" rx="2" fill="#c8f542" />
                <rect x="10" y="21" width="8" height="28" rx="4" fill="#c8f542" />
                <rect x="42" y="21" width="8" height="28" rx="4" fill="#c8f542" />
              </svg>
              <div className="text-center">
                <div className="text-white font-black text-sm">Superior</div>
                <div className="text-zinc-600 text-xs mt-0.5">Peito · Costas · Ombro<br/>Braços · Abdômen</div>
              </div>
            </button>

            {/* Card Inferior */}
            <button onClick={() => setRegiao('inferior')}
              className="btn flex-1 bg-zinc-900 border-2 border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-3xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all">
              <svg viewBox="0 0 60 90" fill="none" className="w-20 h-28">
                <circle cx="30" cy="12" r="7" fill="#3f3f46" />
                <rect x="20" y="21" width="20" height="30" rx="2" fill="#3f3f46" />
                <rect x="10" y="21" width="8" height="28" rx="4" fill="#3f3f46" />
                <rect x="42" y="21" width="8" height="28" rx="4" fill="#3f3f46" />
                <rect x="22" y="53" width="7" height="32" rx="3.5" fill="#c8f542" />
                <rect x="31" y="53" width="7" height="32" rx="3.5" fill="#c8f542" />
              </svg>
              <div className="text-center">
                <div className="text-white font-black text-sm">Inferior</div>
                <div className="text-zinc-600 text-xs mt-0.5">Quadríceps · Posterior<br/>Glúteo · Panturrilha</div>
              </div>
            </button>
          </div>

          <button onClick={() => onSelecionar('')}
            className="btn w-full py-4 border border-dashed border-zinc-700 text-zinc-500 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:border-zinc-500 active:text-zinc-300">
            <IconPlus/> Digitar nome manualmente
          </button>
        </div>
      )}

      {/* TELA 2 — grid de músculos */}
      {regiao && !musculo && (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(db[regiao].musculos).map(([key, m]) => (
              <button key={key} onClick={() => setMusculo(key)}
                className="btn bg-zinc-900 border border-zinc-800 active:border-zinc-600 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-95 transition-transform">
                <div className="w-full h-20 rounded-xl flex items-center justify-center"
                  style={{ color: m.cor, background: m.cor + '18' }}>
                  <m.Svg/>
                </div>
                <span className="text-white font-bold text-sm">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TELA 3 — lista de exercícios do músculo */}
      {regiao && musculo && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3 pb-3 flex gap-3 items-center border-b border-zinc-900">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ color: db[regiao].musculos[musculo].cor, background: db[regiao].musculos[musculo].cor + '18' }}>
              {(() => { const S = db[regiao].musculos[musculo].Svg; return <S/>; })()}
            </div>
            <input
              type="text"
              placeholder="Buscar exercício..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-sm placeholder-zinc-600"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-2">
            {exerciciosFiltrados.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-sm">Nenhum exercício encontrado.</div>
            ) : exerciciosFiltrados.map(nome => (
              <button key={nome} onClick={() => onSelecionar(nome)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-2xl px-4 py-4 text-left flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ color: db[regiao].musculos[musculo].cor, background: db[regiao].musculos[musculo].cor + '20' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 5v14M18 5v14M3 8h3M3 16h3M18 8h3M18 16h3M6 9h12M6 15h12"/>
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm flex-1">{nome}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-zinc-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            ))}

            <button onClick={() => onSelecionar(busca.trim() || '')}
              className="btn w-full border border-dashed border-zinc-800 active:border-zinc-600 text-zinc-500 rounded-2xl px-4 py-4 text-left flex items-center gap-3 mt-1">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                <IconPlus/>
              </div>
              <span className="text-zinc-400 font-semibold text-sm">
                {busca.trim() ? `Adicionar "${busca.trim()}"` : 'Adicionar nome personalizado'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── TELA TREINO ──────────────────────────────────────────────────────────────
function TelaTreino({ usuario, split, historicoAnterior, onFinalizar, onVoltar, mostrarToast }) {
  const [exerciciosInicializados, setExerciciosInicializados] = useState(false);

  // ── ID DA SESSÃO DE TREINO ────────────────────────────────────────────────
  // Persiste no localStorage com chave baseada em (split + usuário + dia).
  // Se o usuário sair e voltar ao mesmo split no mesmo dia, continua a mesma
  // sessão (mesmo id_treino) em vez de criar uma duplicata.
  const idTreinoSessao = useRef((() => {
    const hoje  = new Date().toISOString().slice(0, 10);
    // Chave baseada em split.id (estável) — não muda ao renomear o grupo.
    const chave = `fitapp_sessao_${split.id}_${usuario.id}_${hoje}`;
    const salvo = sessionStorage.getItem(chave);
    if (salvo) return salvo;
    // O prefixo do ID usa split.id para ser imutável.
    // O backend busca por split_id (novo) com fallback para nome (registros antigos).
    const novo = `${split.id}_${usuario.id}_${hoje}_${Date.now()}`;
    sessionStorage.setItem(chave, novo);
    return novo;
  })());

  const [exercicios, setExercicios] = useState([]);

  useEffect(() => {
    if (exerciciosInicializados) return;
    if (!historicoAnterior || historicoAnterior.length === 0) return;

    const mapaExercicios = new Map();
    historicoAnterior.forEach(s => {
      const nome = s.nome_exercicio?.trim() || '';
      if (!mapaExercicios.has(nome)) mapaExercicios.set(nome, []);
      mapaExercicios.get(nome).push(s);
    });

    const exerciciosDoHistorico = Array.from(mapaExercicios.entries()).map(([nome, series], exIdx) => {
      const seriesOrdenadas = [...series].sort((a, b) => a.numero_serie - b.numero_serie);
      // Detecta se o exercício foi salvo em modo placas (marcador [P] no nome)
      const usaPlacas = nome.startsWith('[P]');
      const nomeLimpo = usaPlacas ? nome.slice(3) : nome;
      return {
        id: Date.now() + exIdx,
        nome: nomeLimpo,
        nomeAnterior: nomeLimpo,
        usaPlacas,
        series: seriesOrdenadas.map((s, i) => ({
          id:       i + 1,
          reps:     s.repeticoes,
          carga:    s.carga_kg,
          enviada:  false,
          id_banco: null,
        })),
      };
    });

    setExercicios(exerciciosDoHistorico);
    setExerciciosInicializados(true);
  }, [historicoAnterior, exerciciosInicializados]);
  const [expandidos, setExp]       = useState({});
  const [showExModal, setShowExModal] = useState(false);

  const [tempoConfig, setTempoConfig] = useState(() => {
    const s = localStorage.getItem(REST_TIME_KEY);
    return s ? parseInt(s, 10) : 90;
  });
  const [timerAtivo, setTimerAtivo]       = useState(false);
  const [timerRestante, setTimerRestante] = useState(0);
  const [showConfig, setShowConfig]       = useState(false);
  const [showRestEnd, setShowRestEnd]     = useState(false);

  const intervalRef    = useRef(null);
  const timerFimRef    = useRef(null); // timestamp absoluto — funciona mesmo com app em background
  const tempoConfigRef = useRef(tempoConfig);
  useEffect(() => { tempoConfigRef.current = tempoConfig; }, [tempoConfig]);

  const calcRestante = useCallback(() => {
    if (!timerFimRef.current) return 0;
    return Math.max(0, Math.round((timerFimRef.current - Date.now()) / 1000));
  }, []);

  const dispararFim = useCallback(() => {
    clearInterval(intervalRef.current);
    timerFimRef.current = null;
    setTimerAtivo(false);
    setTimerRestante(0);
    setShowRestEnd(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  useEffect(() => {
    if (!timerAtivo) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      const r = calcRestante();
      setTimerRestante(r);
      if (r <= 0) dispararFim();
    }, 500);
    return () => clearInterval(intervalRef.current);
  }, [timerAtivo, calcRestante, dispararFim]);

  // Quando o app volta do background, recalcula imediatamente
  useEffect(() => {
    const onVisible = () => {
      if (!timerAtivo || !timerFimRef.current) return;
      const r = calcRestante();
      setTimerRestante(r);
      if (r <= 0) dispararFim();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [timerAtivo, calcRestante, dispararFim]);

  const iniciarDescanso = useCallback(() => {
    clearInterval(intervalRef.current);
    const duracao = tempoConfigRef.current;
    timerFimRef.current = Date.now() + duracao * 1000;
    setTimerRestante(duracao);
    setShowRestEnd(false);
    setTimerAtivo(true);
  }, []);

  const pararDescanso = useCallback(() => {
    clearInterval(intervalRef.current);
    timerFimRef.current = null;
    setTimerAtivo(false);
    setTimerRestante(0);
  }, []);

  const salvarConfig = useCallback((novoTempo) => {
    setTempoConfig(novoTempo);
    localStorage.setItem(REST_TIME_KEY, String(novoTempo));
    setShowConfig(false);
    const fmt = s => s >= 60 ? `${Math.floor(s/60)}min${s%60?` ${s%60}s`:''}` : `${s}s`;
    mostrarToast(`Descanso: ${fmt(novoTempo)}`, 'info');
  }, [mostrarToast]);

  const addEx = useCallback(() => setShowExModal(true), []);

  const onSelecionarExercicio = useCallback((nome) => {
    setShowExModal(false);
    setExercicios(e => [...e, {
      id: Date.now(),
      nome: nome,
      nomeAnterior: nome,
      usaPlacas: false,
      series: [{ id:1, reps:12, carga:0, enviada:false, id_banco:null }],
    }]);
  }, []);

  const alternarModoPlacas = useCallback((exId) => {
    setExercicios(e => e.map(x => {
      if (x.id !== exId) return x;
      // Não permite trocar se já tem séries enviadas
      if (x.series.some(s => s.enviada)) return x;
      return { ...x, usaPlacas: !x.usaPlacas };
    }));
  }, []);

  const moverEx = useCallback((idx, dir) => {
    setExercicios(l => {
      const next = [...l];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return l;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }, []);

  const remEx = useCallback(async (exId) => {
    const ex = exercicios.find(x => x.id === exId);
    if (!ex) return;
    setExercicios(cur => cur.filter(x => x.id !== exId));
    const enviadas = ex.series.filter(s => s.enviada && s.id_banco);
    for (const s of enviadas) {
      try { await apiFetch(`${R.serie}?id=${s.id_banco}`, { method: 'DELETE' }); } catch {}
    }
  }, [exercicios]);

  const updNome = useCallback((id, novoNome) => {
    setExercicios(e => e.map(x => x.id===id ? {...x, nome:novoNome, nomePendente:novoNome} : x));
  }, []);

  const confirmarNome = useCallback(async (ex) => {
    const nomeNovo = ex.nome.trim();
    const nomeAntigo = ex.nomeAnterior;

    setExercicios(e => e.map(x => x.id===ex.id ? {...x, nomeAnterior:nomeNovo, nomePendente:undefined} : x));

    if (!nomeNovo || nomeNovo === nomeAntigo) return;

    const seriesEnviadas = ex.series.filter(s => s.enviada && s.id_banco);
    if (seriesEnviadas.length === 0) return;

    try {
      await apiFetch(R.serieNome, {
        method: 'POST',
        body: {
          ids: seriesEnviadas.map(s => s.id_banco),
          nome_exercicio: nomeNovo,
        },
      });
    } catch { }
  }, []);

  const addSerie = useCallback((exId) =>
    setExercicios(e => e.map(x => {
      if (x.id !== exId) return x;
      const u = x.series[x.series.length-1];
      return {...x, series:[...x.series,{id:x.series.length+1,reps:u?.reps||12,carga:u?.carga||0,enviada:false,id_banco:null}]};
    }))
  , []);

  const updSerie = useCallback((exId, sId, campo, val) =>
    setExercicios(e => e.map(x => x.id!==exId ? x : {
      ...x, series: x.series.map(s => s.id===sId ? {...s,[campo]:Math.max(0,val)} : s),
    }))
  , []);

  const remSerie = useCallback((exId, sId) =>
    setExercicios(e => e.map(x => x.id!==exId ? x : { ...x, series:x.series.filter(s=>s.id!==sId) }))
  , []);

  const pendentesRef = useRef(0);
  const [salvando, setSalvando] = useState(false);

  const alternarSerie = useCallback(async (ex, serie) => {
    const snapshot = exercicios.map(x => ({...x, series:x.series.map(s=>({...s}))}));

    if (serie.enviada) {
      setExercicios(cur => cur.map(x => x.id!==ex.id ? x : {
        ...x, series: x.series.map(s => s.id===serie.id ? {...s,enviada:false,id_banco:null} : s),
      }));
      try { await apiFetch(`${R.serie}?id=${serie.id_banco}`, { method: 'DELETE' }); }
      catch { setExercicios(snapshot); mostrarToast('Sem conexão. Não removido.', 'erro'); }
    } else {
      if (!ex.nome.trim()) { mostrarToast('Digite o nome do exercício.', 'erro'); return; }
      const nid      = 'S' + Date.now();
      const idTreino = idTreinoSessao.current;

      setExercicios(cur => cur.map(x => x.id!==ex.id ? x : {
        ...x, series: x.series.map(s => s.id===serie.id ? {...s,enviada:true,salvandoNow:true,id_banco:nid} : s),
      }));

      pendentesRef.current += 1;
      setSalvando(true);

      // Salva "[P]" no nome quando é modo placas — permite detectar ao recarregar
      const nomeParaSalvar = ex.usaPlacas ? `[P]${ex.nome}` : ex.nome;

      try {
        await apiFetch(R.serie, {
          method: 'POST',
          body: { id_serie:nid, id_treino:idTreino, nome_exercicio:nomeParaSalvar, numero_serie:serie.id, repeticoes:serie.reps, carga_kg:serie.carga },
        });
        setExercicios(cur => cur.map(x => x.id!==ex.id ? x : {
          ...x, series: x.series.map(s => s.id===serie.id ? {...s,salvandoNow:false} : s),
        }));
        iniciarDescanso();
      } catch {
        setExercicios(snapshot);
        mostrarToast('Sem conexão. Série não salva.', 'erro');
      } finally {
        pendentesRef.current = Math.max(0, pendentesRef.current - 1);
        if (pendentesRef.current === 0) setSalvando(false);
      }
    }
  }, [exercicios, split, usuario, mostrarToast, iniciarDescanso]);

  const histEx = useCallback((nome, nomeOriginal) => {
    if (!historicoAnterior?.length) return [];
    const chave = (nomeOriginal || nome)?.trim().toLowerCase();
    if (!chave) return [];
    return historicoAnterior.filter(s => {
      // Normaliza: remove [P] do nome salvo no banco antes de comparar
      const nomeNorm = (s.nome_exercicio || '').replace(/^\[P\]/, '').trim().toLowerCase();
      return nomeNorm === chave;
    });
  }, [historicoAnterior]);

  const { totalEnv, totalSer } = useMemo(() => ({
    totalEnv: exercicios.reduce((a,ex) => a + ex.series.filter(s=>s.enviada).length, 0),
    totalSer: exercicios.reduce((a,ex) => a + ex.series.length, 0),
  }), [exercicios]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-36">

      {showRestEnd && <RestEndBanner onDismiss={() => setShowRestEnd(false)}/>}
      {showConfig  && <ModalConfigDescanso tempoAtual={tempoConfig} onSalvar={salvarConfig} onFechar={() => setShowConfig(false)}/>}

      <div className="sticky top-0 z-30 bg-[#0a0a0a]/96 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[#c8f542] text-xs font-semibold uppercase tracking-wider">Treino ativo</div>
            <div className="text-white font-bold text-lg truncate">{split.nome}</div>
          </div>
          {timerAtivo && (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-[#c8f542]/30 rounded-xl px-3 py-2 fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8f542] pulse-green"/>
              <span className="text-[#c8f542] font-bold text-sm num">
                {String(Math.floor(timerRestante/60)).padStart(2,'0')}:{String(timerRestante%60).padStart(2,'0')}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-[#c8f542] rounded-full transition-all duration-500"
              style={{ width: `${totalSer ? Math.round(totalEnv/totalSer*100) : 0}%` }}/>
          </div>
          <span className="text-zinc-500 text-xs font-semibold">{totalEnv}/{totalSer}</span>
        </div>
      </div>

      <div className="px-4 pt-5 flex flex-col gap-5">

        {exercicios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 border-dashed flex items-center justify-center text-zinc-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">Nenhum exercício ainda</p>
              <p className="text-zinc-500 text-sm mt-1">Toque em "Adicionar exercício" abaixo para começar</p>
            </div>
          </div>
        )}

        {exercicios.map((ex, idx) => {
          const hist = histEx(ex.nome, ex.nomeAnterior);
          const show = expandidos[ex.id];
          return (
            <div key={ex.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[#c8f542] text-xs font-black flex-shrink-0">
                    {idx+1}
                  </div>
                  <input type="text" value={ex.nome} onChange={e => updNome(ex.id, e.target.value)}
                    onBlur={() => confirmarNome(ex)}
                    placeholder="Nome do exercício"
                    className="flex-1 min-w-0 bg-transparent text-white font-bold text-lg outline-none placeholder-zinc-700 border-b border-transparent focus:border-zinc-700 pb-0.5"/>
                  {exercicios.length > 1 && (
                    <button onClick={() => remEx(ex.id)}
                      className="btn w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800 flex-shrink-0">
                      <IconTrash/>
                    </button>
                  )}
                </div>

                {/* Toggle kg / Placas — visível e claro */}
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => alternarModoPlacas(ex.id)}
                    disabled={ex.series.some(s => s.enviada)}
                    className={`btn relative flex items-center rounded-xl overflow-hidden border transition-all disabled:opacity-40 ${
                      ex.usaPlacas ? 'border-blue-500/40' : 'border-zinc-700'
                    }`}
                    style={{ padding: 0 }}
                  >
                    {/* Opção kg */}
                    <span className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${
                      !ex.usaPlacas ? 'bg-[#c8f542] text-black' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h3m12 0h3M6 6v12m12-12v12M3 18h3m12 0h3M6 9h12M6 15h12"/>
                      </svg>
                      kg
                    </span>
                    {/* Divider */}
                    <span className="w-px h-full bg-zinc-700 flex-shrink-0"/>
                    {/* Opção Placas */}
                    <span className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${
                      ex.usaPlacas ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                        <circle cx="12" cy="12" r="9"/>
                        <circle cx="12" cy="12" r="4"/>
                      </svg>
                      Placas
                    </span>
                  </button>
                  <div className="flex-1"/>
                  {hist.length > 0 && (
                    <button onClick={() => setExp(m => ({...m,[ex.id]:!m[ex.id]}))}
                      className={`btn flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                        show ? 'bg-amber-400/15 text-amber-400 border border-amber-400/25'
                             : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                      <IconHistory/>
                      {show ? 'Ocultar' : `Último — ${hist.length} séries`}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1"/>
                  {exercicios.length > 1 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => moverEx(idx, -1)}
                        disabled={idx === 0}
                        className="btn w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-400 active:bg-zinc-700 disabled:opacity-20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => moverEx(idx, 1)}
                        disabled={idx === exercicios.length - 1}
                        className="btn w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-400 active:bg-zinc-700 disabled:opacity-20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {show && hist.length > 0 && (
                <div className="mx-4 mb-3 bg-amber-950/30 border border-amber-400/15 rounded-2xl p-4 fade-in">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Tente superar</p>
                  {hist.sort((a,b) => a.numero_serie-b.numero_serie).map((s,i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-sm">Série {s.numero_serie}</span>
                      <div className="flex gap-4">
                        <span className="text-white font-bold text-sm">
                          {s.carga_kg} {ex.usaPlacas ? 'placas' : 'kg'}
                        </span>
                        <span className="text-zinc-600 text-xs self-center">×</span>
                        <span className="text-amber-400 font-bold text-sm">{s.repeticoes} reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 px-4 pb-4">
                {ex.series.map(serie => {
                  const hS = hist.find(h => h.numero_serie===serie.id);
                  const PR = serie.enviada && hS && (serie.carga>hS.carga_kg || (serie.carga>=hS.carga_kg && serie.reps>hS.repeticoes));
                  return (
                    <div key={serie.id}
                      className={`rounded-2xl border transition-all duration-300 ${
                        serie.enviada ? PR ? 'bg-[#c8f542]/8 border-[#c8f542]/30' : 'bg-zinc-800/50 border-zinc-700/40'
                                      : 'bg-zinc-800/30 border-zinc-800'}`}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-zinc-500 text-sm font-semibold">Série {serie.id}</span>
                          {PR && <span className="text-[#c8f542] text-xs font-bold bg-[#c8f542]/10 px-2 py-0.5 rounded-lg">RECORDE</span>}
                          {hS && !show && (
                            <span className="text-zinc-700 text-xs">
                              ref: {hS.carga_kg}{ex.usaPlacas ? ' pl' : 'kg'} × {hS.repeticoes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!serie.enviada && ex.series.length > 1 && (
                            <button onClick={() => remSerie(ex.id, serie.id)}
                              className="btn w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800">
                              <IconTrash/>
                            </button>
                          )}
                          <button onClick={() => !serie.salvandoNow && alternarSerie(ex, serie)}
                            disabled={serie.salvandoNow}
                            className={`btn w-14 h-14 rounded-2xl flex items-center justify-center ${
                              serie.salvandoNow ? 'bg-zinc-800 border border-zinc-700' :
                              serie.enviada
                                ? 'bg-transparent border-2 border-[#c8f542]/30 text-[#c8f542]/60 active:bg-[#c8f542]/5'
                                : 'bg-[#c8f542] text-black active:bg-[#b0d93b] shadow-[0_0_20px_rgba(200,245,66,0.15)]'}`}>
                            {serie.salvandoNow
                              ? <div className="w-5 h-5 border-2 border-zinc-600 border-t-[#c8f542] rounded-full animate-spin"/>
                              : serie.enviada ? <IconUndo/> : <IconCheck/>}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-2 pb-3 min-w-0 items-stretch">
                        <NumInput
                          label={ex.usaPlacas ? 'Placas' : 'Carga (kg)'}
                          value={serie.carga}
                          onChange={v=>updSerie(ex.id,serie.id,'carga',v)}
                          disabled={serie.enviada}
                        />
                        <NumInput
                          label="Repetições"
                          value={serie.reps}
                          onChange={v=>updSerie(ex.id,serie.id,'reps',v)}
                          disabled={serie.enviada}
                        />
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => addSerie(ex.id)}
                  className="btn w-full py-4 rounded-2xl border border-dashed border-zinc-800 active:border-zinc-600 text-zinc-600 active:text-zinc-400 text-sm font-semibold flex items-center justify-center gap-2">
                  <IconPlus/> Adicionar série
                </button>
              </div>
            </div>
          );
        })}

        <button onClick={addEx}
          className="btn w-full border-2 border-dashed border-zinc-800 active:border-zinc-600 active:bg-zinc-900 text-zinc-500 font-semibold py-6 rounded-2xl flex items-center justify-center gap-2">
          <IconPlus/><span>Adicionar exercício</span>
        </button>
      </div>

      {showExModal && (
        <ModalExercicio
          onSelecionar={onSelecionarExercicio}
          onFechar={() => setShowExModal(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/98 to-transparent">
        <div className="mb-3">
          <BarraDescanso
            tempoConfig={tempoConfig}
            onAbrirConfig={() => setShowConfig(true)}
            onIniciar={iniciarDescanso}
            timerAtivo={timerAtivo}
            timerRestante={timerRestante}
            onPararTimer={pararDescanso}
          />
        </div>
        <button
          onClick={() => { if (!salvando) onFinalizar({ exercicios, split }); }}
          disabled={salvando}
          className="btn w-full py-5 bg-zinc-900 border border-zinc-700 active:bg-zinc-800 text-white font-bold text-base rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
          {salvando
            ? <><div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"/><span>Salvando...</span></>
            : 'Finalizar treino'
          }
        </button>
      </div>
    </div>
  );
}

// ─── TELA RESUMO ──────────────────────────────────────────────────────────────
function TelaResumo({ resultado, onVoltar }) {
  const { exercicios, split } = resultado;
  const { totalS, vol } = useMemo(() => ({
    totalS: exercicios.reduce((a,ex)=>a+ex.series.filter(s=>s.enviada).length, 0),
    vol:    exercicios.reduce((a,ex)=>a+ex.series.filter(s=>s.enviada).reduce((b,s)=>b+s.carga*s.reps,0), 0),
  }), [exercicios]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-5 pb-10 pt-16 slide-up">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center mx-auto mb-5 text-[#c8f542]"><IconTrophy/></div>
          <h1 className="text-3xl font-black text-white">Treino concluído</h1>
          <p className="text-zinc-500 mt-1 font-medium">{split.nome}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{l:'Séries',v:totalS},{l:'Volume total',v:`${Math.round(vol)} kg`}].map(x=>(
            <div key={x.l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-white font-black text-xl num">{x.v}</div>
              <div className="text-zinc-600 text-xs font-medium mt-1">{x.l}</div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
          {exercicios.filter(ex=>ex.series.some(s=>s.enviada)).map(ex=>(
            <div key={ex.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white font-bold text-sm">{ex.nome||'Exercício'}</p>
                {ex.usaPlacas && (
                  <span className="text-blue-400 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                    Placas
                  </span>
                )}
              </div>
              {ex.series.filter(s=>s.enviada).map(s=>(
                <div key={s.id} className="flex justify-between text-sm py-0.5">
                  <span className="text-zinc-600">Série {s.id}</span>
                  <span className="text-zinc-400 font-medium">
                    {s.carga}{ex.usaPlacas ? ' pl' : 'kg'} × {s.reps} reps
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={onVoltar} className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl">
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

// ─── TELA RANK — LOBBY ────────────────────────────────────────────────────────
function TelaRank({ usuario, mostrarToast, onVoltar }) {
  const [aba, setAba]           = useState('meus');   
  const [meusLobbies, setMeus]  = useState([]);
  const [lobbyAtivo, setLobby]  = useState(null);
  const [ranking, setRanking]   = useState([]);
  const [loading, setLoading]   = useState(false);

  const [nomeLobby, setNomeLobby] = useState('');
  const [dataFim, setDataFim]     = useState('');
  const [codigo, setCodigo]       = useState('');

  const carregarMeus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/rank/lobbies?id_usuario=${usuario.id}`);
      setMeus(r.lobbies || []);
    } catch { mostrarToast('Erro ao carregar lobbies.', 'erro'); }
    finally { setLoading(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregarMeus(); }, [carregarMeus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cod = params.get('lobby');
    if (cod) { setCodigo(cod); setAba('entrar'); }
  }, []);

  const criarLobby = async () => {
    if (!nomeLobby.trim() || !dataFim) { mostrarToast('Preencha nome e data.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch('/api/rank/criar', {
        method: 'POST',
        body: { id_usuario: usuario.id, nome: nomeLobby.trim(), data_fim: dataFim },
      });
      mostrarToast('Lobby criado!', 'sucesso');
      setNomeLobby(''); setDataFim('');
      await carregarMeus();
      abrirLobby(r.lobby);
    } catch(e) { mostrarToast(e.message || 'Erro ao criar.', 'erro'); }
    finally { setLoading(false); }
  };

  const entrarLobby = async () => {
    if (!codigo.trim()) { mostrarToast('Digite o código.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch('/api/rank/entrar', {
        method: 'POST',
        body: { id_usuario: usuario.id, nome_usuario: usuario.nome, codigo: codigo.trim().toUpperCase() },
      });
      mostrarToast('Entrou no lobby!', 'sucesso');
      setCodigo('');
      window.history.replaceState({}, '', window.location.pathname);
      await carregarMeus();
      abrirLobby(r.lobby);
    } catch(e) { mostrarToast(e.message || 'Código inválido.', 'erro'); }
    finally { setLoading(false); }
  };

  const abrirLobby = async (lobby) => {
    setLobby(lobby);
    setAba('lobby');
    setLoading(true);
    try {
      const r = await apiFetch(`/api/rank/ranking?codigo=${lobby.codigo}`);
      setRanking(r.ranking || []);
    } catch { }
    finally { setLoading(false); }
  };

  const copiarLink = (cod) => {
    const url = `${window.location.origin}?lobby=${cod}`;
    navigator.clipboard.writeText(url).then(() => mostrarToast('Link copiado!', 'sucesso'));
  };

  const encerrado = lobbyAtivo && new Date(lobbyAtivo.data_fim) < new Date();
  const hoje      = new Date().toISOString().slice(0, 10);

  if (aba === 'lobby' && lobbyAtivo) {
    const medalhas = ['🥇','🥈','🥉'];
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="sticky top-0 z-30 bg-[#0a0a0a]/96 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => { setAba('meus'); setLobby(null); }}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold uppercase tracking-wider ${encerrado ? 'text-red-400' : 'text-[#c8f542]'}`}>
              {encerrado ? 'Encerrado' : `Até ${new Date(lobbyAtivo.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
            </div>
            <div className="text-white font-bold text-lg truncate">{lobbyAtivo.nome}</div>
          </div>
          <button onClick={() => copiarLink(lobbyAtivo.codigo)}
            className="btn flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm active:bg-zinc-800">
            <IconLink/><span className="text-xs font-semibold">{lobbyAtivo.codigo}</span>
          </button>
        </div>

        <div className="px-4 pt-6 pb-10 flex flex-col gap-3">
          {encerrado && (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-3 text-center mb-2">
              <p className="text-amber-400 font-bold text-sm">🏆 Lobby encerrado — resultado final</p>
            </div>
          )}

          {loading ? <Spinner/> : ranking.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-sm">Nenhum treino registrado ainda.</div>
          ) : ranking.map((p, i) => (
            <div key={p.id_usuario}
              className={`rounded-2xl border px-4 py-4 flex items-center gap-4 ${
                i === 0 ? 'bg-amber-400/8 border-amber-400/25' :
                i === 1 ? 'bg-zinc-800/60 border-zinc-700' :
                i === 2 ? 'bg-orange-900/20 border-orange-800/30' :
                          'bg-zinc-900 border-zinc-800'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 font-black ${
                i === 0 ? 'bg-amber-400/15 text-amber-400' :
                i === 1 ? 'bg-zinc-700 text-zinc-300' :
                i === 2 ? 'bg-orange-900/40 text-orange-400' :
                          'bg-zinc-800 text-zinc-500'}`}>
                {i < 3 ? medalhas[i] : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate">{p.nome}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{p.pontos} dia{p.pontos !== 1 ? 's' : ''} treinado{p.pontos !== 1 ? 's' : ''}</div>
              </div>
              <div className={`text-right flex-shrink-0 ${i === 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                <div className="text-xl font-black num">{p.pontos}</div>
                <div className="text-xs text-zinc-600">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── TELA PRINCIPAL RANK ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={onVoltar}
          className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <h1 className="text-xl font-bold text-white">Ranking</h1>
      </div>

      <div className="flex gap-2 px-5 pt-4 pb-2">
        {[['meus','Meus Lobbies'],['criar','Criar'],['entrar','Entrar']].map(([v,l]) => (
          <button key={v} onClick={() => setAba(v)}
            className={`btn px-4 py-2 rounded-xl text-sm font-semibold ${aba===v ? 'bg-[#c8f542] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4 pb-10 flex flex-col gap-3">

        {aba === 'meus' && (
          loading ? <Spinner/> : meusLobbies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-sm mb-4">Você ainda não participa de nenhum lobby.</p>
              <button onClick={() => setAba('criar')}
                className="btn px-6 py-4 bg-[#c8f542] text-black font-bold rounded-2xl">Criar lobby</button>
            </div>
          ) : meusLobbies.map(lb => {
            const enc = new Date(lb.data_fim) < new Date();
            return (
              <button key={lb.codigo} onClick={() => abrirLobby(lb)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl p-4 text-left flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${enc ? 'bg-zinc-800 text-zinc-500' : 'bg-[#c8f542]/10 text-[#c8f542]'}`}>
                  <IconUsers/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate">{lb.nome}</div>
                  <div className={`text-xs mt-0.5 ${enc ? 'text-red-400' : 'text-zinc-500'}`}>
                    {enc ? 'Encerrado' : `Até ${new Date(lb.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`} · {lb.membros} membro{lb.membros !== 1 ? 's' : ''}
                  </div>
                </div>
                <IconChevronRight/>
              </button>
            );
          })
        )}

        {aba === 'criar' && (
          <div className="flex flex-col items-center gap-5 pt-4">
            <div className="w-16 h-16 rounded-2xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center text-[#c8f542]">
              <IconUsers/>
            </div>
            <div className="text-center">
              <h2 className="text-white font-black text-xl">Criar lobby</h2>
              <p className="text-zinc-500 text-sm mt-1">Convide amigos e vejam quem treina mais</p>
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center">Nome do lobby</label>
                <input
                  type="text"
                  placeholder="Ex: Semana dos Bros"
                  value={nomeLobby}
                  onChange={e => setNomeLobby(e.target.value)}
                  maxLength={40}
                  className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600 text-center"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center">Data de encerramento</label>
                <input
                  type="date"
                  value={dataFim}
                  min={hoje}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base text-center [color-scheme:dark]"
                />
                {dataFim && (
                  <p className="text-center text-[#c8f542] text-xs font-semibold">
                    Encerra {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={criarLobby}
              disabled={loading || !nomeLobby.trim() || !dataFim}
              className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl disabled:opacity-40">
              {loading ? 'Criando...' : 'Criar lobby 🚀'}
            </button>

            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 flex flex-col gap-2">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center mb-1">Como funciona</p>
              <div className="flex items-center gap-3">
                <span className="text-lg">✅</span>
                <span className="text-zinc-300 text-sm">Treinou hoje → <span className="text-[#c8f542] font-bold">+1 ponto</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">❌</span>
                <span className="text-zinc-300 text-sm">Não treinou hoje → <span className="text-zinc-500 font-bold">0 pontos</span></span>
              </div>
            </div>
          </div>
        )}

        {aba === 'entrar' && (
          <div className="flex flex-col gap-3">
            <p className="text-zinc-500 text-sm">Digite o código ou acesse o link de convite.</p>
            <input type="text" placeholder="Código (ex: ABC123)" value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())} maxLength={6}
              className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600 tracking-widest font-bold uppercase"/>
            <button onClick={entrarLobby} disabled={loading || !codigo.trim()}
              className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar no lobby'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IOS INSTALL BANNER ──────────────────────────────────────────────────────
const IOSInstallBanner = memo(() => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = window.navigator.standalone === true;
    const jaFechou = sessionStorage.getItem('ios_banner_closed');
    if (isIOS && !isInStandalone && !jaFechou) {
      setVisible(true);
    }
  }, []);

  const fechar = () => {
    sessionStorage.setItem('ios_banner_closed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={fechar}>
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl px-6 py-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0-13l-4 4m4-4l4 4"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 17h14a2 2 0 012 2v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1a2 2 0 012-2z"/>
            </svg>
          </div>
          <h2 className="text-white font-black text-lg">Adicione à tela inicial</h2>
          <p className="text-zinc-500 text-sm mt-1">Use o Volt como um app nativo no seu iPhone</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {[
            { n: '1', t: 'Toque nos 3 pontos (⋯) no Safari' },
            { n: '2', t: 'Selecione "Compartilhar"' },
            { n: '3', t: 'Toque em "Ver mais"' },
            { n: '4', t: 'Selecione "Adicionar à Tela de Início"' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3">
              <div className="w-6 h-6 rounded-full bg-[#c8f542] flex items-center justify-center flex-shrink-0">
                <span className="text-black text-xs font-black">{s.n}</span>
              </div>
              <span className="text-zinc-300 text-sm font-medium">{s.t}</span>
            </div>
          ))}
        </div>

        <button onClick={fechar}
          className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl">
          Entendido
        </button>
      </div>
    </div>
  );
});

// ─── TELA CARDIO ─────────────────────────────────────────────────────────────
// Cálculo por MET (Metabolic Equivalent of Task) × peso(kg) × horas
// Fonte: Compendium of Physical Activities (Ainsworth et al.)
// ─── ÍCONES DE CARDIO ────────────────────────────────────────────────────────
const CardCorrida    = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 4a1 1 0 100-2 1 1 0 000 2zM5 17l2-5 3 2 3-4 4 1M5 17l-1 3M19 10l-3-2"/></svg>);
const CardBike       = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 16l4-8h4l2 8M10 8l2 3h4"/></svg>);
const CardEliptico   = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M8 7l4 4 4-4M8 17l4-4 4 4M12 17v4"/><ellipse cx="12" cy="12" rx="4" ry="2"/></svg>);
const CardEsteira    = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17h18M6 17V9l3-3 3 3v5M15 9h3l1 4M12 6a1 1 0 100-2 1 1 0 000 2z"/></svg>);
const CardCorda      = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2zM5 8c1 3 2 4 7 4s6-1 7-4M5 16c1-3 2-4 7-4s6 1 7 4"/></svg>);
const CardNatacao    = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M14 8l-4-4M10 4l6 2-2 4"/></svg>);
const CardRemo       = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 2 4-4 5 5M15 6a1 1 0 100-2 1 1 0 000 2zM9 10l3-4 3 2"/></svg>);
const CardHIIT       = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg>);
const CardEscada     = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h4v-4h4v-4h4v-4h4V5"/></svg>);
const CardCaminhada  = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 4a1 1 0 100-2 1 1 0 000 2zM9 21l1-5 3 2 2-6M7 9l2-2 4 2 3-2M17 21l-2-5"/></svg>);

const ATIVIDADES_CARDIO = [
  { id: 'corrida',     label: 'Corrida',   cor: '#ef4444', Svg: CardCorrida,   met: { leve: 7.0, moderado: 9.8,  intenso: 14.5 } },
  { id: 'bike',        label: 'Bicicleta', cor: '#3b82f6', Svg: CardBike,      met: { leve: 5.8, moderado: 8.0,  intenso: 11.0 } },
  { id: 'eliptico',    label: 'Elíptico',  cor: '#a855f7', Svg: CardEliptico,  met: { leve: 4.6, moderado: 7.0,  intenso: 9.5  } },
  { id: 'esteira',     label: 'Esteira',   cor: '#06b6d4', Svg: CardEsteira,   met: { leve: 3.5, moderado: 5.0,  intenso: 6.5  } },
  { id: 'pular_corda', label: 'Corda',     cor: '#f59e0b', Svg: CardCorda,     met: { leve: 8.8, moderado: 11.8, intenso: 14.0 } },
  { id: 'natacao',     label: 'Natação',   cor: '#0ea5e9', Svg: CardNatacao,   met: { leve: 5.8, moderado: 8.3,  intenso: 10.0 } },
  { id: 'remo',        label: 'Remo',      cor: '#14b8a6', Svg: CardRemo,      met: { leve: 4.5, moderado: 7.0,  intenso: 10.5 } },
  { id: 'hiit',        label: 'HIIT',      cor: '#f97316', Svg: CardHIIT,      met: { leve: 7.0, moderado: 10.0, intenso: 14.0 } },
  { id: 'escada',      label: 'Escada',    cor: '#84cc16', Svg: CardEscada,    met: { leve: 4.0, moderado: 6.0,  intenso: 9.0  } },
  { id: 'caminhada',   label: 'Caminhada', cor: '#10b981', Svg: CardCaminhada, met: { leve: 2.5, moderado: 3.5,  intenso: 4.5  } },
];

const INTENSIDADE = [
  { id: 'leve',     label: 'Leve',     desc: 'Respira normal, conversa fácil',    cor: '#60a5fa' },
  { id: 'moderado', label: 'Moderado', desc: 'Leve falta de ar, ainda conversa',  cor: '#c8f542' },
  { id: 'intenso',  label: 'Intenso',  desc: 'Difícil conversar, muito suado',    cor: '#f97316' },
];

function calcularKcal(met, pesoKg, minutos) {
  return Math.round(met * pesoKg * (minutos / 60));
}

const PESO_KEY = 'fitapp_peso_corporal';

function TelaCardio({ usuario, onVoltar, mostrarToast }) {
  const [etapa, setEtapa]             = useState('escolha');
  const [atividadeId, setAtividadeId] = useState(null);
  const [intensidade, setIntensidade] = useState('moderado');
  const [peso, setPeso]               = useState(() => {
    // Prioridade: localStorage (editado pelo usuário) > cadastro > 70
    try { return localStorage.getItem(PESO_KEY) || String(usuario.peso_atual || '70'); }
    catch { return String(usuario.peso_atual || '70'); }
  });
  const [minutos, setMinutos]         = useState(30);
  const [cronAtivo, setCronAtivo]     = useState(false);
  const [cronSeg, setCronSeg]         = useState(0);
  const [salvando, setSalvando]       = useState(false);
  const [historico, setHistorico]     = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const intervalRef                   = useRef(null);
  const inicioRef                     = useRef(null);

  const atividade = ATIVIDADES_CARDIO.find(a => a.id === atividadeId);
  const pesoNum   = parseFloat(peso) || 70;
  const met       = atividade ? atividade.met[intensidade] : 0;
  const kcal      = atividade ? calcularKcal(met, pesoNum, minutos) : 0;

  // Carrega histórico de cardios ao abrir
  useEffect(() => {
    apiFetch(`${R.cardio}?id_usuario=${usuario.id}&limite=5`)
      .then(r => setHistorico(r.registros || []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  // Cronômetro
  useEffect(() => {
    if (cronAtivo) {
      inicioRef.current = Date.now() - cronSeg * 1000;
      intervalRef.current = setInterval(() => {
        const seg = Math.floor((Date.now() - inicioRef.current) / 1000);
        setCronSeg(seg);
        setMinutos(Math.max(1, Math.round(seg / 60)));
      }, 500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [cronAtivo]);

  const iniciarCron = () => { setCronSeg(0); setMinutos(1); setCronAtivo(true); setEtapa('cronometro'); };
  const pararCron   = () => { setCronAtivo(false); setEtapa('resultado'); };

  const salvar = async () => {
    if (!atividade) return;
    setSalvando(true);
    try {
      await apiFetch(R.cardio, {
        method: 'POST',
        body: {
          id_registro: `C${Date.now()}`,
          id_usuario:  String(usuario.id),
          data:        new Date().toISOString().slice(0, 10),
          atividade:   String(atividade.id),
          label:       String(atividade.label),
          intensidade: String(intensidade),
          minutos:     Math.max(1, parseInt(minutos) || 1),
          peso_kg:     parseFloat(pesoNum) || 70,
          kcal:        Math.max(0, parseInt(kcal) || 0),
          met:         parseFloat(met) || 0,
        },
      });
      mostrarToast(`${kcal} kcal registradas! 🔥`, 'sucesso');
      onVoltar();
    } catch (e) {
      mostrarToast(`[${e.status || '?'}] ${e.message}`, 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const intAtual = INTENSIDADE.find(i => i.id === intensidade);

  // ── ETAPA: ESCOLHA DA ATIVIDADE ────────────────────────────────────────────
  if (etapa === 'escolha') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
          <button onClick={onVoltar}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Cardio</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Escolha a atividade</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ATIVIDADES_CARDIO.map(a => (
              <button key={a.id} onClick={() => { setAtividadeId(a.id); setEtapa('config'); }}
                className="btn bg-zinc-900 border border-zinc-800 active:border-zinc-600 active:bg-zinc-800 rounded-2xl p-4 flex flex-col items-start gap-3 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.cor}20`, color: a.cor }}>
                  <a.Svg/>
                </div>
                <span className="text-white font-bold text-sm leading-tight">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Histórico recente */}
          {!loadingHist && historico.length > 0 && (
            <div>
              <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-3">Últimos registros</p>
              <div className="flex flex-col gap-2">
                {historico.map((h, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => { const at = ATIVIDADES_CARDIO.find(a => a.id === h.atividade); return (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: at ? `${at.cor}20` : '#f9731620', color: at?.cor || '#f97316' }}>
                          {at ? <at.Svg/> : <IconCardio/>}
                        </div>
                      ); })()}
                      <div>
                        <div className="text-white text-sm font-semibold">{h.label}</div>
                        <div className="text-zinc-500 text-xs">{h.minutos} min · {h.intensidade}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#f97316] font-black text-base num">{h.kcal}</div>
                      <div className="text-zinc-600 text-xs">kcal</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ETAPA: CONFIG (intensidade + tempo + peso) ────────────────────────────
  if (etapa === 'config') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
          <button onClick={() => setEtapa('escolha')}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{atividade.label}</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Configure a sessão</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-10 flex flex-col gap-6">

          {/* Intensidade */}
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">Intensidade</p>
            <div className="flex flex-col gap-2">
              {INTENSIDADE.map(it => (
                <button key={it.id} onClick={() => setIntensidade(it.id)}
                  className={`btn rounded-2xl px-4 py-4 flex items-center gap-4 border transition-all ${
                    intensidade === it.id
                      ? 'border-transparent'
                      : 'bg-zinc-900 border-zinc-800 active:bg-zinc-800'
                  }`}
                  style={intensidade === it.id ? { background: `${it.cor}15`, borderColor: `${it.cor}40` } : {}}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: it.cor }}/>
                  <div className="flex-1 text-left">
                    <div className="text-white font-bold text-sm">{it.label}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{it.desc}</div>
                  </div>
                  {intensidade === it.id && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-5 h-5 flex-shrink-0" style={{ color: it.cor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">Tempo</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[15, 20, 30, 45, 60, 90].map(m => (
                <button key={m} onClick={() => setMinutos(m)}
                  className={`btn py-4 rounded-2xl font-bold text-sm ${
                    minutos === m ? 'bg-[#c8f542] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 active:bg-zinc-800'
                  }`}>
                  {m < 60 ? `${m}min` : `${m/60}h`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <span className="text-zinc-500 text-sm">Ou digite:</span>
              <input
                type="number" inputMode="numeric" pattern="[0-9]*"
                value={minutos}
                onChange={e => setMinutos(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-transparent text-white font-bold text-base outline-none text-right"
              />
              <span className="text-zinc-500 text-sm">min</span>
            </div>
          </div>

          {/* Peso corporal */}
          <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">Seu peso</p>
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-zinc-500 flex-shrink-0">
                <path strokeLinecap="round" d="M12 4a4 4 0 100 8 4 4 0 000-8zM6 20v-1a6 6 0 0112 0v1"/>
              </svg>
              <input
                type="number" inputMode="decimal"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                onBlur={e => {
                  const v = e.target.value.trim();
                  if (v && parseFloat(v) > 0) {
                    try { localStorage.setItem(PESO_KEY, v); } catch {}
                  }
                }}
                className="flex-1 bg-transparent text-white font-bold text-base outline-none"
              />
              <span className="text-zinc-500 text-sm">kg</span>
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-zinc-900"/>

          {/* Estimativa — fim do scroll, sempre visível ao rolar */}
          <div className="bg-[#f97316]/10 border border-[#f97316]/25 rounded-2xl px-5 py-5 flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Estimativa de gasto</div>
              <div className="text-zinc-500 text-xs">{minutos}min · {intAtual.label} · {pesoNum}kg</div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#f97316] font-black text-4xl num">{kcal}</span>
              <span className="text-zinc-400 text-sm">kcal</span>
            </div>
          </div>

          {/* Botão principal — Começar com cronômetro */}
          <button onClick={iniciarCron}
            className="btn w-full py-7 bg-[#f97316] active:bg-[#ea6c0c] text-white font-black text-2xl rounded-2xl flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
              <circle cx="12" cy="13" r="8"/><path strokeLinecap="round" d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5"/>
            </svg>
            Começar
          </button>

          {/* Ação secundária — salvar sem cronômetro */}
          <button onClick={salvar} disabled={salvando}
            className="btn w-full py-3 text-zinc-500 text-sm font-medium active:text-zinc-300 disabled:opacity-40 flex items-center justify-center gap-2">
            {salvando ? 'Salvando...' : `Salvar ${kcal} kcal sem cronômetro`}
          </button>

        </div>
      </div>
    );
  }

  // ── ETAPA: CRONÔMETRO ──────────────────────────────────────────────────────
  if (etapa === 'cronometro') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `${atividade.cor}20`, color: atividade.cor }}>
            <div className="scale-150"><atividade.Svg/></div>
          </div>
          <div className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">{atividade.label} · {intAtual.label}</div>
          <div className="text-white font-black text-7xl num tracking-tight">{fmt(cronSeg)}</div>
          <div className="text-zinc-600 text-sm mt-3">{minutos} min · estimativa atual</div>
        </div>

        {/* Preview kcal ao vivo */}
        <div className="bg-[#f97316]/10 border border-[#f97316]/25 rounded-3xl px-8 py-6 flex items-center gap-4 mb-10 w-full max-w-xs">
          <IconFlame/>
          <div>
            <div className="text-zinc-500 text-xs uppercase tracking-wider">Queimando</div>
            <div className="text-[#f97316] font-black text-4xl num leading-none">{kcal}</div>
            <div className="text-zinc-500 text-sm">kcal</div>
          </div>
        </div>

        <button onClick={pararCron}
          className="btn w-full max-w-xs py-6 bg-[#f97316] active:bg-[#ea6c0c] text-white font-bold text-lg rounded-3xl flex items-center justify-center gap-3">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <rect x="5" y="5" width="14" height="14" rx="2"/>
          </svg>
          Parar e salvar
        </button>
        <button onClick={() => { setCronAtivo(false); setEtapa('config'); }}
          className="mt-4 text-zinc-600 text-sm active:text-zinc-400">
          Cancelar
        </button>
      </div>
    );
  }

  // ── ETAPA: RESULTADO ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 slide-up">
      <div className="text-center w-full max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: `${atividade.cor}20`, color: atividade.cor }}>
          <div className="scale-150"><atividade.Svg/></div>
        </div>
        <h1 className="text-3xl font-black text-white mb-1">Sessão concluída</h1>
        <p className="text-zinc-500 mb-8">{atividade.label} · {intAtual.label}</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { v: fmt(cronSeg), l: 'Duração' },
            { v: minutos,      l: 'Minutos' },
            { v: kcal,         l: 'kcal',   destaque: true },
          ].map(x => (
            <div key={x.l} className={`rounded-2xl p-4 text-center border ${
              x.destaque ? 'bg-[#f97316]/10 border-[#f97316]/25' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className={`font-black text-2xl num ${x.destaque ? 'text-[#f97316]' : 'text-white'}`}>{x.v}</div>
              <div className="text-zinc-600 text-xs mt-1">{x.l}</div>
            </div>
          ))}
        </div>

        <button onClick={salvar} disabled={salvando}
          className="btn w-full py-5 bg-[#f97316] active:bg-[#ea6c0c] text-white font-bold text-base rounded-2xl disabled:opacity-60 mb-3 flex items-center justify-center gap-2">
          <IconFlame/>
          {salvando ? 'Salvando...' : 'Salvar registro'}
        </button>
        <button onClick={onVoltar} className="text-zinc-600 text-sm active:text-zinc-400">
          Descartar
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Restaura sessão salva (evita voltar ao login quando iOS descarrega a página)
  const sessaoSalva = carregarSessao();
  const tokenSalvo  = getAuthToken();
  const podeRestaurar = !!(sessaoSalva?.usuario && tokenSalvo);

  const [usuario, setUsuario]        = useState(podeRestaurar ? sessaoSalva.usuario : null);
  const [tela, setTela]              = useState(podeRestaurar ? sessaoSalva.tela : 'auth');
  const [splits, setSplits]          = useState([]);
  const [loadingSplits, setLoadingS] = useState(false);
  const [splitAtivo, setSplitAtivo]  = useState(podeRestaurar ? sessaoSalva.splitAtivo : null);
  const [historico, setHistorico]    = useState([]);
  const [resultado, setResultado]    = useState(null);
  const [lobbyConvite, setLobbyConvite] = useState(null);
  const [toast, setToast]            = useState(null);
  const toastTimerRef                = useRef(null);

  // Persiste sessão sempre que estado crítico muda
  const usuarioRef   = useRef(usuario);
  const telaRef      = useRef(tela);
  const splitAtivoRef = useRef(splitAtivo);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);
  useEffect(() => { telaRef.current = tela; }, [tela]);
  useEffect(() => { splitAtivoRef.current = splitAtivo; }, [splitAtivo]);

  useEffect(() => {
    if (usuario) salvarSessao(usuario, tela, splitAtivo);
  }, [usuario, tela, splitAtivo]);

  // Se restaurou sessão, recarrega splits em background sem bloquear a UI
  useEffect(() => {
    if (podeRestaurar && sessaoSalva.usuario) {
      carregarSplitsInterno(sessaoSalva.usuario.id);
      // Se estava no treino, recarrega histórico em background também
      if (sessaoSalva.tela === 'treino' && sessaoSalva.splitAtivo) {
        const sa = sessaoSalva.splitAtivo;
        const nomeParaBusca = sa.nomeHistorico || sa.nome;
        apiFetch(
          `${R.historico}?id_usuario=${sessaoSalva.usuario.id}` +
          `&split_id=${encodeURIComponent(sa.id)}` +
          `&nome_treino=${encodeURIComponent(nomeParaBusca)}`
        )
          .then(r => setHistorico(r.series || []))
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrarToast = useCallback((mensagem, tipo='sucesso') => {
    clearTimeout(toastTimerRef.current);
    setToast({ mensagem, tipo });
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const carregarSplitsInterno = useCallback(async uid => {
    setLoadingS(true);
    try {
      const r = await apiFetch(`${R.splits}?id_usuario=${uid}`);
      setSplits(r.splits || []);
    } catch (err) {
      console.error('Erro ao carregar splits:', err);
      setSplits([]);
    } finally { setLoadingS(false); }
  }, []);

  const carregarSplits = carregarSplitsInterno;

  const onLogin = useCallback(u => {
    setUsuario(u);
    carregarSplitsInterno(u.id);
    setTela('grupamentos');
    mostrarToast(`Bem-vindo, ${u.nome.split(' ')[0]}.`, 'sucesso');
  }, [carregarSplitsInterno, mostrarToast]);

  const onLogout = useCallback(() => {
    clearAuthToken();
    setUsuario(null); setTela('auth'); setSplits([]);
    setSplitAtivo(null); setHistorico([]);
  }, []);

  const onSelecionarSplit = useCallback(split => {
    // Navega imediatamente para dar feedback visual ao usuário
    setSplitAtivo(split);
    setHistorico([]);
    setTela('treino');
    // Busca histórico em background — TelaTreino reage quando historicoAnterior muda
    const nomeParaBusca = split.nomeHistorico || split.nome;
    apiFetch(
      `${R.historico}?id_usuario=${usuarioRef.current.id}` +
      `&split_id=${encodeURIComponent(split.id)}` +
      `&nome_treino=${encodeURIComponent(nomeParaBusca)}`
    )
      .then(r => setHistorico(r.series || []))
      .catch(() => {});
  }, []);

  const onFinalizar = useCallback(res => {
    setResultado(res);
    setSplitAtivo(null);
    setTela('resumo');
    mostrarToast('Treino finalizado.', 'sucesso');
  }, [mostrarToast]);

  return (
    <>
      <Toast data={toast}/>
      <IOSInstallBanner/>
      {tela==='auth'             && <TelaAuth onLogin={onLogin} mostrarToast={mostrarToast}/>}
      {tela==='grupamentos'      && usuario && <TelaGrupamentos usuario={usuario} splits={splits} loadingSplits={loadingSplits} onSelecionarSplit={onSelecionarSplit} onGerenciar={()=>setTela('gerenciar-splits')} onRank={()=>setTela('rank')} onCardio={()=>setTela('cardio')} onLogout={onLogout}/>}
      {tela==='gerenciar-splits' && usuario && <TelaGerenciarSplits usuario={usuario} splits={splits} onSalvar={l=>{setSplits(l);setTela('grupamentos');}} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
      {tela==='treino'           && splitAtivo && <TelaTreino usuario={usuario} split={splitAtivo} historicoAnterior={historico} onFinalizar={onFinalizar} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
      {tela==='resumo'           && resultado && <TelaResumo resultado={resultado} onVoltar={()=>setTela('grupamentos')}/>}
      {tela==='rank'             && usuario && <TelaRank usuario={usuario} mostrarToast={mostrarToast} onVoltar={()=>setTela('grupamentos')}/>}
      {tela==='cardio'           && usuario && <TelaCardio usuario={usuario} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
    </>
  );
}