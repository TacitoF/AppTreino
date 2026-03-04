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

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = '';
const REST_TIME_KEY = 'fitapp_rest_time';

// ─── FETCH HELPER (substitui axios — sem dependência externa) ─────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || 'Erro desconhecido');
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 5v14M18 5v14M3 8h3M3 16h3M18 8h3M18 16h3M6 9h12M6 15h12"/>
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

// ─── INPUT NUMÉRICO — memo + estado interno isolado ──────────────────────────
const NumInput = memo(({ label, value, onChange, disabled }) => {
  const [editando, setEditando] = useState(false);
  const [txt, setTxt]           = useState('');
  const ref = useRef(null);
  const val = Math.round(value);

  const abrirEdit = useCallback(() => {
    if (disabled) return;
    setTxt(String(val));
    setEditando(true);
    setTimeout(() => { ref.current?.focus(); ref.current?.select(); }, 20);
  }, [disabled, val]);

  const confirmar = useCallback(() => {
    const n = parseInt(txt.replace(',', '.'), 10);
    if (!isNaN(n) && n >= 0) onChange(n);
    setEditando(false);
  }, [txt, onChange]);

  const dec = useCallback(() => { if (!disabled) onChange(Math.max(0, val - 1)); }, [disabled, val, onChange]);
  const inc = useCallback(() => { if (!disabled) onChange(val + 1); }, [disabled, val, onChange]);

  return (
    <div className="flex flex-col items-center bg-black rounded-2xl py-3 px-1">
      <span className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-center w-full gap-1">
        <button onClick={dec} disabled={disabled}
          className="btn w-14 h-14 bg-zinc-800 active:bg-zinc-700 rounded-xl text-white text-2xl flex items-center justify-center disabled:opacity-20 select-none flex-shrink-0">
          −
        </button>
        <div className="flex-1 flex justify-center">
          {editando
            ? <input ref={ref} type="number" value={txt}
                onChange={e => setTxt(e.target.value)}
                onBlur={confirmar}
                onKeyDown={e => e.key === 'Enter' && confirmar()}
                className="w-full text-center text-2xl font-black text-white bg-transparent outline-none border-b-2 border-[#c8f542] num"/>
            : <button onClick={abrirEdit} disabled={disabled}
                className={`btn text-2xl font-black num min-w-[44px] text-center rounded-xl py-1 px-2 active:bg-zinc-800 ${disabled ? 'text-zinc-600' : 'text-white'}`}>
                {val}
              </button>
          }
        </div>
        <button onClick={inc} disabled={disabled}
          className="btn w-14 h-14 bg-zinc-800 active:bg-zinc-700 rounded-xl text-white text-2xl flex items-center justify-center disabled:opacity-20 select-none flex-shrink-0">
          +
        </button>
      </div>
    </div>
  );
});

// ─── TELA AUTH ────────────────────────────────────────────────────────────────
function TelaAuth({ onLogin, mostrarToast }) {
  const [modo, setModo]       = useState('login');
  const [email, setEmail]     = useState('');
  const [senha, setSenha]     = useState('');
  const [nome, setNome]       = useState('');
  const [peso, setPeso]       = useState('');
  const [obj, setObj]         = useState('');
  const [loading, setLoading] = useState(false);

  const limpar = () => { setEmail(''); setSenha(''); setNome(''); setPeso(''); setObj(''); };
  const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

  const login = async e => {
    e.preventDefault();
    if (!email || !senha) { mostrarToast('Preencha e-mail e senha.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch('/api/login', { method: 'POST', body: { email, senha } });
      onLogin(r.usuario);
      limpar();
    } catch (err) {
      if (err.status === 401) mostrarToast('Senha incorreta.', 'erro');
      else if (err.status === 404) mostrarToast('E-mail não encontrado.', 'erro');
      else mostrarToast('Não foi possível conectar.', 'erro');
    } finally { setLoading(false); }
  };

  const cadastro = async e => {
    e.preventDefault();
    if (!nome || !email || !senha) { mostrarToast('Preencha nome, e-mail e senha.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch('/api/registro', { method: 'POST', body: { nome, email, senha, peso_atual: peso || '0', objetivo: obj || 'Hipertrofia' } });
      mostrarToast('Conta criada. Faça login.', 'sucesso');
      setModo('login'); limpar();
    } catch (err) {
      if (err.status === 400) mostrarToast('E-mail já cadastrado.', 'erro');
      else mostrarToast('Erro ao criar conta.', 'erro');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c8f542]/10 border border-[#c8f542]/20 rounded-2xl mb-4 text-[#c8f542]"><IconDumbbell/></div>
          <h1 className="text-4xl font-black text-white">FitApp</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Seu diário de treino</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 mb-6">
          {[['login','Entrar'],['cadastro','Criar conta']].map(([t,l]) => (
            <button key={t} onClick={() => { setModo(t); limpar(); }}
              className={`btn flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${modo===t ? 'bg-[#c8f542] text-black' : 'text-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>
        {modo === 'login' ? (
          <form onSubmit={login} className="flex flex-col gap-3">
            <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="email"/>
            <input type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} className={inp} autoComplete="current-password"/>
            <button type="submit" disabled={loading} className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-2 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
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
function TelaGrupamentos({ usuario, splits, loadingSplits, onSelecionarSplit, onGerenciar, onLogout }) {
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
            <button onClick={onGerenciar} className="btn w-full border-2 border-dashed border-zinc-800 active:border-zinc-700 text-zinc-600 active:text-zinc-400 font-semibold py-5 rounded-2xl flex items-center justify-center gap-2 mt-1">
              <IconSettings/><span className="text-sm">Gerenciar grupos musculares</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TELA GERENCIAR SPLITS ────────────────────────────────────────────────────
function TelaGerenciarSplits({ usuario, splits, onSalvar, onVoltar, mostrarToast }) {
  const [lista, setLista]   = useState(() => splits.map(s => ({...s})));
  const [saving, setSaving] = useState(false);

  const adicionar = useCallback(() =>
    setLista(l => [...l, { id:`split_${Date.now()}`, id_usuario:usuario.id, nome:'', ultimo_treino:null }])
  , [usuario.id]);

  const renomear = useCallback((id, nome) =>
    setLista(l => l.map(s => s.id === id ? {...s, nome} : s))
  , []);

  const remover = useCallback((id) =>
    setLista(l => l.filter(s => s.id !== id))
  , []);

  const salvar = async () => {
    if (lista.some(s => !s.nome.trim())) { mostrarToast('Preencha o nome de todos os grupos.', 'erro'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/splits', { method: 'POST', body: { id_usuario: usuario.id, splits: lista } });
      mostrarToast('Grupos salvos.', 'sucesso');
      onSalvar(lista);
    } catch { mostrarToast('Erro ao salvar.', 'erro'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-4 flex items-center gap-4 border-b border-zinc-900">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800"><IconBack/></button>
        <h1 className="text-xl font-bold text-white">Grupos Musculares</h1>
      </div>
      <div className="px-5 pt-4 flex flex-col gap-3 flex-1 pb-4">
        {lista.map((s, i) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-3 px-4 py-2">
            <span className="text-zinc-600 font-bold text-sm w-5 text-center">{i+1}</span>
            <input type="text" value={s.nome} onChange={e => renomear(s.id, e.target.value)} placeholder="Nome do grupo muscular"
              className="flex-1 bg-transparent text-white font-semibold text-base outline-none placeholder-zinc-700 py-3"/>
            <button onClick={() => remover(s.id)} className="btn w-11 h-11 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800"><IconTrash/></button>
          </div>
        ))}
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

// ─── TELA TREINO ──────────────────────────────────────────────────────────────
function TelaTreino({ usuario, split, historicoAnterior, onFinalizar, onVoltar, mostrarToast }) {
  const [exerciciosInicializados, setExerciciosInicializados] = useState(false);

  const [exercicios, setExercicios] = useState(() => [{
    id: Date.now(), nome: '',
    series: [{ id:1, reps:12, carga:0, enviada:false, id_banco:null }],
  }]);

  // Quando o histórico chega de forma assíncrona (após a tela já abrir),
  // pré-popula os exercícios com os dados do último treino — uma única vez.
  useEffect(() => {
    if (exerciciosInicializados) return;
    if (!historicoAnterior || historicoAnterior.length === 0) return;

    // Agrupa as séries do histórico por nome de exercício, mantendo ordem de aparição
    const mapaExercicios = new Map();
    historicoAnterior.forEach(s => {
      const nome = s.nome_exercicio?.trim() || '';
      if (!mapaExercicios.has(nome)) mapaExercicios.set(nome, []);
      mapaExercicios.get(nome).push(s);
    });

    const exerciciosDoHistorico = Array.from(mapaExercicios.entries()).map(([nome, series], exIdx) => {
      const seriesOrdenadas = [...series].sort((a, b) => a.numero_serie - b.numero_serie);
      return {
        id: Date.now() + exIdx,
        nome,
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
  const [expandidos, setExp] = useState({});

  // Timer de descanso
  const [tempoConfig, setTempoConfig] = useState(() => {
    const s = localStorage.getItem(REST_TIME_KEY);
    return s ? parseInt(s, 10) : 90;
  });
  const [timerAtivo, setTimerAtivo]       = useState(false);
  const [timerRestante, setTimerRestante] = useState(0);
  const [showConfig, setShowConfig]       = useState(false);
  const [showRestEnd, setShowRestEnd]     = useState(false);

  // useRef para o intervalo — não recria o effect a cada tick
  const intervalRef   = useRef(null);
  // useRef para tempoConfig — alternarSerie pode ler o valor atual sem violar Rules of Hooks
  const tempoConfigRef = useRef(tempoConfig);
  useEffect(() => { tempoConfigRef.current = tempoConfig; }, [tempoConfig]);

  // Effect do timer — depende apenas de timerAtivo (um bool estável)
  useEffect(() => {
    if (!timerAtivo) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimerRestante(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setTimerAtivo(false);
          setShowRestEnd(true);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerAtivo]);

  const iniciarDescanso = useCallback(() => {
    clearInterval(intervalRef.current);
    setTimerRestante(tempoConfigRef.current);
    setShowRestEnd(false);
    setTimerAtivo(true);
  }, []);

  const pararDescanso = useCallback(() => {
    clearInterval(intervalRef.current);
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

  // Exercícios
  const addEx = useCallback(() =>
    setExercicios(e => [...e, { id:Date.now(), nome:'', series:[{id:1,reps:12,carga:0,enviada:false,id_banco:null}] }])
  , []);

  const updNome = useCallback((id, nome) =>
    setExercicios(e => e.map(x => x.id===id ? {...x,nome} : x))
  , []);

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

  const alternarSerie = useCallback(async (ex, serie) => {
    // Snapshot do estado atual para rollback
    const snapshot = exercicios.map(x => ({...x, series:x.series.map(s=>({...s}))}));

    if (serie.enviada) {
      setExercicios(cur => cur.map(x => x.id!==ex.id ? x : {
        ...x, series: x.series.map(s => s.id===serie.id ? {...s,enviada:false,id_banco:null} : s),
      }));
      try { await apiFetch(`/api/treino/serie?id=${serie.id_banco}`, { method: 'DELETE' }); }
      catch { setExercicios(snapshot); mostrarToast('Sem conexão. Não removido.', 'erro'); }
    } else {
      if (!ex.nome.trim()) { mostrarToast('Digite o nome do exercício.', 'erro'); return; }
      const nid      = 'S' + Date.now();
      const idTreino = `${split.nome}_${usuario.id}_${new Date().toISOString().slice(0,10)}`;

      setExercicios(cur => cur.map(x => x.id!==ex.id ? x : {
        ...x, series: x.series.map(s => s.id===serie.id ? {...s,enviada:true,id_banco:nid} : s),
      }));
      try {
        await apiFetch('/api/treino/serie', {
          method: 'POST',
          body: { id_serie:nid, id_treino:idTreino, nome_exercicio:ex.nome, numero_serie:serie.id, repeticoes:serie.reps, carga_kg:serie.carga },
        });
        iniciarDescanso(); // usa tempoConfigRef internamente, sem dependência de estado
      } catch {
        setExercicios(snapshot);
        mostrarToast('Sem conexão. Série não salva.', 'erro');
      }
    }
  }, [exercicios, split, usuario, mostrarToast, iniciarDescanso]);

  const histEx = useCallback((nome) => {
    if (!historicoAnterior?.length || !nome?.trim()) return [];
    return historicoAnterior.filter(s =>
      s.nome_exercicio?.toLowerCase().trim() === nome.toLowerCase().trim()
    );
  }, [historicoAnterior]);

  // useMemo para não recalcular a cada render
  const { totalEnv, totalSer } = useMemo(() => ({
    totalEnv: exercicios.reduce((a,ex) => a + ex.series.filter(s=>s.enviada).length, 0),
    totalSer: exercicios.reduce((a,ex) => a + ex.series.length, 0),
  }), [exercicios]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-36">

      {showRestEnd && <RestEndBanner onDismiss={() => setShowRestEnd(false)}/>}
      {showConfig  && <ModalConfigDescanso tempoAtual={tempoConfig} onSalvar={salvarConfig} onFechar={() => setShowConfig(false)}/>}

      {/* Header sticky */}
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

      {/* Exercícios */}
      <div className="px-4 pt-5 flex flex-col gap-5">
        {exercicios.map((ex, idx) => {
          const hist = histEx(ex.nome);
          const show = expandidos[ex.id];
          return (
            <div key={ex.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden slide-up">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-[#c8f542] text-sm font-black flex-shrink-0 mt-0.5">
                    {idx+1}
                  </div>
                  <input type="text" value={ex.nome} onChange={e => updNome(ex.id, e.target.value)}
                    placeholder="Nome do exercício"
                    className="flex-1 bg-transparent text-white font-bold text-lg outline-none placeholder-zinc-700 border-b border-transparent focus:border-zinc-700 pb-0.5"/>
                </div>
                {hist.length > 0 && (
                  <button onClick={() => setExp(m => ({...m,[ex.id]:!m[ex.id]}))}
                    className={`btn flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      show ? 'bg-amber-400/15 text-amber-400 border border-amber-400/25'
                           : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                    <IconHistory/>
                    {show ? 'Ocultar histórico' : `Último treino — ${hist.length} séries`}
                  </button>
                )}
              </div>

              {show && hist.length > 0 && (
                <div className="mx-4 mb-3 bg-amber-950/30 border border-amber-400/15 rounded-2xl p-4 fade-in">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Tente superar</p>
                  {hist.sort((a,b) => a.numero_serie-b.numero_serie).map((s,i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-sm">Série {s.numero_serie}</span>
                      <div className="flex gap-4">
                        <span className="text-white font-bold text-sm">{s.carga_kg} kg</span>
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
                          {hS && !show && <span className="text-zinc-700 text-xs">ref: {hS.carga_kg}kg × {hS.repeticoes}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {!serie.enviada && ex.series.length > 1 && (
                            <button onClick={() => remSerie(ex.id, serie.id)}
                              className="btn w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800">
                              <IconTrash/>
                            </button>
                          )}
                          <button onClick={() => alternarSerie(ex, serie)}
                            className={`btn w-14 h-14 rounded-2xl flex items-center justify-center ${
                              serie.enviada
                                ? 'bg-transparent border-2 border-[#c8f542]/30 text-[#c8f542]/60 active:bg-[#c8f542]/5'
                                : 'bg-[#c8f542] text-black active:bg-[#b0d93b] shadow-[0_0_20px_rgba(200,245,66,0.15)]'}`}>
                            {serie.enviada ? <IconUndo/> : <IconCheck/>}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                        <NumInput label="Carga (kg)" value={serie.carga} onChange={v=>updSerie(ex.id,serie.id,'carga',v)} disabled={serie.enviada}/>
                        <NumInput label="Repetições" value={serie.reps}  onChange={v=>updSerie(ex.id,serie.id,'reps',v)}  disabled={serie.enviada}/>
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
          className="btn w-full border-2 border-dashed border-zinc-800 active:border-zinc-700 text-zinc-600 font-semibold py-6 rounded-2xl flex items-center justify-center gap-2">
          <IconPlus/><span>Novo exercício</span>
        </button>
      </div>

      {/* Rodapé fixo */}
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
        <button onClick={() => onFinalizar({ exercicios, split })}
          className="btn w-full py-5 bg-zinc-900 border border-zinc-700 active:bg-zinc-800 text-white font-bold text-base rounded-2xl">
          Finalizar treino
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
              <p className="text-white font-bold text-sm mb-2">{ex.nome||'Exercício'}</p>
              {ex.series.filter(s=>s.enviada).map(s=>(
                <div key={s.id} className="flex justify-between text-sm py-0.5">
                  <span className="text-zinc-600">Série {s.id}</span>
                  <span className="text-zinc-400 font-medium">{s.carga}kg × {s.reps} reps</span>
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [usuario, setUsuario]        = useState(null);
  const [tela, setTela]              = useState('auth');
  const [splits, setSplits]          = useState([]);
  const [loadingSplits, setLoadingS] = useState(false);
  const [splitAtivo, setSplitAtivo]  = useState(null);
  const [historico, setHistorico]    = useState([]);
  const [resultado, setResultado]    = useState(null);
  const [toast, setToast]            = useState(null);
  const toastTimerRef                = useRef(null); // cleanup correto do timeout

  // mostrarToast com cleanup para evitar vazamento se chamado rapidamente
  const mostrarToast = useCallback((mensagem, tipo='sucesso') => {
    clearTimeout(toastTimerRef.current);
    setToast({ mensagem, tipo });
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const carregarSplits = useCallback(async uid => {
    setLoadingS(true);
    try {
      const r = await apiFetch(`/api/splits?id_usuario=${uid}`);
      setSplits(r.splits || []);
    } catch (err) {
      // Erro de rede — não sobrescreve dados do usuário, só limpa a lista
      console.error('Erro ao carregar splits:', err);
      setSplits([]);
    } finally { setLoadingS(false); }
  }, []);

  const onLogin = useCallback(u => {
    setUsuario(u);
    carregarSplits(u.id);
    setTela('grupamentos');
    mostrarToast(`Bem-vindo, ${u.nome.split(' ')[0]}.`, 'sucesso');
  }, [carregarSplits, mostrarToast]);

  const onLogout = useCallback(() => {
    setUsuario(null); setTela('auth'); setSplits([]);
    setSplitAtivo(null); setHistorico([]);
  }, []);

  // Navega imediatamente para o treino; histórico é carregado de forma assíncrona
  // → o usuário vê a tela de treino sem delay
  const onSelecionarSplit = useCallback(async split => {
    setSplitAtivo(split);
    setHistorico([]); // limpa histórico anterior enquanto carrega
    setTela('treino');
    try {
      const r = await apiFetch(`/api/treino/historico?id_usuario=${usuario.id}&nome_treino=${encodeURIComponent(split.nome)}`);
      setHistorico(r.series || []);
    } catch { /* sem histórico é normal */ }
  }, [usuario]);

  const onFinalizar = useCallback(res => {
    setResultado(res);
    setTela('resumo');
    mostrarToast('Treino finalizado.', 'sucesso');
  }, [mostrarToast]);

  return (
    <>
      <Toast data={toast}/>
      {tela==='auth'             && <TelaAuth onLogin={onLogin} mostrarToast={mostrarToast}/>}
      {tela==='grupamentos'      && usuario && <TelaGrupamentos usuario={usuario} splits={splits} loadingSplits={loadingSplits} onSelecionarSplit={onSelecionarSplit} onGerenciar={()=>setTela('gerenciar-splits')} onLogout={onLogout}/>}
      {tela==='gerenciar-splits' && usuario && <TelaGerenciarSplits usuario={usuario} splits={splits} onSalvar={l=>{setSplits(l);setTela('grupamentos');}} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
      {tela==='treino'           && splitAtivo && <TelaTreino usuario={usuario} split={splitAtivo} historicoAnterior={historico} onFinalizar={onFinalizar} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
      {tela==='resumo'           && resultado && <TelaResumo resultado={resultado} onVoltar={()=>setTela('grupamentos')}/>}
    </>
  );
}