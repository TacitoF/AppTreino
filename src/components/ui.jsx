import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { IconSettings, IconTimer, IconStop } from './icons';

export const Toast = memo(({ data }) => {
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
export const RestEndBanner = memo(({ onDismiss }) => {
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
export const ModalConfigDescanso = memo(({ tempoAtual, onSalvar, onFechar }) => {
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
export const BarraDescanso = memo(({ tempoConfig, onAbrirConfig, onIniciar, timerAtivo, timerRestante, onPararTimer }) => {
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
export const Spinner = memo(() => (
  <div className="flex justify-center py-10">
    <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#c8f542] rounded-full animate-spin"/>
  </div>
));

// ─── INPUT NUMÉRICO — um toque abre teclado numérico no iOS ─────────────────
// Estratégia: input sempre renderizado e visível, nunca escondido.
// O iOS abre o teclado no primeiro toque quando o input já está no DOM e focável.
// Evitar display:none / pointer-events:none — ambos impedem o focus no primeiro tap.
export const NumInput = memo(({ label, value, onChange, disabled }) => {
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


export const IOSInstallBanner = memo(() => {
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