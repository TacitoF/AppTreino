import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

const META_KEY = 'volt_meta_peso';

const IconTrend = ({ up }) => up ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"/>
  </svg>
);

const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);

function MiniChart({ dados, cor = '#c8f542' }) {
  if (!dados || dados.length < 2) return (
    <div className="flex items-center justify-center h-32 text-zinc-700 text-sm">
      Registre pelo menos 2 pesagens para ver o gráfico
    </div>
  );

  const W = 320, H = 120;
  const PAD = { top: 20, right: 16, bottom: 28, left: 40 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const values = dados.map(d => d.peso_kg);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;
  const toX = i => PAD.left + (i / (dados.length - 1)) * iW;
  const toY = v => PAD.top + iH - ((v - min) / range) * iH;
  const pathD = dados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.peso_kg).toFixed(1)}`).join(' ');
  const areaD = [
    `M ${toX(0).toFixed(1)} ${toY(dados[0].peso_kg).toFixed(1)}`,
    ...dados.map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.peso_kg).toFixed(1)}`),
    `L ${toX(dados.length - 1).toFixed(1)} ${PAD.top + iH}`,
    `L ${toX(0).toFixed(1)} ${PAD.top + iH}`,
    'Z',
  ].join(' ');

  const yTicks = [min + 0.5, (min + max) / 2, max - 0.5].map(v => ({ v: Math.round(v * 10) / 10, y: toY(v) }));
  const step   = Math.max(1, Math.floor(dados.length / 4));
  const xTicks = dados.filter((_, i) => i % step === 0 || i === dados.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="grad-peso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 3"/>
          <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="monospace">{t.v}</text>
        </g>
      ))}
      {xTicks.map((d, i) => {
        const idx   = dados.indexOf(d);
        const label = d.data ? d.data.slice(5).replace('-', '/') : '';
        return <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle" fill="#52525b" fontSize="8">{label}</text>;
      })}
      <path d={areaD} fill="url(#grad-peso)"/>
      <path d={pathD} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {dados.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.peso_kg)} r="3" fill="#0a0a0a" stroke={cor} strokeWidth="2"/>
      ))}
      <circle cx={toX(dados.length - 1)} cy={toY(dados[dados.length - 1].peso_kg)} r="5"
        fill={cor} stroke="#0a0a0a" strokeWidth="2"/>
    </svg>
  );
}

export default function TelaPeso({ usuario, onVoltar, mostrarToast }) {
  const [pesos, setPesos]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [valor, setValor]                     = useState(String(usuario.peso_atual || ''));
  const [salvando, setSalvando]               = useState(false);
  const [pesoParaDeletar, setPesoParaDeletar] = useState(null);
  const [deletando, setDeletando]             = useState(false);
  const [metaPeso, setMetaPeso]               = useState(() => {
    try { return localStorage.getItem(META_KEY) || ''; } catch { return ''; }
  });
  const [editandoMeta, setEditandoMeta]       = useState(false);
  const [metaInput, setMetaInput]             = useState('');

  const carregar = useCallback(async () => {
    try {
      const r = await apiFetch(`${R.peso}?id_usuario=${usuario.id}`);
      setPesos(r.pesos || []);
    } catch { mostrarToast('Erro ao carregar pesagens.', 'erro'); }
    finally { setLoading(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const hoje = new Date().toISOString().slice(0, 10);

  const registrar = async () => {
    const kg = parseFloat(valor.replace(',', '.'));
    if (!kg || kg < 20 || kg > 300) { mostrarToast('Peso inválido (20–300 kg).', 'erro'); return; }
    setSalvando(true);
    try {
      await apiFetch(R.peso, {
        method: 'POST',
        body: {
          id_registro: `peso_${usuario.id}_${hoje}_${Date.now()}`,
          id_usuario:  usuario.id,
          data:        hoje,
          peso_kg:     kg,
        },
      });
      mostrarToast('Peso registrado.', 'sucesso');
      await carregar();
    } catch { mostrarToast('Erro ao salvar.', 'erro'); }
    finally { setSalvando(false); }
  };

  const deletarPeso = async () => {
    if (!pesoParaDeletar) return;
    setDeletando(true);
    try {
      await apiFetch(`${R.peso}?id_registro=${encodeURIComponent(pesoParaDeletar.id_registro)}`, { method: 'DELETE' });
      mostrarToast('Pesagem removida.', 'sucesso');
      setPesoParaDeletar(null);
      await carregar();
    } catch { mostrarToast('Erro ao remover pesagem.', 'erro'); }
    finally { setDeletando(false); }
  };

  const salvarMeta = () => {
    const v = parseFloat(metaInput.replace(',', '.'));
    if (!v || v < 20 || v > 300) { mostrarToast('Meta inválida (20–300 kg).', 'erro'); return; }
    try { localStorage.setItem(META_KEY, String(v)); } catch {}
    setMetaPeso(String(v));
    setEditandoMeta(false);
    mostrarToast('Meta definida.', 'sucesso');
  };

  const { variacao, variacaoTotal } = useMemo(() => {
    if (pesos.length < 2) return { variacao: null, variacaoTotal: null };
    const ultimo    = pesos[pesos.length - 1].peso_kg;
    const penultimo = pesos[pesos.length - 2].peso_kg;
    const primeiro  = pesos[0].peso_kg;
    return {
      variacao:      +(ultimo - penultimo).toFixed(1),
      variacaoTotal: +(ultimo - primeiro).toFixed(1),
    };
  }, [pesos]);

  const pesoAtual = pesos.length > 0 ? pesos[pesos.length - 1].peso_kg : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onVoltar}
          className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Peso Corporal</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Acompanhe sua evolução</p>
        </div>
      </div>

      <div className="px-5 pt-5 pb-24 flex flex-col gap-5">

        {/* registrar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Registrar hoje</p>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 80.5"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-4 rounded-2xl border border-zinc-700 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">kg</span>
            </div>
            <button onClick={registrar} disabled={salvando}
              className="btn px-6 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold rounded-2xl disabled:opacity-50 whitespace-nowrap">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>

        {loading ? <Spinner/> : (
          <>
            {/* cards de resumo */}
            {pesoAtual && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-white">{pesoAtual}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">peso atual (kg)</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                  {variacao !== null ? (
                    <>
                      <div className={`text-2xl font-black flex items-center justify-center gap-1 ${variacao > 0 ? 'text-red-400' : variacao < 0 ? 'text-[#c8f542]' : 'text-zinc-400'}`}>
                        {variacao !== 0 && <IconTrend up={variacao > 0}/>}
                        {variacao > 0 ? '+' : ''}{variacao}
                      </div>
                      <div className="text-zinc-500 text-xs mt-0.5">vs anterior (kg)</div>
                    </>
                  ) : <div className="text-zinc-600 text-sm pt-2">—</div>}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                  {variacaoTotal !== null ? (
                    <>
                      <div className={`text-2xl font-black flex items-center justify-center gap-1 ${variacaoTotal > 0 ? 'text-red-400' : variacaoTotal < 0 ? 'text-[#c8f542]' : 'text-zinc-400'}`}>
                        {variacaoTotal !== 0 && <IconTrend up={variacaoTotal > 0}/>}
                        {variacaoTotal > 0 ? '+' : ''}{variacaoTotal}
                      </div>
                      <div className="text-zinc-500 text-xs mt-0.5">total (kg)</div>
                    </>
                  ) : <div className="text-zinc-600 text-sm pt-2">—</div>}
                </div>
              </div>
            )}

            {/* meta de peso */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <IconTarget/>
                  <p className="text-xs font-bold uppercase tracking-widest">Meta de peso</p>
                </div>
                <button
                  onClick={() => { setMetaInput(metaPeso); setEditandoMeta(true); }}
                  className="btn flex items-center gap-1.5 text-zinc-500 text-xs font-semibold bg-zinc-800 px-3 py-1.5 rounded-xl active:bg-zinc-700">
                  <IconEdit/>
                  {metaPeso ? 'Editar' : 'Definir'}
                </button>
              </div>
              {metaPeso && pesoAtual ? (() => {
                const meta         = parseFloat(metaPeso);
                const pesoInicial  = pesos.length > 0 ? pesos[0].peso_kg : pesoAtual;
                const diff         = +(pesoAtual - meta).toFixed(1);
                const totalCaminho = Math.abs(pesoInicial - meta);
                const percorrido   = Math.abs(pesoInicial - pesoAtual);
                const progresso    = totalCaminho > 0
                  ? Math.max(0, Math.min(100, Math.round((percorrido / totalCaminho) * 100)))
                  : 100;
                const atingiu = (pesoInicial >= meta && pesoAtual <= meta) || (pesoInicial <= meta && pesoAtual >= meta);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-zinc-400 text-sm">{pesoAtual} kg</span>
                      <span className={`font-bold text-sm ${atingiu ? 'text-[#c8f542]' : 'text-zinc-300'}`}>
                        {atingiu ? 'Meta atingida' : `${diff > 0 ? '+' : ''}${diff} kg da meta`}
                      </span>
                      <span className="text-zinc-400 text-sm">{meta} kg</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c8f542] rounded-full transition-all duration-700"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                    <p className="text-zinc-600 text-xs mt-1.5 text-right">{progresso}% concluído</p>
                  </div>
                );
              })() : (
                <p className="text-zinc-600 text-sm">Defina uma meta para acompanhar seu progresso.</p>
              )}
            </div>

            {/* gráfico */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Evolução</p>
              <MiniChart dados={pesos}/>
            </div>

            {/* histórico */}
            {pesos.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Histórico</p>
                <div className="flex flex-col">
                  {[...pesos].reverse().slice(0, 20).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-400 text-sm">
                        {new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short', day: '2-digit', month: 'short',
                        })}
                      </span>
                      <span className="text-white font-bold text-base">{p.peso_kg} kg</span>
                      <button
                        onClick={() => setPesoParaDeletar(p)}
                        className="btn w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800">
                        <IconTrash/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── modal deletar pesagem ── */}
      {pesoParaDeletar && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex flex-col justify-end"
          onClick={() => setPesoParaDeletar(null)}>
          <div
            className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6"/>
            <h3 className="text-white font-black text-xl mb-2 text-center">Remover pesagem?</h3>
            <p className="text-zinc-400 text-sm mb-8 text-center">
              {new Date(pesoParaDeletar.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: '2-digit', month: 'long',
              })}
              {' — '}
              <strong className="text-white">{pesoParaDeletar.peso_kg} kg</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPesoParaDeletar(null)}
                className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">
                Cancelar
              </button>
              <button
                onClick={deletarPeso}
                disabled={deletando}
                className="btn flex-1 py-4 bg-red-500/10 text-red-400 active:bg-red-500/20 font-bold rounded-2xl disabled:opacity-50">
                {deletando ? 'Removendo...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal meta de peso ── */}
      {editandoMeta && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex flex-col justify-end"
          onClick={() => setEditandoMeta(false)}>
          <div
            className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-5"/>
            <h3 className="text-white font-black text-lg mb-1">Meta de peso</h3>
            <p className="text-zinc-500 text-sm mb-4">Qual é o seu peso alvo?</p>
            <div className="relative mb-5">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 75.0"
                value={metaInput}
                onChange={e => setMetaInput(e.target.value)}
                autoFocus
                className="w-full bg-zinc-800 text-white px-4 py-4 rounded-2xl border border-zinc-700 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">kg</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditandoMeta(false)}
                className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-semibold rounded-2xl">
                Cancelar
              </button>
              <button
                onClick={salvarMeta}
                className="btn flex-1 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold rounded-2xl">
                Salvar meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}