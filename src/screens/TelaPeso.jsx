import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

const IconScale = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3v2a9 9 0 01-9 9 9 9 0 01-9-9V6z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v14M9 10l3-3 3 3"/>
  </svg>
);
const IconTrend = ({ up }) => up ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/>
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
  const areaD = [`M ${toX(0).toFixed(1)} ${toY(dados[0].peso_kg).toFixed(1)}`,
    ...dados.map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.peso_kg).toFixed(1)}`),
    `L ${toX(dados.length - 1).toFixed(1)} ${PAD.top + iH}`, `L ${toX(0).toFixed(1)} ${PAD.top + iH}`, 'Z'].join(' ');

  const yTicks = [min + 0.5, (min + max) / 2, max - 0.5].map(v => ({ v: Math.round(v * 10) / 10, y: toY(v) }));
  const step = Math.max(1, Math.floor(dados.length / 4));
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
        const idx = dados.indexOf(d);
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
  const [pesos, setPesos]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [valor, setValor]       = useState(String(usuario.peso_atual || ''));
  const [salvando, setSalvando] = useState(false);

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
          id_usuario: usuario.id,
          data: hoje,
          peso_kg: kg,
        },
      });
      mostrarToast('Peso registrado.', 'sucesso');
      await carregar();
    } catch { mostrarToast('Erro ao salvar.', 'erro'); }
    finally { setSalvando(false); }
  };

  const { variacao, variacaoTotal } = useMemo(() => {
    if (pesos.length < 2) return { variacao: null, variacaoTotal: null };
    const ultimo = pesos[pesos.length - 1].peso_kg;
    const penultimo = pesos[pesos.length - 2].peso_kg;
    const primeiro = pesos[0].peso_kg;
    return {
      variacao: +(ultimo - penultimo).toFixed(1),
      variacaoTotal: +(ultimo - primeiro).toFixed(1),
    };
  }, [pesos]);

  const pesoAtual = pesos.length > 0 ? pesos[pesos.length - 1].peso_kg : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Peso Corporal</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Acompanhe sua evolução</p>
        </div>
      </div>

      <div className="px-5 pt-5 pb-24 flex flex-col gap-5">

        {/* Registrar hoje */}
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
            {/* Cards de resumo */}
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

            {/* Gráfico */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Evolução</p>
              <MiniChart dados={pesos}/>
            </div>

            {/* Histórico de pesagens */}
            {pesos.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Histórico</p>
                <div className="flex flex-col">
                  {[...pesos].reverse().slice(0, 20).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-400 text-sm">{new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                      <span className="text-white font-bold text-base">{p.peso_kg} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}