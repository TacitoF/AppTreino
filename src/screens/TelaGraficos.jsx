import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDataCurta = iso => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

function processarSeries(series) {
  const porExercicio = {}, porData = {};
  series.forEach(s => {
    const nomeRaw = s.nome_exercicio || '';
    const nome = nomeRaw.startsWith('[P]') ? nomeRaw.slice(3) : nomeRaw;
    const data = s.data_treino;
    const vol  = s.carga_kg * s.repeticoes;
    if (!porExercicio[nome]) porExercicio[nome] = {};
    if (!porExercicio[nome][data] || s.carga_kg > porExercicio[nome][data].carga)
      porExercicio[nome][data] = { carga: s.carga_kg, repeticoes: s.repeticoes };
    if (!porData[data]) porData[data] = 0;
    porData[data] += vol;
  });
  const exerciciosProcessados = Object.entries(porExercicio).map(([nome, diasMap]) => {
    const pontos = Object.entries(diasMap).sort(([a],[b]) => a.localeCompare(b))
      .map(([data, v]) => ({ label: fmtDataCurta(data), valor: v.carga, data }));
    const melhorCarga = Math.max(...pontos.map(p => p.valor));
    const progressao  = pontos.length > 1
      ? Number(((pontos.at(-1).valor - pontos[0].valor) / (pontos[0].valor || 1) * 100).toFixed(0))
      : 0;
    return { nome, pontos, melhorCarga, progressao, sessoes: pontos.length };
  }).sort((a, b) => b.sessoes - a.sessoes);

  const semanas = {};
  Object.entries(porData).forEach(([data, vol]) => {
    const d = new Date(data + 'T00:00:00');
    const seg = new Date(d);
    seg.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const chave = seg.toISOString().slice(0, 10);
    if (!semanas[chave]) semanas[chave] = { vol: 0, treinos: 0 };
    semanas[chave].vol += vol;
    semanas[chave].treinos += 1;
  });
  const sorted = Object.entries(semanas).sort(([a],[b]) => a.localeCompare(b)).slice(-8);
  const volumeSemanal = sorted.map(([data, v]) => ({ label: fmtDataCurta(data), valor: Math.round(v.vol), treinos: v.treinos }));
  const freqSemanal   = sorted.map(([data, v]) => ({ label: fmtDataCurta(data), valor: v.treinos }));
  return { exerciciosProcessados, volumeSemanal, freqSemanal };
}

// ─── Gráfico de linha SVG ─────────────────────────────────────────────────────
function LineChart({ dados, cor = '#c8f542', label = 'kg', height = 160 }) {
  if (!dados || dados.length < 2) return (
    <div className="flex items-center justify-center h-36 text-zinc-700 text-sm">
      Poucos dados para exibir
    </div>
  );
  const W = 340, H = height;
  const PAD = { top: 28, right: 20, bottom: 30, left: 42 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const values = dados.map(d => d.valor);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const toX = i => PAD.left + (i / (dados.length - 1)) * iW;
  const toY = v => PAD.top + iH - ((v - min) / range) * iH;
  const pathD = dados.map((d,i) => `${i===0?'M':'L'} ${toX(i).toFixed(1)} ${toY(d.valor).toFixed(1)}`).join(' ');
  const areaD = [`M ${toX(0).toFixed(1)} ${toY(dados[0].valor).toFixed(1)}`,
    ...dados.map((d,i) => `L ${toX(i).toFixed(1)} ${toY(d.valor).toFixed(1)}`),
    `L ${toX(dados.length-1).toFixed(1)} ${PAD.top+iH}`, `L ${toX(0).toFixed(1)} ${PAD.top+iH}`, 'Z'].join(' ');
  const yTicks = [min, min + range*0.5, max].map(v => ({ v: Math.round(v*10)/10, y: toY(v) }));
  const step = Math.max(1, Math.floor(dados.length / 4));
  const xTicks = dados.filter((_, i) => i % step === 0 || i === dados.length - 1);
  const gradId = `gl-${cor.replace('#','')}`;
  const lx = toX(dados.length-1), ly = toY(dados[dados.length-1].valor);
  const nearTop = ly < PAD.top + 18;
  const labelTxt = `${dados[dados.length-1].valor}${label}`;
  const labelW = labelTxt.length * 6.5 + 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map((t,i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W-PAD.right} y1={t.y} y2={t.y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 3"/>
          <text x={PAD.left-5} y={t.y+4} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="monospace">{t.v}</text>
        </g>
      ))}
      <path d={areaD} fill={`url(#${gradId})`}/>
      <path d={pathD} fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {dados.map((d,i) => <circle key={i} cx={toX(i)} cy={toY(d.valor)} r="3.5" fill="#0a0a0a" stroke={cor} strokeWidth="2"/>)}
      <circle cx={lx} cy={ly} r="5" fill={cor} stroke="#0a0a0a" strokeWidth="2.5"/>
      <g>
        <rect x={lx - labelW/2} y={(nearTop ? ly+6 : ly-16)} width={labelW} height={14} rx="4" fill="#0a0a0a" opacity="0.85"/>
        <text x={lx} y={(nearTop ? ly+16 : ly-5)} textAnchor="middle" fill={cor} fontSize="10" fontWeight="bold" fontFamily="monospace">
          {labelTxt}
        </text>
      </g>
      {xTicks.map((d,i) => {
        const idx = dados.indexOf(d);
        return <text key={i} x={toX(idx)} y={H-5} textAnchor="middle" fill="#52525b" fontSize="9">{d.label}</text>;
      })}
    </svg>
  );
}

// ─── Gráfico de barras SVG ────────────────────────────────────────────────────
function BarChart({ dados, cor = '#c8f542', height = 130 }) {
  if (!dados || dados.length === 0) return null;
  const W = 340, H = height;
  const PAD = { top: 10, right: 10, bottom: 26, left: 46 };
  const iW = W - PAD.left - PAD.right, iH = H - PAD.top - PAD.bottom;
  const max = Math.max(...dados.map(d => d.valor), 1);
  const barW = Math.max(10, (iW / dados.length) * 0.55);
  const gap  = iW / dados.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {[0, 0.5, 1].map((r, i) => {
        const v = Math.round(max * r), y = PAD.top + iH - r * iH;
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W-PAD.right} y1={y} y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 3"/>
            <text x={PAD.left-5} y={y+4} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="monospace">{v}</text>
          </g>
        );
      })}
      {dados.map((d, i) => {
        const barH = Math.max((d.valor / max) * iH, 2);
        const x = PAD.left + gap * i + gap / 2 - barW / 2;
        const y = PAD.top + iH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4"
              fill={cor} opacity={i === dados.length - 1 ? 1 : 0.4}/>
            <text x={x + barW/2} y={H-7} textAnchor="middle" fill="#52525b" fontSize="8.5">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Heatmap de dias ──────────────────────────────────────────────────────────
function HeatmapDias({ series }) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const contagem = [0,0,0,0,0,0,0];
  const datas = new Set(series.map(s => s.data_treino));
  datas.forEach(data => { contagem[new Date(data + 'T00:00:00').getDay()]++; });
  const max = Math.max(...contagem, 1);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-white font-bold text-sm mb-0.5">Dias preferidos</p>
      <p className="text-zinc-600 text-xs mb-4">Qual dia você mais treina</p>
      <div className="flex gap-2">
        {dias.map((d, i) => {
          const ratio = contagem[i] / max;
          const op = ratio === 0 ? 0.07 : 0.12 + ratio * 0.88;
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold"
                style={{ background: `rgba(16,185,129,${op})`, color: ratio > 0.5 ? '#10b981' : '#52525b' }}>
                {contagem[i]}
              </div>
              <span className="text-zinc-600 text-[10px]">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TelaGraficos ─────────────────────────────────────────────────────────────
function TelaGraficos({ usuario, splitInicial, onVoltar, mostrarToast }) {
  const [series, setSeries]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [splitFiltro, setSplit] = useState(splitInicial || 'todos');
  const [exSelecionado, setEx]  = useState(null);
  const [aba, setAba]           = useState('evolucao');
  const [sheetEx, setSheetEx]   = useState(false); // sheet seleção de exercício

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`${R.historicoTodos}?id_usuario=${usuario.id}`);
      setSeries(r.series || []);
    } catch { mostrarToast('Erro ao carregar dados.', 'erro'); }
    finally { setLoading(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const splits = useMemo(() => {
    const nomes = Array.from(new Set(series.map(s => s.nome_split).filter(Boolean)));
    return ['todos', ...nomes];
  }, [series]);

  const seriesFiltradas = useMemo(
    () => splitFiltro === 'todos' ? series : series.filter(s => s.nome_split === splitFiltro),
    [series, splitFiltro]
  );

  const { exerciciosProcessados, volumeSemanal, freqSemanal } = useMemo(
    () => processarSeries(seriesFiltradas), [seriesFiltradas]
  );

  useEffect(() => {
    if (exerciciosProcessados.length === 0) return;
    // se o exercício selecionado não existe na lista atual (troca de split), reseta para o primeiro
    const existe = exerciciosProcessados.some(e => e.nome === exSelecionado);
    if (!exSelecionado || !existe) setEx(exerciciosProcessados[0].nome);
  }, [exerciciosProcessados, exSelecionado]);

  const exAtual = exerciciosProcessados.find(e => e.nome === exSelecionado);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onVoltar}
            className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Gráficos</h1>
            <p className="text-zinc-500 text-xs">Evolução de carga e volume</p>
          </div>
        </div>

        {/* Filtro de split — scroll horizontal */}
        {splits.length > 2 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {splits.map(s => (
              <button key={s} onClick={() => { setSplit(s); setEx(null); }}
                className={`btn flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  splitFiltro === s ? 'bg-[#c8f542] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                }`}>
                {s === 'todos' ? 'Todos' : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Spinner/></div>
      ) : series.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={2} className="w-8 h-8">
                <rect x="3" y="3" width="4" height="18" rx="1"/>
                <rect x="10" y="8" width="4" height="13" rx="1"/>
                <rect x="17" y="5" width="4" height="16" rx="1"/>
              </svg>
            </div>
          <p className="text-white font-black text-lg">Sem dados ainda</p>
          <p className="text-zinc-500 text-sm">Finalize alguns treinos para ver seus gráficos de evolução.</p>
        </div>
      ) : (
        <div className="px-4 pt-4 pb-10 flex flex-col gap-5">

          {/* Tabs — altura mínima 48px para toque fácil */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 gap-1">
            {[['evolucao','Evolução'], ['volume','Volume'], ['frequencia','Frequência']].map(([v,l]) => (
              <button key={v} onClick={() => setAba(v)}
                className={`btn flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  aba === v ? 'bg-[#c8f542] text-black' : 'text-zinc-500 active:text-zinc-300'
                }`}>
                {l}
              </button>
            ))}
          </div>

          {/* ── ABA EVOLUÇÃO ── */}
          {aba === 'evolucao' && (
            <>
              {/* Seletor de exercício — um botão grande ao invés de chips scrolláveis */}
              {exAtual && (
                <button onClick={() => setSheetEx(true)}
                  className="btn w-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl px-4 py-4 flex items-center gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Exercício</p>
                    <p className="text-white font-bold truncate">{exAtual.nome}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                      exAtual.progressao >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {exAtual.progressao >= 0 ? '▲' : '▼'} {Math.abs(exAtual.progressao)}%
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-zinc-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </button>
              )}

              {exAtual && (
                <>
                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { v: `${exAtual.melhorCarga}kg`, l: 'Melhor carga', c: 'text-[#c8f542]' },
                      { v: `${exAtual.progressao >= 0 ? '+' : ''}${exAtual.progressao}%`, l: 'Progressão',   c: exAtual.progressao >= 0 ? 'text-emerald-400' : 'text-red-400' },
                      { v: String(exAtual.sessoes),                                         l: 'Sessões',      c: 'text-white' },
                    ].map(({ v, l, c }) => (
                      <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
                        <div className={`${c} font-black text-lg`}>{v}</div>
                        <div className="text-zinc-600 text-xs mt-0.5">{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-bold text-sm">{exAtual.nome}</p>
                        <p className="text-zinc-600 text-xs">Evolução de carga</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#c8f542]/10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-4 h-4">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                      </div>
                    </div>
                    <LineChart dados={exAtual.pontos} cor="#c8f542" label="kg" height={160}/>
                  </div>
                </>
              )}

              {/* Lista de exercícios — cada item bem espaçado para toque */}
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                  Todos os exercícios ({exerciciosProcessados.length})
                </p>
                <div className="flex flex-col gap-2">
                  {exerciciosProcessados.map(ex => (
                    <button key={ex.nome} onClick={() => { setEx(ex.nome); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`btn w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left ${
                        exSelecionado === ex.nome
                          ? 'bg-[#c8f542]/8 border border-[#c8f542]/30'
                          : 'bg-zinc-900 border border-zinc-800 active:bg-zinc-800'
                      }`}>
                      {exSelecionado === ex.nome && (
                        <div className="w-1.5 h-full min-h-[20px] bg-[#c8f542] rounded-full flex-shrink-0"/>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{ex.nome}</div>
                        <div className="text-zinc-600 text-xs mt-0.5">{ex.sessoes} sessão{ex.sessoes !== 1 ? 'ões' : ''}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-white font-bold text-sm">{ex.melhorCarga} kg</div>
                        <div className={`text-xs font-semibold ${ex.progressao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ex.progressao >= 0 ? '▲' : '▼'} {Math.abs(ex.progressao)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── ABA VOLUME ── */}
          {aba === 'volume' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-sm">Volume semanal</p>
                    <p className="text-zinc-600 text-xs">kg total por semana (carga × reps)</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2.5} className="w-4 h-4">
                      <rect x="3" y="3" width="4" height="18" rx="1"/>
                      <rect x="10" y="8" width="4" height="13" rx="1"/>
                      <rect x="17" y="5" width="4" height="16" rx="1"/>
                    </svg>
                  </div>
                </div>
                <BarChart dados={volumeSemanal} cor="#3b82f6" height={140}/>
              </div>
              {volumeSemanal.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: 'kg/semana (média)',   v: Math.round(volumeSemanal.reduce((a,v)=>a+v.valor,0)/volumeSemanal.length).toLocaleString(), c: 'text-blue-400' },
                    { l: 'kg/semana (recorde)', v: Math.max(...volumeSemanal.map(v=>v.valor)).toLocaleString(),                                  c: 'text-white' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                      <div className={`${c} font-black text-2xl`}>{v}</div>
                      <div className="text-zinc-600 text-xs mt-1">{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── ABA FREQUÊNCIA ── */}
          {aba === 'frequencia' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-sm">Frequência semanal</p>
                    <p className="text-zinc-600 text-xs">Dias treinados por semana</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <BarChart dados={freqSemanal} cor="#10b981" height={130}/>
              </div>
              {freqSemanal.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { l: 'Média/sem.',  v: (freqSemanal.reduce((a,v)=>a+v.valor,0)/freqSemanal.length).toFixed(1) },
                    { l: 'Melhor sem.', v: Math.max(...freqSemanal.map(v=>v.valor)) },
                    { l: 'Total dias',  v: freqSemanal.reduce((a,v)=>a+v.valor,0) },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
                      <div className="text-emerald-400 font-black text-xl">{v}</div>
                      <div className="text-zinc-600 text-xs mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
              )}
              <HeatmapDias series={seriesFiltradas}/>
            </>
          )}
        </div>
      )}

      {/* ── Bottom Sheet: selecionar exercício ────────────────────────────────── */}
      {sheetEx && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end" onClick={() => setSheetEx(false)}>
          <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl pt-4 pb-10 max-h-[75vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4"/>
            <p className="text-white font-black text-lg px-5 mb-3">Escolher exercício</p>
            <div className="overflow-y-auto flex-1 px-4">
              <div className="flex flex-col gap-2 pb-2">
                {exerciciosProcessados.map(ex => (
                  <button key={ex.nome}
                    onClick={() => { setEx(ex.nome); setSheetEx(false); }}
                    className={`btn w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left ${
                      exSelecionado === ex.nome
                        ? 'bg-[#c8f542]/10 border border-[#c8f542]/30'
                        : 'bg-zinc-900 border border-zinc-800 active:bg-zinc-800'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${exSelecionado === ex.nome ? 'text-[#c8f542]' : 'text-white'}`}>
                        {ex.nome}
                      </div>
                      <div className="text-zinc-600 text-xs mt-0.5">{ex.sessoes} sessão{ex.sessoes !== 1 ? 'ões' : ''} · melhor {ex.melhorCarga} kg</div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                      ex.progressao >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {ex.progressao >= 0 ? '+' : ''}{ex.progressao}%
                    </div>
                    {exSelecionado === ex.nome && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TelaGraficos;