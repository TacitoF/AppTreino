import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack, IconCardio, IconFlame } from '../components/icons';
import { ATIVIDADES_CARDIO, INTENSIDADE, calcularKcal, PESO_KEY } from '../data/cardio';

function TelaCardio({ usuario, onVoltar, mostrarToast }) {
  const [etapa, setEtapa]             = useState('escolha');
  const [atividadeId, setAtividadeId] = useState(null);
  const [intensidade, setIntensidade] = useState('moderado');
  const [peso, setPeso]               = useState(() => {
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

  useEffect(() => {
    apiFetch(`${R.cardio}?id_usuario=${usuario.id}&limite=5`)
      .then(r => setHistorico(r.registros || []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

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

          <div className="border-t border-zinc-900"/>

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

          <button onClick={iniciarCron}
            className="btn w-full py-7 bg-[#f97316] active:bg-[#ea6c0c] text-white font-black text-2xl rounded-2xl flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7">
              <circle cx="12" cy="13" r="8"/><path strokeLinecap="round" d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5"/>
            </svg>
            Começar
          </button>

          <button onClick={salvar} disabled={salvando}
            className="btn w-full py-3 text-zinc-500 text-sm font-medium active:text-zinc-300 disabled:opacity-40 flex items-center justify-center gap-2">
            {salvando ? 'Salvando...' : `Salvar ${kcal} kcal sem cronômetro`}
          </button>

        </div>
      </div>
    );
  }

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

export default TelaCardio;