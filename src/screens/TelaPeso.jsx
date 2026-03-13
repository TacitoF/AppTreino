import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';


// ─── Ícones locais ────────────────────────────────────────────────────────────
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"/>
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);
const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
  </svg>
);
const IconChevronDown = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
  </svg>
);

// ─── Gráfico de peso ──────────────────────────────────────────────────────────
function GraficoPeso({ dados, meta }) {
  if (!dados || dados.length < 2) return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-700">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <span className="text-sm">Registre 2+ pesagens para ver o gráfico</span>
    </div>
  );
  const W = 340, H = 150;
  const PAD = { top: 20, right: 24, bottom: 30, left: 44 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const values = dados.map(d => d.peso_kg);
  const metaV  = meta ? parseFloat(meta) : null;
  const allV   = metaV ? [...values, metaV] : values;
  const margin = Math.max((Math.max(...allV) - Math.min(...allV)) * 0.2, 1);
  const minV = Math.min(...allV) - margin, maxV = Math.max(...allV) + margin;
  const range = maxV - minV;
  const toX = i => PAD.left + (i / (dados.length - 1)) * iW;
  const toY = v => PAD.top + iH - ((v - minV) / range) * iH;
  const pathD = dados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.peso_kg).toFixed(1)}`).join(' ');
  const areaD = [`M ${toX(0).toFixed(1)} ${toY(dados[0].peso_kg).toFixed(1)}`,
    ...dados.map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.peso_kg).toFixed(1)}`),
    `L ${toX(dados.length-1).toFixed(1)} ${PAD.top+iH}`, `L ${toX(0).toFixed(1)} ${PAD.top+iH}`, 'Z'].join(' ');
  const cor = dados[dados.length-1].peso_kg <= dados[0].peso_kg ? '#c8f542' : '#f87171';
  const yTicks = [Math.min(...values), (Math.min(...values)+Math.max(...values))/2, Math.max(...values)]
    .map(v => ({ v: Math.round(v*10)/10, y: toY(v) }));
  const xIdx = dados.length <= 4 ? dados.map((_,i)=>i) : [0, Math.floor((dados.length-1)/2), dados.length-1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="gpeso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map((t,i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W-PAD.right} y1={t.y} y2={t.y} stroke="#27272a" strokeWidth="1" strokeDasharray="3 4"/>
          <text x={PAD.left-5} y={t.y+4} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="monospace">{t.v}</text>
        </g>
      ))}
      {metaV && <>
        <line x1={PAD.left} x2={W-PAD.right} y1={toY(metaV)} y2={toY(metaV)} stroke="#c8f542" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5"/>
        <text x={W-PAD.right+3} y={toY(metaV)+4} fill="#c8f542" fontSize="8.5" opacity="0.65">meta</text>
      </>}
      <path d={areaD} fill="url(#gpeso)"/>
      <path d={pathD} fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {dados.map((d,i) => <circle key={i} cx={toX(i)} cy={toY(d.peso_kg)} r="3" fill="#0a0a0a" stroke={cor} strokeWidth="2"/>)}
      <circle cx={toX(dados.length-1)} cy={toY(dados[dados.length-1].peso_kg)} r="5.5" fill={cor} stroke="#0a0a0a" strokeWidth="2.5"/>
      {xIdx.map(i => (
        <text key={i} x={toX(i)} y={H-6} textAnchor="middle" fill="#52525b" fontSize="9">
          {dados[i].data ? dados[i].data.slice(5).replace('-','/') : ''}
        </text>
      ))}
    </svg>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
function Sheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl px-5 pt-4 pb-10"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
        {children}
      </div>
    </div>
  );
}

// ─── TelaPeso ─────────────────────────────────────────────────────────────────
export default function TelaPeso({ usuario, onVoltar, mostrarToast }) {
  const [pesos, setPesos]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [valor, setValor]           = useState(String(usuario.peso_atual || ''));
  const [salvando, setSalvando]     = useState(false);
  const [deletar, setDeletar]       = useState(null);
  const [deletando, setDeletando]   = useState(false);
  const [sheetMeta, setSheetMeta]   = useState(false);
  const [sheetReg, setSheetReg]     = useState(false);
  const [metaInput, setMetaInput]   = useState('');
  const [histAberto, setHistAberto] = useState(false);
  const [metaPeso, setMetaPeso]     = useState('');

  const carregar = useCallback(async () => {
    try {
      const r = await apiFetch(`${R.peso}?id_usuario=${usuario.id}`);
      const todos = r.pesos || [];
      // Registro especial meta_<id> armazena a meta de peso na mesma sheet
      const metaReg = todos.find(p => p.id_registro === `meta_${usuario.id}`);
      const normais = todos.filter(p => p.id_registro !== `meta_${usuario.id}`);
      setPesos(normais);
      if (metaReg) setMetaPeso(String(metaReg.peso_kg));
    } catch { mostrarToast('Erro ao carregar pesagens.', 'erro'); }
    finally { setLoading(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const hoje = new Date().toISOString().slice(0, 10);

  const stepValor = delta => {
    const v = parseFloat(String(valor).replace(',', '.')) || 0;
    setValor((Math.round((v + delta) * 10) / 10).toFixed(1));
  };

  const registrar = async () => {
    const kg = parseFloat(String(valor).replace(',', '.'));
    if (!kg || kg < 20 || kg > 300) { mostrarToast('Peso inválido (20–300 kg).', 'erro'); return; }
    setSalvando(true);
    try {
      await apiFetch(R.peso, {
        method: 'POST',
        body: { id_registro: `peso_${usuario.id}_${hoje}_${Date.now()}`, id_usuario: usuario.id, data: hoje, peso_kg: kg },
      });
      mostrarToast('Peso registrado!', 'sucesso');
      setSheetReg(false);
      await carregar();
    } catch { mostrarToast('Erro ao salvar.', 'erro'); }
    finally { setSalvando(false); }
  };

  const confirmarDeletar = async () => {
    if (!deletar) return;
    setDeletando(true);
    try {
      await apiFetch(`${R.peso}?id_registro=${encodeURIComponent(deletar.id_registro)}`, { method: 'DELETE' });
      mostrarToast('Pesagem removida.', 'sucesso');
      setDeletar(null);
      await carregar();
    } catch { mostrarToast('Erro ao remover.', 'erro'); }
    finally { setDeletando(false); }
  };

  const salvarMeta = async () => {
    const v = parseFloat(String(metaInput).replace(',', '.'));
    if (!v || v < 20 || v > 300) { mostrarToast('Meta inválida (20–300 kg).', 'erro'); return; }
    try {
      await apiFetch(R.peso, {
        method: 'POST',
        body: { id_registro: `meta_${usuario.id}`, id_usuario: usuario.id, data: new Date().toISOString().slice(0, 10), peso_kg: v },
      });
      setMetaPeso(String(v)); setSheetMeta(false);
      mostrarToast('Meta definida!', 'sucesso');
    } catch { mostrarToast('Erro ao salvar meta.', 'erro'); }
  };

  const removerMeta = async () => {
    try {
      await apiFetch(`${R.peso}?id_registro=${encodeURIComponent(`meta_${usuario.id}`)}`, { method: 'DELETE' });
      setMetaPeso(''); setSheetMeta(false);
      mostrarToast('Meta removida.', 'sucesso');
    } catch { mostrarToast('Erro ao remover meta.', 'erro'); }
  };

  const { variacao, variacaoTotal } = useMemo(() => {
    if (pesos.length < 2) return { variacao: null, variacaoTotal: null };
    const ult = pesos[pesos.length - 1].peso_kg;
    return { variacao: +(ult - pesos[pesos.length-2].peso_kg).toFixed(1), variacaoTotal: +(ult - pesos[0].peso_kg).toFixed(1) };
  }, [pesos]);

  const pesoAtual = pesos.length > 0 ? pesos[pesos.length - 1].peso_kg : null;
  const metaNum   = metaPeso ? parseFloat(metaPeso) : null;

  const { progresso, atingiu, faltam } = useMemo(() => {
    if (!metaNum || !pesoAtual || pesos.length < 1) return { progresso: null, atingiu: false, faltam: null };
    const ini = pesos[0].peso_kg;
    const totalCaminho = Math.abs(ini - metaNum);
    const percorrido   = Math.abs(ini - pesoAtual);
    const prog   = totalCaminho > 0 ? Math.max(0, Math.min(100, Math.round(percorrido/totalCaminho*100))) : 100;
    const ating  = (ini >= metaNum && pesoAtual <= metaNum) || (ini <= metaNum && pesoAtual >= metaNum);
    return { progresso: prog, atingiu: ating, faltam: +(pesoAtual - metaNum).toFixed(1) };
  }, [metaNum, pesoAtual, pesos]);

  const fmtData = iso => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar}
            className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Peso corporal</h1>
            <p className="text-zinc-500 text-xs">Acompanhe sua evolução</p>
          </div>
          {/* Meta — sempre visível no header, área de toque mínima 44px */}
          <button onClick={() => { setMetaInput(metaPeso); setSheetMeta(true); }}
            className={`btn flex items-center gap-1.5 h-11 px-3 rounded-xl text-xs font-bold border ${
              metaNum ? 'bg-[#c8f542]/10 text-[#c8f542] border-[#c8f542]/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}>
            <IconTarget/>
            {metaNum ? `${metaNum} kg` : 'Meta'}
          </button>
        </div>
      </div>

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4 pb-28 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner/></div>
        ) : (
          <>
            {/* Card hero: peso atual */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              {pesoAtual ? (
                <>
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Peso atual</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">{pesoAtual}</span>
                        <span className="text-zinc-500 text-lg font-semibold">kg</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {variacao !== null && variacao !== 0 && (
                        <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl ${
                          variacao > 0 ? 'bg-red-500/10 text-red-400' : 'bg-[#c8f542]/10 text-[#c8f542]'
                        }`}>
                          {variacao > 0 ? '▲' : '▼'} {Math.abs(variacao)} kg
                        </div>
                      )}
                      {variacaoTotal !== null && variacaoTotal !== 0 && (
                        <p className="text-zinc-600 text-xs">{variacaoTotal > 0 ? '+' : ''}{variacaoTotal} kg total</p>
                      )}
                    </div>
                  </div>

                  {/* Barra de meta integrada no card */}
                  {metaNum && progresso !== null && (
                    <div className="pt-4 border-t border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                            {atingiu && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                              </svg>
                            )}
                            {atingiu ? 'Meta atingida!' : `Faltam ${Math.abs(faltam)} kg para a meta`}
                          </span>
                        <span className="text-zinc-500 text-xs">{progresso}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 text-xs w-10 text-right">{pesos[0]?.peso_kg}</span>
                        <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c8f542] rounded-full transition-all duration-500" style={{ width: `${progresso}%` }}/>
                        </div>
                        <span className="text-[#c8f542] text-xs font-bold w-10">{metaNum} kg</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={1.8} className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                    </svg>
                  </div>
                  <p className="text-white font-bold">Nenhum registro ainda</p>
                  <p className="text-zinc-500 text-sm mt-1">Use o botão abaixo para começar</p>
                </div>
              )}
            </div>

            {/* Gráfico */}
            {pesos.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-sm">Evolução</p>
                  <span className="text-zinc-600 text-xs">{pesos.length} registros</span>
                </div>
                <GraficoPeso dados={pesos} meta={metaPeso}/>
              </div>
            )}

            {/* Histórico colapsável */}
            {pesos.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Cabeçalho colapsável — área de toque grande */}
                <button onClick={() => setHistAberto(v => !v)}
                  className="btn w-full flex items-center justify-between px-4 py-4 active:bg-zinc-800">
                  <span className="text-white font-bold text-sm">Histórico</span>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-xs">{pesos.length} registros</span>
                    <IconChevronDown open={histAberto}/>
                  </div>
                </button>

                {histAberto && (
                  <div className="border-t border-zinc-800">
                    {[...pesos].reverse().slice(0, 30).map((p, i, arr) => {
                      const anterior = arr[i + 1];
                      const diff = anterior ? +(p.peso_kg - anterior.peso_kg).toFixed(1) : null;
                      return (
                        <div key={p.id_registro || i}
                          className="flex items-center gap-3 px-4 border-b border-zinc-800/50 last:border-0"
                          style={{ minHeight: 56 }}>
                          <div className="flex-1 min-w-0 py-3">
                            <span className="text-white font-semibold text-sm">{p.peso_kg} kg</span>
                            <span className="text-zinc-500 text-xs ml-2">{fmtData(p.data)}</span>
                          </div>
                          {diff !== null && diff !== 0 && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                              diff > 0 ? 'bg-red-500/10 text-red-400' : 'bg-[#c8f542]/10 text-[#c8f542]'
                            }`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          )}
                          {/* Botão deletar: área de toque 44×44px mínimo */}
                          <button onClick={() => setDeletar(p)}
                            className="btn w-11 h-11 flex items-center justify-center rounded-xl text-zinc-700 active:text-red-400 active:bg-zinc-800 flex-shrink-0">
                            <IconTrash/>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FAB Registrar ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 inset-x-4 z-30">
        <button onClick={() => setSheetReg(true)}
          className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-black/50">
          <IconPlus/>
          Registrar peso hoje
        </button>
      </div>

      {/* ── Sheet: Registrar peso ─────────────────────────────────────────────── */}
      <Sheet open={sheetReg} onClose={() => setSheetReg(false)}>
        <h3 className="text-white font-black text-xl mb-1">Registrar peso</h3>
        <p className="text-zinc-500 text-sm mb-6">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>

        {/* Stepper com botões grandes — ideal para polegar */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => stepValor(-0.5)}
            className="btn w-16 h-16 rounded-2xl bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-white flex-shrink-0">
            <IconMinus/>
          </button>
          <div className="flex-1 relative">
            {/* type=text evita que o iOS interprete "62,7" como 627 —
                o parse manual com replace(',','.') garante o valor correto */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="80.5"
              value={valor}
              onChange={e => setValor(e.target.value)}
              onFocus={e => e.target.select()}
              className="w-full bg-zinc-900 text-white text-center text-4xl font-black px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors placeholder-zinc-700"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">kg</span>
          </div>
          <button onClick={() => stepValor(0.5)}
            className="btn w-16 h-16 rounded-2xl bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-white flex-shrink-0">
            <IconPlus/>
          </button>
        </div>

        <button onClick={registrar} disabled={salvando || !valor}
          className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black text-lg rounded-2xl disabled:opacity-40">
          {salvando ? 'Salvando...' : 'Confirmar'}
        </button>
      </Sheet>

      {/* ── Sheet: Meta ──────────────────────────────────────────────────────── */}
      <Sheet open={sheetMeta} onClose={() => setSheetMeta(false)}>
        <h3 className="text-white font-black text-xl mb-1">Meta de peso</h3>
        <p className="text-zinc-500 text-sm mb-5">Qual é o seu peso alvo?</p>
        <div className="relative mb-5">
          <input type="text" inputMode="decimal" placeholder="Ex: 75.0"
            value={metaInput} onChange={e => setMetaInput(e.target.value)}
            onFocus={e => e.target.select()}
            autoFocus
            className="w-full bg-zinc-900 text-white text-center text-3xl font-black px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors placeholder-zinc-700"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">kg</span>
        </div>
        <div className="flex gap-3">
          {metaPeso && (
            <button onClick={removerMeta}
              className="btn px-5 py-4 bg-zinc-800 active:bg-zinc-700 text-zinc-400 font-semibold rounded-2xl whitespace-nowrap">
              Remover
            </button>
          )}
          <button onClick={salvarMeta}
            className="btn flex-1 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black rounded-2xl">
            Salvar meta
          </button>
        </div>
      </Sheet>

      {/* ── Sheet: Confirmar deletar ──────────────────────────────────────────── */}
      <Sheet open={!!deletar} onClose={() => setDeletar(null)}>
        <h3 className="text-white font-black text-xl text-center mb-2">Remover pesagem?</h3>
        {deletar && (
          <p className="text-zinc-400 text-sm text-center mb-8">
            {fmtData(deletar.data)} · <strong className="text-white">{deletar.peso_kg} kg</strong>
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={() => setDeletar(null)}
            className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">
            Cancelar
          </button>
          <button onClick={confirmarDeletar} disabled={deletando}
            className="btn flex-1 py-4 bg-red-500/15 text-red-400 active:bg-red-500/25 font-bold rounded-2xl disabled:opacity-50">
            {deletando ? 'Removendo...' : 'Sim, remover'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}