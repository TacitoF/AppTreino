import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

// ─── SVG Line Chart ──────────────────────────────────────────────────────────
function LineChart({ dados, cor = '#c8f542', label = 'kg', height = 140 }) {
  if (!dados || dados.length < 2) {
    return (
      <div className="flex items-center justify-center h-36 text-zinc-700 text-sm">
        Poucos dados para exibir
      </div>
    );
  }

  const W = 320;
  const H = height;
  const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = dados.map(d => d.valor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = i => PAD.left + (i / (dados.length - 1)) * innerW;
  const toY = v => PAD.top + innerH - ((v - min) / range) * innerH;

  const pathD = dados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.valor)}`).join(' ');
  const areaD = [
    `M ${toX(0)} ${toY(dados[0].valor)}`,
    ...dados.map((d, i) => `L ${toX(i)} ${toY(d.valor)}`),
    `L ${toX(dados.length - 1)} ${PAD.top + innerH}`,
    `L ${toX(0)} ${PAD.top + innerH}`,
    'Z',
  ].join(' ');

  // ticks Y
  const yTicks = [min, min + range * 0.5, max].map(v => ({
    v: Math.round(v * 10) / 10,
    y: toY(v),
  }));

  // ticks X: mostrar no máx 5 datas
  const step = Math.max(1, Math.floor(dados.length / 5));
  const xTicks = dados.filter((_, i) => i % step === 0 || i === dados.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${cor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0.02"/>
        </linearGradient>
      </defs>

      {/* grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y}
            stroke="#27272a" strokeWidth="1" strokeDasharray="4 3"/>
          <text x={PAD.left - 6} y={t.y + 4} textAnchor="end"
            fill="#52525b" fontSize="9" fontFamily="monospace">
            {t.v}
          </text>
        </g>
      ))}

      {/* area */}
      <path d={areaD} fill={`url(#grad-${cor.replace('#', '')})`}/>

      {/* line */}
      <path d={pathD} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* pontos */}
      {dados.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.valor)} r="3.5"
          fill="#0a0a0a" stroke={cor} strokeWidth="2"/>
      ))}

      {/* último valor destacado */}
      <text x={toX(dados.length - 1)} y={toY(dados[dados.length - 1].valor) - 8}
        textAnchor="middle" fill={cor} fontSize="10" fontWeight="bold" fontFamily="monospace">
        {dados[dados.length - 1].valor}{label}
      </text>

      {/* X labels */}
      {xTicks.map((d, i) => {
        const idx = dados.indexOf(d);
        return (
          <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle"
            fill="#52525b" fontSize="8.5" fontFamily="sans-serif">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Bar Chart (volume semanal) ───────────────────────────────────────────────
function BarChart({ dados, cor = '#c8f542', height = 120 }) {
  if (!dados || dados.length === 0) return null;

  const W = 320;
  const H = height;
  const PAD = { top: 10, right: 10, bottom: 24, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...dados.map(d => d.valor), 1);
  const barW = Math.max(8, (innerW / dados.length) * 0.6);
  const gap  = innerW / dados.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* y ticks */}
      {[0, 0.5, 1].map((r, i) => {
        const v = Math.round(max * r);
        const y = PAD.top + innerH - r * innerH;
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="#27272a" strokeWidth="1" strokeDasharray="4 3"/>
            <text x={PAD.left - 6} y={y + 4} textAnchor="end"
              fill="#52525b" fontSize="9" fontFamily="monospace">{v}</text>
          </g>
        );
      })}

      {dados.map((d, i) => {
        const barH = (d.valor / max) * innerH;
        const x = PAD.left + gap * i + gap / 2 - barW / 2;
        const y = PAD.top + innerH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 2)}
              rx="3" fill={cor} opacity={i === dados.length - 1 ? 1 : 0.45}/>
            <text x={x + barW / 2} y={H - 6} textAnchor="middle"
              fill="#52525b" fontSize="8" fontFamily="sans-serif">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtDataCurta = iso => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

function processarSeries(series) {
  // Por exercício: melhor carga por data
  const porExercicio = {};
  const porData = {};

  series.forEach(s => {
    const nomeRaw = s.nome_exercicio || '';
    const nome = nomeRaw.startsWith('[P]') ? nomeRaw.slice(3) : nomeRaw;
    const data = s.data_treino;
    const vol  = s.carga_kg * s.repeticoes;

    if (!porExercicio[nome]) porExercicio[nome] = {};
    if (!porExercicio[nome][data] || s.carga_kg > porExercicio[nome][data].carga) {
      porExercicio[nome][data] = { carga: s.carga_kg, repeticoes: s.repeticoes };
    }

    if (!porData[data]) porData[data] = 0;
    porData[data] += vol;
  });

  // Converter em arrays ordenados
  const exerciciosProcessados = Object.entries(porExercicio).map(([nome, diasMap]) => {
    const pontos = Object.entries(diasMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, v]) => ({ label: fmtDataCurta(data), valor: v.carga, data }));
    const melhorCarga = Math.max(...pontos.map(p => p.valor));
    const progressao  = pontos.length > 1
      ? ((pontos.at(-1).valor - pontos[0].valor) / (pontos[0].valor || 1) * 100).toFixed(0)
      : 0;
    return { nome, pontos, melhorCarga, progressao: Number(progressao), sessoes: pontos.length };
  }).sort((a, b) => b.sessoes - a.sessoes);

  // Volume semanal (últimas 8 semanas)
  const semanas = {};
  Object.entries(porData).forEach(([data, vol]) => {
    const d = new Date(data + 'T00:00:00');
    const seg = new Date(d);
    seg.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // início da semana (seg)
    const chave = seg.toISOString().slice(0, 10);
    if (!semanas[chave]) semanas[chave] = { vol: 0, treinos: 0 };
    semanas[chave].vol += vol;
    semanas[chave].treinos += 1;
  });
  const volumeSemanal = Object.entries(semanas)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([data, v]) => ({
      label: fmtDataCurta(data),
      valor: Math.round(v.vol),
      treinos: v.treinos,
    }));

  // Freq. semanal (dias únicos por semana)
  const freqSemanal = Object.entries(semanas)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([data, v]) => ({ label: fmtDataCurta(data), valor: v.treinos }));

  return { exerciciosProcessados, volumeSemanal, freqSemanal };
}

// ─── TelaGraficos ────────────────────────────────────────────────────────────
function TelaGraficos({ usuario, splitInicial, onVoltar, mostrarToast }) {
  const [series, setSeries]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [splitFiltro, setSplit] = useState(splitInicial || 'todos');
  const [exSelecionado, setEx]  = useState(null);
  const [aba, setAba]           = useState('evolucao'); // 'evolucao' | 'volume' | 'frequencia'

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`${R.historico}?id_usuario=${usuario.id}&todos=1`);
      setSeries(r.series || []);
    } catch {
      mostrarToast('Erro ao carregar dados.', 'erro');
    } finally {
      setLoading(false);
    }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  // splits únicos
  const splits = useMemo(() => {
    const nomes = Array.from(new Set(series.map(s => s.nome_split).filter(Boolean)));
    return ['todos', ...nomes];
  }, [series]);

  const seriesFiltradas = useMemo(() =>
    splitFiltro === 'todos' ? series : series.filter(s => s.nome_split === splitFiltro),
  [series, splitFiltro]);

  const { exerciciosProcessados, volumeSemanal, freqSemanal } = useMemo(
    () => processarSeries(seriesFiltradas),
    [seriesFiltradas]
  );

  useEffect(() => {
    if (exerciciosProcessados.length > 0 && !exSelecionado) {
      setEx(exerciciosProcessados[0].nome);
    }
  }, [exerciciosProcessados]);

  const exAtual = exerciciosProcessados.find(e => e.nome === exSelecionado);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVoltar}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Gráficos</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Evolução de carga e volume</p>
          </div>
        </div>

        {/* filtro split */}
        {splits.length > 2 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {splits.map(s => (
              <button key={s} onClick={() => { setSplit(s); setEx(null); }}
                className={`btn flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={2} className="w-7 h-7">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p className="text-zinc-400 font-semibold">Sem dados ainda</p>
          <p className="text-zinc-600 text-sm">Finalize alguns treinos para ver seus gráficos de evolução.</p>
        </div>
      ) : (
        <div className="px-5 pt-5 pb-10 flex flex-col gap-6">

          {/* tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 gap-1">
            {[['evolucao','Evolução'], ['volume','Volume'], ['frequencia','Frequência']].map(([v, l]) => (
              <button key={v} onClick={() => setAba(v)}
                className={`btn flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  aba === v ? 'bg-[#c8f542] text-black' : 'text-zinc-500'
                }`}>
                {l}
              </button>
            ))}
          </div>

          {/* ── ABA EVOLUÇÃO ── */}
          {aba === 'evolucao' && (
            <>
              {/* seletor de exercício */}
              <div className="flex flex-col gap-3">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Exercício</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {exerciciosProcessados.map(ex => (
                    <button key={ex.nome} onClick={() => setEx(ex.nome)}
                      className={`btn flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all max-w-[140px] truncate ${
                        exSelecionado === ex.nome
                          ? 'bg-[#c8f542] text-black'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                      }`}>
                      {ex.nome}
                    </button>
                  ))}
                </div>
              </div>

              {exAtual && (
                <>
                  {/* cards de métricas */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                      <div className="text-[#c8f542] font-black text-lg">{exAtual.melhorCarga}kg</div>
                      <div className="text-zinc-600 text-xs mt-0.5">Melhor carga</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                      <div className={`font-black text-lg ${exAtual.progressao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {exAtual.progressao >= 0 ? '+' : ''}{exAtual.progressao}%
                      </div>
                      <div className="text-zinc-600 text-xs mt-0.5">Progressão</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                      <div className="text-white font-black text-lg">{exAtual.sessoes}</div>
                      <div className="text-zinc-600 text-xs mt-0.5">Sessões</div>
                    </div>
                  </div>

                  {/* gráfico de carga */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-bold text-sm">{exAtual.nome}</p>
                        <p className="text-zinc-600 text-xs">Evolução de carga</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-[#c8f542]/10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-4 h-4">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                      </div>
                    </div>
                    <LineChart dados={exAtual.pontos} cor="#c8f542" label="kg" height={150}/>
                  </div>
                </>
              )}

              {/* lista de todos os exercícios */}
              <div className="flex flex-col gap-2">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Todos os exercícios</p>
                {exerciciosProcessados.map(ex => (
                  <button key={ex.nome} onClick={() => setEx(ex.nome)}
                    className={`btn w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                      exSelecionado === ex.nome
                        ? 'bg-[#c8f542]/8 border border-[#c8f542]/30'
                        : 'bg-zinc-900 border border-zinc-800 active:bg-zinc-800'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{ex.nome}</div>
                      <div className="text-zinc-600 text-xs mt-0.5">{ex.sessoes} sessão{ex.sessoes !== 1 ? 'ões' : ''}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white font-bold text-sm">{ex.melhorCarga}kg</div>
                      <div className={`text-xs font-semibold ${ex.progressao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ex.progressao >= 0 ? '▲' : '▼'} {Math.abs(ex.progressao)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── ABA VOLUME ── */}
          {aba === 'volume' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-sm">Volume semanal</p>
                    <p className="text-zinc-600 text-xs">kg total por semana (carga × reps)</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2.5} className="w-4 h-4">
                      <rect x="3" y="3" width="4" height="18" rx="1"/>
                      <rect x="10" y="8" width="4" height="13" rx="1"/>
                      <rect x="17" y="5" width="4" height="16" rx="1"/>
                    </svg>
                  </div>
                </div>
                <BarChart dados={volumeSemanal} cor="#3b82f6" height={130}/>
              </div>

              {/* resumo */}
              {volumeSemanal.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <div className="text-blue-400 font-black text-xl">
                      {Math.round(volumeSemanal.reduce((a, v) => a + v.valor, 0) / volumeSemanal.length).toLocaleString()}
                    </div>
                    <div className="text-zinc-600 text-xs mt-0.5">kg/semana (média)</div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <div className="text-white font-black text-xl">
                      {Math.max(...volumeSemanal.map(v => v.valor)).toLocaleString()}
                    </div>
                    <div className="text-zinc-600 text-xs mt-0.5">kg/semana (recorde)</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── ABA FREQUÊNCIA ── */}
          {aba === 'frequencia' && (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-sm">Frequência semanal</p>
                    <p className="text-zinc-600 text-xs">Dias treinados por semana</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <BarChart dados={freqSemanal} cor="#10b981" height={120}/>
              </div>

              {freqSemanal.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 'Média/sem.', v: (freqSemanal.reduce((a, v) => a + v.valor, 0) / freqSemanal.length).toFixed(1) },
                    { l: 'Melhor sem.', v: Math.max(...freqSemanal.map(v => v.valor)) },
                    { l: 'Total dias',  v: freqSemanal.reduce((a, v) => a + v.valor, 0) },
                  ].map(x => (
                    <div key={x.l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                      <div className="text-emerald-400 font-black text-lg">{x.v}</div>
                      <div className="text-zinc-600 text-xs mt-0.5">{x.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* heat‑map de dias da semana */}
              <HeatmapDias series={seriesFiltradas}/>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Heatmap de dias da semana ────────────────────────────────────────────────
function HeatmapDias({ series }) {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const contagem = [0, 0, 0, 0, 0, 0, 0];
  const datas = new Set(series.map(s => s.data_treino));
  datas.forEach(data => {
    const d = new Date(data + 'T00:00:00');
    contagem[d.getDay()]++;
  });
  const max = Math.max(...contagem, 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-white font-bold text-sm mb-1">Dias preferidos</p>
      <p className="text-zinc-600 text-xs mb-4">Qual dia você mais treina</p>
      <div className="flex gap-2">
        {dias.map((d, i) => {
          const ratio = contagem[i] / max;
          const opacity = ratio === 0 ? 0.08 : 0.15 + ratio * 0.85;
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold"
                style={{ background: `rgba(16,185,129,${opacity})`, color: ratio > 0.5 ? '#10b981' : '#52525b' }}>
                {contagem[i]}
              </div>
              <span className="text-zinc-600 text-xs">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TelaGraficos;