import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { apiFetch, apiFetchOffline, syncOfflineQueue, getOfflineQueue } from '../auth';
import { R, REST_TIME_KEY } from '../config';
import { IconBack, IconPlus, IconTrash, IconCheck, IconUndo, IconHistory } from '../components/icons';
import { BarraDescanso, ModalConfigDescanso, RestEndBanner } from '../components/ui';
import { ModalExercicio } from '../components/ModalExercicio';

// ─── Ícones locais ────────────────────────────────────────────────────────────
const IconNote = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);
const IconStopwatch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <circle cx="12" cy="13" r="8"/><path strokeLinecap="round" d="M12 9v4l2 2M9.5 2.5h5M12 2.5V5"/>
  </svg>
);
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
  </svg>
);
const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
  </svg>
);
const IconDots = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
);

// ─── NumInput Mobile ──────────────────────────────────────────────────────────
// Botões maiores, área de toque fácil com polegar, step configurável por campo
const NumInputMobile = memo(({ label, value, onChange, disabled, step = 1 }) => {
  const [txt, setTxt] = useState(String(value));
  const ref = useRef(null);
  const num = parseFloat(String(value)) || 0;

  useEffect(() => {
    if (document.activeElement !== ref.current) {
      setTxt(String(value));
    }
  }, [value]);

  const confirmar = useCallback(() => {
    const n = parseFloat(txt.replace(',', '.'));
    if (!isNaN(n) && n >= 0) { onChange(n); setTxt(String(n)); }
    else { setTxt(String(value)); }
  }, [txt, onChange, value]);

  const dec = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) {
      const novo = Math.max(0, Math.round((num - step) * 100) / 100);
      onChange(novo); setTxt(String(novo));
    }
  }, [disabled, num, step, onChange]);

  const inc = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) {
      const novo = Math.round((num + step) * 100) / 100;
      onChange(novo); setTxt(String(novo));
    }
  }, [disabled, num, step, onChange]);

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border ${
      disabled ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-700 bg-zinc-900'
    }`}>
      <div className="pt-2.5 pb-1 text-center">
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-stretch">
        {/* botão − */}
        <button
          onPointerDown={dec}
          disabled={disabled}
          className="flex-1 flex items-center justify-center py-4 active:bg-zinc-700 disabled:opacity-20 select-none touch-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="text-white text-3xl font-light leading-none select-none">−</span>
        </button>

        <div className="w-px bg-zinc-800 my-2 flex-shrink-0"/>

        {/* input */}
        <div className="flex-[1.4] flex items-center justify-center">
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            value={txt}
            disabled={disabled}
            onChange={e => setTxt(e.target.value)}
            onBlur={confirmar}
            onFocus={e => e.target.select()}
            onKeyDown={e => e.key === 'Enter' && ref.current?.blur()}
            className={`w-full text-center text-2xl font-black bg-transparent outline-none num py-3 ${
              disabled ? 'text-zinc-600' : 'text-white'
            }`}
            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
        </div>

        <div className="w-px bg-zinc-800 my-2 flex-shrink-0"/>

        {/* botão + */}
        <button
          onPointerDown={inc}
          disabled={disabled}
          className="flex-1 flex items-center justify-center py-4 active:bg-zinc-700 disabled:opacity-20 select-none touch-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="text-white text-3xl font-light leading-none select-none">+</span>
        </button>
      </div>
    </div>
  );
});

// ─── Card de Série ────────────────────────────────────────────────────────────
const CardSerie = memo(({ ex, serie, hist, showHist, onToggle, onUpdSerie, onRemSerie, timerInfo }) => {
  const hS = hist?.find(h => h.numero_serie === serie.id);
  const PR = serie.enviada && hS && (
    serie.carga > hS.carga_kg ||
    (serie.carga >= hS.carga_kg && serie.reps > hS.repeticoes)
  );
  const stepCarga = ex.usaPlacas ? 1 : 2.5;

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all duration-300 ${
      serie.enviada
        ? PR
          ? 'bg-[#c8f542]/8 border-[#c8f542]/25'
          : 'bg-zinc-800/40 border-zinc-700/30'
        : 'bg-zinc-800/20 border-zinc-800'
    }`}>
      {/* cabeçalho da série */}
      <div className="flex items-center px-4 pt-3 pb-2 gap-2 min-h-[44px]">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
          serie.enviada
            ? PR ? 'bg-[#c8f542]/20 text-[#c8f542]' : 'bg-zinc-700 text-zinc-400'
            : 'bg-zinc-800 text-zinc-500'
        }`}>
          {serie.id}
        </div>

        {PR && (
          <span className="text-[#c8f542] text-xs font-black bg-[#c8f542]/10 px-2 py-0.5 rounded-lg">
            🏆 RECORDE
          </span>
        )}

        {timerInfo && (
          <span className="text-zinc-600 text-xs flex items-center gap-1">
            <IconStopwatch/>{timerInfo.duracao}s
          </span>
        )}

        {/* referência anterior inline */}
        {hS && !showHist && (
          <span className="text-zinc-700 text-xs ml-auto mr-1">
            ant: {hS.carga_kg}{ex.usaPlacas ? 'pl' : 'kg'} × {hS.repeticoes}
          </span>
        )}

        {/* remover série — só quando não enviada */}
        {!serie.enviada && (
          <button
            onPointerDown={(e) => { e.stopPropagation(); onRemSerie(); }}
            className="ml-auto w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <IconTrash/>
          </button>
        )}
      </div>

      {/* inputs carga + reps */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        <NumInputMobile
          label={ex.usaPlacas ? 'Placas' : 'Carga kg'}
          value={serie.carga}
          onChange={v => onUpdSerie('carga', v)}
          disabled={serie.enviada}
          step={stepCarga}
        />
        <NumInputMobile
          label="Repetições"
          value={serie.reps}
          onChange={v => onUpdSerie('reps', v)}
          disabled={serie.enviada}
          step={1}
        />
      </div>

      {/* botão confirmar — full width, polegar-friendly */}
      <div className="px-3 pb-3">
        <button
          onPointerDown={() => !serie.salvandoNow && onToggle()}
          disabled={serie.salvandoNow}
          className={`btn w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            serie.salvandoNow
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-500'
              : serie.enviada
              ? 'bg-transparent border-2 border-zinc-700 text-zinc-500 active:bg-zinc-800/60'
              : 'bg-[#c8f542] text-black active:bg-[#b0d93b] shadow-[0_0_24px_rgba(200,245,66,0.15)]'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {serie.salvandoNow ? (
            <>
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-[#c8f542] rounded-full animate-spin"/>
              <span>Salvando...</span>
            </>
          ) : serie.enviada ? (
            <><IconUndo/><span>Desfazer</span></>
          ) : (
            <><IconCheck/><span>Confirmar série {serie.id}</span></>
          )}
        </button>
      </div>
    </div>
  );
});

// ─── Card de Exercício ────────────────────────────────────────────────────────
const CardExercicio = memo(({
  ex, idx, total, hist,
  onRemover, onUpdNome, onConfirmarNome,
  onAltModoPlacas, onMover,
  onAddSerie, onAlternarSerie, onRemSerie, onUpdSerie,
  serieTimers,
}) => {
  const [showHist, setShowHist] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const seriesEnviadas = ex.series.filter(s => s.enviada).length;
  const totalSeries    = ex.series.length;
  const concluido      = seriesEnviadas === totalSeries && totalSeries > 0;

  // fecha menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showMenu]);

  return (
    <div className={`bg-zinc-900 border rounded-3xl overflow-hidden transition-colors ${
      concluido ? 'border-[#c8f542]/15' : 'border-zinc-800'
    }`}>

      {/* cabeçalho */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          {/* número */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
            concluido ? 'bg-[#c8f542]/15 text-[#c8f542]' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {concluido ? <IconCheck/> : idx + 1}
          </div>

          {/* nome */}
          <input
            type="text"
            value={ex.nome}
            onChange={e => onUpdNome(e.target.value)}
            onBlur={onConfirmarNome}
            placeholder="Nome do exercício"
            className="flex-1 min-w-0 bg-transparent text-white font-bold text-lg outline-none placeholder-zinc-700 border-b border-transparent focus:border-zinc-700 pb-0.5"
          />

          {/* contador séries */}
          <span className={`text-sm font-black num flex-shrink-0 ${concluido ? 'text-[#c8f542]' : 'text-zinc-500'}`}>
            {seriesEnviadas}/{totalSeries}
          </span>
        </div>

        {/* linha de controles */}
        <div className="flex items-center gap-2">
          {/* toggle kg/placas */}
          <button
            onPointerDown={onAltModoPlacas}
            disabled={ex.series.some(s => s.enviada)}
            className="btn flex items-center rounded-xl overflow-hidden border border-zinc-700 disabled:opacity-40"
            style={{ padding: 0, WebkitTapHighlightColor: 'transparent' }}
          >
            <span className={`px-3 py-2 text-xs font-bold transition-colors ${!ex.usaPlacas ? 'bg-[#c8f542] text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              kg
            </span>
            <span className="w-px h-full bg-zinc-700"/>
            <span className={`px-3 py-2 text-xs font-bold transition-colors ${ex.usaPlacas ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
              Placas
            </span>
          </button>

          {/* histórico */}
          {hist.length > 0 && (
            <button
              onPointerDown={() => setShowHist(h => !h)}
              className={`btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
                showHist
                  ? 'bg-amber-400/15 text-amber-400 border-amber-400/25'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <IconHistory/>
              {showHist ? 'Ocultar' : 'Anterior'}
            </button>
          )}

          <div className="flex-1"/>

          {/* menu contextual (3 pontos) */}
          <div className="relative" ref={menuRef}>
            <button
              onPointerDown={() => setShowMenu(m => !m)}
              className="btn w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 active:bg-zinc-700"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <IconDots/>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 z-40 bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl min-w-[168px]">
                {idx > 0 && (
                  <button
                    onPointerDown={() => { onMover(-1); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-white text-sm font-semibold active:bg-zinc-700"
                  >
                    <IconChevronUp/> Mover acima
                  </button>
                )}
                {idx < total - 1 && (
                  <button
                    onPointerDown={() => { onMover(1); setShowMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-white text-sm font-semibold active:bg-zinc-700 ${idx > 0 ? 'border-t border-zinc-700' : ''}`}
                  >
                    <IconChevronDown/> Mover abaixo
                  </button>
                )}
                <button
                  onPointerDown={() => { onRemover(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-red-400 text-sm font-semibold active:bg-zinc-700 border-t border-zinc-700"
                >
                  <IconTrash/> Remover
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* histórico anterior */}
      {showHist && hist.length > 0 && (
        <div className="mx-4 mb-3 bg-amber-950/30 border border-amber-400/15 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Sessão anterior</p>
          <div className="flex flex-col">
            {[...hist].sort((a, b) => a.numero_serie - b.numero_serie).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-amber-400/10 last:border-0">
                <span className="text-zinc-500 text-sm">Série {s.numero_serie}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-sm">{s.carga_kg} {ex.usaPlacas ? 'pl' : 'kg'}</span>
                  <span className="text-zinc-700 text-xs">×</span>
                  <span className="text-amber-400 font-bold text-sm">{s.repeticoes} reps</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* séries */}
      <div className="flex flex-col gap-3 px-3 pb-3">
        {ex.series.map(serie => (
          <CardSerie
            key={serie.id}
            ex={ex}
            serie={serie}
            hist={hist}
            showHist={showHist}
            timerInfo={serieTimers[`${ex.id}_${serie.id}`]}
            onToggle={() => onAlternarSerie(ex, serie)}
            onUpdSerie={(campo, val) => onUpdSerie(serie.id, campo, val)}
            onRemSerie={() => onRemSerie(serie.id)}
          />
        ))}

        {/* + série */}
        <button
          onPointerDown={onAddSerie}
          className="btn w-full py-4 rounded-2xl border border-dashed border-zinc-800 active:border-zinc-600 text-zinc-600 active:text-zinc-400 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <IconPlus/> Adicionar série
        </button>
      </div>
    </div>
  );
});

// ─── Componente principal ─────────────────────────────────────────────────────
function TelaTreino({ usuario, split, historicoAnterior, onFinalizar, onVoltar, mostrarToast }) {
  const [exerciciosInicializados, setExerciciosInicializados] = useState(false);
  const [isOnline, setIsOnline]   = useState(navigator.onLine);
  const [pendentes, setPendentes] = useState(() => getOfflineQueue().length);

  const idTreinoSessao = useRef((() => {
    const hoje  = new Date().toISOString().slice(0, 10);
    const chave = `fitapp_sessao_${split.id}_${usuario.id}_${hoje}`;
    const salvo = sessionStorage.getItem(chave);
    if (salvo) return salvo;
    const novo  = `${split.id}_${usuario.id}_${hoje}_${Date.now()}`;
    sessionStorage.setItem(chave, novo);
    return novo;
  })());

  const [exercicios, setExercicios] = useState([]);

  // online/offline
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      const { synced } = await syncOfflineQueue();
      setPendentes(getOfflineQueue().length);
      if (synced > 0) mostrarToast(`${synced} série${synced > 1 ? 's' : ''} sincronizada${synced > 1 ? 's' : ''}.`, 'sucesso');
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [mostrarToast]);

  // inicializar com histórico
  useEffect(() => {
    if (exerciciosInicializados) return;
    if (!historicoAnterior?.length) return;
    const mapaExercicios = new Map();
    historicoAnterior.forEach(s => {
      const nome = s.nome_exercicio?.trim() || '';
      if (!mapaExercicios.has(nome)) mapaExercicios.set(nome, []);
      mapaExercicios.get(nome).push(s);
    });
    const lista = Array.from(mapaExercicios.entries()).map(([nome, series], exIdx) => {
      const seriesOrdenadas = [...series].sort((a, b) => a.numero_serie - b.numero_serie);
      const usaPlacas = nome.startsWith('[P]');
      const nomeLimpo = usaPlacas ? nome.slice(3) : nome;
      return {
        id: Date.now() + exIdx, nome: nomeLimpo, nomeAnterior: nomeLimpo, usaPlacas,
        series: seriesOrdenadas.map((s, i) => ({
          id: i + 1, reps: s.repeticoes, carga: s.carga_kg, enviada: false, id_banco: null,
        })),
      };
    });
    setExercicios(lista);
    setExerciciosInicializados(true);
  }, [historicoAnterior, exerciciosInicializados]);

  const [showExModal, setShowExModal] = useState(false);
  const [tempoConfig, setTempoConfig] = useState(() => {
    const s = localStorage.getItem(REST_TIME_KEY);
    return s ? parseInt(s, 10) : 90;
  });
  const [timerAtivo, setTimerAtivo]       = useState(false);
  const [timerRestante, setTimerRestante] = useState(0);
  const [showConfig, setShowConfig]       = useState(false);
  const [showRestEnd, setShowRestEnd]     = useState(false);
  const [showNota, setShowNota]           = useState(false);
  const [notaTexto, setNotaTexto]         = useState('');
  const [notaSalva, setNotaSalva]         = useState(false);
  const [serieTimers, setSerieTimers]     = useState({});
  const serieTimerRef = useRef({});

  const intervalRef    = useRef(null);
  const timerFimRef    = useRef(null);
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
    const fmt = s => s >= 60 ? `${Math.floor(s / 60)}min${s % 60 ? ` ${s % 60}s` : ''}` : `${s}s`;
    mostrarToast(`Descanso: ${fmt(novoTempo)}`, 'info');
  }, [mostrarToast]);

  const onSelecionarExercicio = useCallback((nome) => {
    setShowExModal(false);
    setExercicios(e => [...e, {
      id: Date.now(), nome, nomeAnterior: nome, usaPlacas: false,
      series: [{ id: 1, reps: 12, carga: 0, enviada: false, id_banco: null }],
    }]);
  }, []);

  const alternarModoPlacas = useCallback((exId) => {
    setExercicios(e => e.map(x => {
      if (x.id !== exId) return x;
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
    for (const s of ex.series.filter(s => s.enviada && s.id_banco)) {
      try { await apiFetch(`${R.serie}?id=${s.id_banco}`, { method: 'DELETE' }); } catch {}
    }
  }, [exercicios]);

  const updNome = useCallback((id, novoNome) => {
    setExercicios(e => e.map(x => x.id === id ? { ...x, nome: novoNome } : x));
  }, []);

  const confirmarNome = useCallback(async (ex) => {
    const nomeNovo   = ex.nome.trim();
    const nomeAntigo = ex.nomeAnterior;
    setExercicios(e => e.map(x => x.id === ex.id ? { ...x, nomeAnterior: nomeNovo } : x));
    if (!nomeNovo || nomeNovo === nomeAntigo) return;
    const seriesEnviadas = ex.series.filter(s => s.enviada && s.id_banco);
    if (!seriesEnviadas.length) return;
    try {
      await apiFetch(R.serieNome, {
        method: 'POST',
        body: { ids: seriesEnviadas.map(s => s.id_banco), nome_exercicio: nomeNovo },
      });
    } catch {}
  }, []);

  const addSerie = useCallback((exId) =>
    setExercicios(e => e.map(x => {
      if (x.id !== exId) return x;
      const u = x.series[x.series.length - 1];
      return { ...x, series: [...x.series, { id: x.series.length + 1, reps: u?.reps || 12, carga: u?.carga || 0, enviada: false, id_banco: null }] };
    }))
  , []);

  const updSerie = useCallback((exId, sId, campo, val) =>
    setExercicios(e => e.map(x => x.id !== exId ? x : {
      ...x, series: x.series.map(s => s.id === sId ? { ...s, [campo]: Math.max(0, val) } : s),
    }))
  , []);

  const remSerie = useCallback((exId, sId) =>
    setExercicios(e => e.map(x => x.id !== exId ? x : { ...x, series: x.series.filter(s => s.id !== sId) }))
  , []);

  const pendentesRef = useRef(0);
  const [salvando, setSalvando] = useState(false);

  const alternarSerie = useCallback(async (ex, serie) => {
    const snapshot = exercicios.map(x => ({ ...x, series: x.series.map(s => ({ ...s })) }));
    const timerKey = `${ex.id}_${serie.id}`;

    if (serie.enviada) {
      setSerieTimers(t => { const n = { ...t }; delete n[timerKey]; return n; });
      setExercicios(cur => cur.map(x => x.id !== ex.id ? x : {
        ...x, series: x.series.map(s => s.id === serie.id ? { ...s, enviada: false, id_banco: null } : s),
      }));
      try { await apiFetch(`${R.serie}?id=${serie.id_banco}`, { method: 'DELETE' }); }
      catch { setExercicios(snapshot); mostrarToast('Sem conexão. Não removido.', 'erro'); }
    } else {
      if (!ex.nome.trim()) { mostrarToast('Digite o nome do exercício.', 'erro'); return; }
      const inicioSerie = serieTimerRef.current[timerKey] || Date.now();
      const duracaoSeg  = Math.round((Date.now() - inicioSerie) / 1000);
      setSerieTimers(t => ({ ...t, [timerKey]: { duracao: duracaoSeg } }));
      serieTimerRef.current[`${ex.id}_${serie.id + 1}`] = Date.now();

      const nid      = 'S' + Date.now();
      const idTreino = idTreinoSessao.current;

      setExercicios(cur => cur.map(x => x.id !== ex.id ? x : {
        ...x, series: x.series.map(s => s.id === serie.id ? { ...s, enviada: true, salvandoNow: true, id_banco: nid } : s),
      }));
      pendentesRef.current += 1;
      setSalvando(true);

      try {
        await apiFetchOffline(R.serie, {
          method: 'POST',
          body: {
            id_serie: nid, id_treino: idTreino,
            nome_exercicio: ex.usaPlacas ? `[P]${ex.nome}` : ex.nome,
            numero_serie: serie.id, repeticoes: serie.reps, carga_kg: serie.carga,
          },
        }, nid);
        setPendentes(getOfflineQueue().length);
        setExercicios(cur => cur.map(x => x.id !== ex.id ? x : {
          ...x, series: x.series.map(s => s.id === serie.id ? { ...s, salvandoNow: false } : s),
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
  }, [exercicios, mostrarToast, iniciarDescanso]);

  const histEx = useCallback((nome, nomeOriginal) => {
    if (!historicoAnterior?.length) return [];
    const chave = (nomeOriginal || nome)?.trim().toLowerCase();
    if (!chave) return [];
    return historicoAnterior.filter(s => {
      const nomeNorm = (s.nome_exercicio || '').replace(/^\[P\]/, '').trim().toLowerCase();
      return nomeNorm === chave;
    });
  }, [historicoAnterior]);

  const { totalEnv, totalSer } = useMemo(() => ({
    totalEnv: exercicios.reduce((a, ex) => a + ex.series.filter(s => s.enviada).length, 0),
    totalSer: exercicios.reduce((a, ex) => a + ex.series.length, 0),
  }), [exercicios]);

  const fmt2 = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-44">

      {showRestEnd && <RestEndBanner onDismiss={() => setShowRestEnd(false)}/>}
      {showConfig  && <ModalConfigDescanso tempoAtual={tempoConfig} onSalvar={salvarConfig} onFechar={() => setShowConfig(false)}/>}

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/96 backdrop-blur-md border-b border-zinc-900 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onVoltar}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0"
          >
            <IconBack/>
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-[#c8f542] text-xs font-semibold uppercase tracking-wider leading-none mb-0.5">Treino ativo</div>
            <div className="text-white font-bold text-lg truncate leading-tight">{split.nome}</div>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83"/>
              </svg>
              <span className="text-orange-400 font-bold text-xs">offline{pendentes > 0 ? ` · ${pendentes}` : ''}</span>
            </div>
          )}

          {timerAtivo && (
            <button
              onPointerDown={pararDescanso}
              className="flex items-center gap-1.5 bg-zinc-900 border border-[#c8f542]/30 rounded-xl px-3 py-2 active:bg-zinc-800"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8f542] pulse-green"/>
              <span className="text-[#c8f542] font-black text-sm num">{fmt2(timerRestante)}</span>
            </button>
          )}
        </div>

        {/* barra de progresso */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c8f542] rounded-full transition-all duration-500"
              style={{ width: `${totalSer ? Math.round(totalEnv / totalSer * 100) : 0}%` }}
            />
          </div>
          <span className="text-zinc-500 text-xs font-bold num">
            {totalEnv}<span className="text-zinc-700">/{totalSer}</span>
          </span>
        </div>
      </div>

      {/* ─── Exercícios ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 flex flex-col gap-4">
        {exercicios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">Nenhum exercício ainda</p>
              <p className="text-zinc-500 text-sm mt-1">Toque em "Adicionar exercício" abaixo</p>
            </div>
          </div>
        )}

        {exercicios.map((ex, idx) => (
          <CardExercicio
            key={ex.id}
            ex={ex}
            idx={idx}
            total={exercicios.length}
            hist={histEx(ex.nome, ex.nomeAnterior)}
            serieTimers={serieTimers}
            onRemover={() => remEx(ex.id)}
            onUpdNome={nome => updNome(ex.id, nome)}
            onConfirmarNome={() => confirmarNome(ex)}
            onAltModoPlacas={() => alternarModoPlacas(ex.id)}
            onMover={dir => moverEx(idx, dir)}
            onAddSerie={() => addSerie(ex.id)}
            onRemSerie={sId => remSerie(ex.id, sId)}
            onAlternarSerie={alternarSerie}
            onUpdSerie={(sId, campo, val) => updSerie(ex.id, sId, campo, val)}
          />
        ))}

        {/* botão adicionar exercício */}
        <button
          onPointerDown={() => setShowExModal(true)}
          className="btn w-full border-2 border-dashed border-zinc-800 active:border-zinc-600 active:bg-zinc-900 text-zinc-500 font-semibold py-6 rounded-3xl flex items-center justify-center gap-2"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <IconPlus/><span>Adicionar exercício</span>
        </button>
      </div>

      {/* modal exercício */}
      {showExModal && (
        <ModalExercicio onSelecionar={onSelecionarExercicio} onFechar={() => setShowExModal(false)}/>
      )}

      {/* ─── Barra inferior fixa ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-8 pt-3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/98 to-transparent">
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
        <div className="flex gap-3">
          {/* nota */}
          <button
            onPointerDown={() => setShowNota(true)}
            className={`btn w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${
              notaSalva
                ? 'bg-[#c8f542]/10 border-[#c8f542]/30 text-[#c8f542]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 active:bg-zinc-800'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <IconNote/>
          </button>

          {/* finalizar */}
          <button
            onPointerDown={() => {
              if (salvando) return;
              if (totalEnv === 0) { mostrarToast('Registre ao menos uma série antes de finalizar.', 'erro'); return; }
              onFinalizar({ exercicios, split });
            }}
            disabled={salvando}
            className="btn flex-1 py-5 bg-zinc-900 border border-zinc-700 active:bg-zinc-800 text-white font-bold text-base rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {salvando ? (
              <><div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"/><span>Salvando...</span></>
            ) : (
              <>
                <span>Finalizar</span>
                {totalEnv > 0 && <span className="text-[#c8f542] font-black num">{totalEnv} séries</span>}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Modal nota ───────────────────────────────────────────────────── */}
      {showNota && (
        <div
          className="fixed inset-0 z-[100] flex items-end"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowNota(false)}
        >
          <div
            className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-5 pt-5 pb-10 slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
            <h3 className="text-white font-black text-lg mb-1">Nota do treino</h3>
            <p className="text-zinc-500 text-sm mb-4">Como foi? Dores, observações, PRs quase batidos...</p>
            <textarea
              value={notaTexto}
              onChange={e => setNotaTexto(e.target.value)}
              placeholder="Ex: joelho doeu no agachamento, quase bati PR no supino..."
              rows={4}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-2xl border border-zinc-700 outline-none focus:border-[#c8f542] transition-colors text-sm placeholder-zinc-600 resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNota(false)} className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-semibold rounded-2xl">
                Fechar
              </button>
              <button
                onClick={async () => {
                  if (!notaTexto.trim()) { setShowNota(false); return; }
                  try {
                    await apiFetch(R.notaTreino, {
                      method: 'POST',
                      body: {
                        id_nota:    `nota_${usuario.id}_${Date.now()}`,
                        id_usuario: usuario.id,
                        id_treino:  idTreinoSessao.current,
                        data:       new Date().toISOString().slice(0, 10),
                        split:      split.nome,
                        nota:       notaTexto.trim(),
                      },
                    });
                    setNotaSalva(true);
                    mostrarToast('Nota salva.', 'sucesso');
                  } catch { mostrarToast('Erro ao salvar nota.', 'erro'); }
                  setShowNota(false);
                }}
                className="btn flex-1 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold rounded-2xl"
              >
                Salvar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TelaTreino;