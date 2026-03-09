import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

const IconArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7M12 3v18"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);
const IconTemplate = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
  </svg>
);

const TEMPLATES = [
  {
    id: 'ppl',
    nome: 'Push / Pull / Legs',
    nivel: 'Intermediário',
    descricao: 'Clássico para hipertrofia. 3 dias mínimo, ideal 6 dias.',
    splits: ['Push (Peito · Ombro · Tríceps)', 'Pull (Costas · Bíceps)', 'Legs (Quadríceps · Posterior · Glúteo)'],
  },
  {
    id: 'abc',
    nome: 'ABC',
    nivel: 'Iniciante / Intermediário',
    descricao: 'Cada dia foca em um grupo. 3 a 6 dias por semana.',
    splits: ['A — Peito · Tríceps · Ombro', 'B — Costas · Bíceps', 'C — Pernas · Abdômen'],
  },
  {
    id: 'fullbody',
    nome: 'Full Body',
    nivel: 'Iniciante',
    descricao: 'Treina o corpo todo em cada sessão. 2–3 dias por semana.',
    splits: ['Full Body A', 'Full Body B'],
  },
  {
    id: 'upper_lower',
    nome: 'Upper / Lower',
    nivel: 'Intermediário',
    descricao: 'Divide entre superior e inferior. 4 dias por semana.',
    splits: ['Upper A (Peito · Costas · Ombro · Braços)', 'Lower A (Pernas · Glúteo)', 'Upper B', 'Lower B'],
  },
  {
    id: 'abcde',
    nome: 'ABCDE',
    nivel: 'Avançado',
    descricao: '5 dias de treino. Cada grupo muscular isolado.',
    splits: ['A — Peito', 'B — Costas', 'C — Ombro · Abdômen', 'D — Bíceps · Tríceps', 'E — Pernas'],
  },
];

export default function TelaProgressao({ usuario, splits, onUsarTemplate, onVoltar, mostrarToast }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [aba, setAba]             = useState('progressao');
  const [templateSel, setTemplateSel] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`${R.progressao}?id_usuario=${usuario.id}`);
      setSugestoes(r.sugestoes || []);
    } catch { mostrarToast('Erro ao carregar sugestões.', 'erro'); }
    finally { setLoading(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { if (aba === 'progressao') carregar(); }, [aba, carregar]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Progressão</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Sugestões e templates de treino</p>
        </div>
      </div>

      {/* Abas */}
      <div className="px-5 pt-4">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 gap-1">
          {[['progressao','Progressão automática'],['templates','Templates']].map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)}
              className={`btn flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${aba === id ? 'bg-[#c8f542] text-black' : 'text-zinc-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {aba === 'progressao' && (
        <div className="px-5 pt-5 pb-24 flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#c8f542]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2} className="w-4 h-4">
                <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Analisamos suas últimas 3 sessões por exercício. Quando você mantém a mesma carga por 3 vezes seguidas, sugerimos aumentar.
            </p>
          </div>

          {loading ? <Spinner/> : sugestoes.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138"/>
                </svg>
              </div>
              <p className="text-zinc-500 text-sm text-center">
                Nenhuma sugestão por enquanto.<br/>
                Continue treinando — analisamos após 3 sessões por exercício.
              </p>
            </div>
          ) : (
            <>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">{sugestoes.length} sugestão{sugestoes.length !== 1 ? 'ões' : ''}</p>
              {sugestoes.map((s, i) => (
                <div key={i} className="bg-zinc-900 border border-[#c8f542]/20 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-bold text-base">{s.exercicio}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{s.sessoes_analisadas} sessões analisadas</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#c8f542]/10 flex items-center justify-center flex-shrink-0 text-[#c8f542]">
                      <IconArrowUp/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                      <div className="text-zinc-400 text-lg font-bold">{s.carga_atual} kg</div>
                      <div className="text-zinc-600 text-xs mt-0.5">atual</div>
                    </div>
                    <div className="bg-[#c8f542]/8 border border-[#c8f542]/20 rounded-xl p-3 text-center">
                      <div className="text-[#c8f542] text-lg font-black">
                        {s.sugestao === 'carga' ? `${s.nova_carga} kg` : `+1 rep`}
                      </div>
                      <div className="text-[#c8f542]/60 text-xs mt-0.5">sugerido</div>
                    </div>
                  </div>
                  <p className="text-zinc-600 text-xs mt-3">
                    {s.sugestao === 'carga'
                      ? `Você usou ${s.carga_atual}kg por 3 sessões seguidas. Hora de progredir +2,5kg.`
                      : `Sua carga está estável. Tente aumentar as repetições na próxima sessão.`
                    }
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {aba === 'templates' && (
        <div className="px-5 pt-5 pb-24 flex flex-col gap-4">
          {splits.length > 0 && (
            <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl px-4 py-3">
              <p className="text-amber-400 text-sm font-semibold">Você já tem grupos configurados</p>
              <p className="text-zinc-500 text-xs mt-1">Usar um template vai sobrescrever seus grupos atuais em "Gerenciar grupos".</p>
            </div>
          )}

          {templateSel && (
            <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setTemplateSel(null)}>
              <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-5 pt-5 pb-10" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
                <h3 className="text-white font-black text-lg mb-1">{templateSel.nome}</h3>
                <p className="text-zinc-500 text-sm mb-5">{templateSel.descricao}</p>
                <div className="flex flex-col gap-2 mb-6">
                  {templateSel.splits.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3">
                      <div className="w-6 h-6 rounded-full bg-[#c8f542]/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#c8f542] text-xs font-black">{i + 1}</span>
                      </div>
                      <span className="text-zinc-300 text-sm font-medium">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setTemplateSel(null)} className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-semibold rounded-2xl">Cancelar</button>
                  <button onClick={() => { onUsarTemplate(templateSel); setTemplateSel(null); }}
                    className="btn flex-1 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold rounded-2xl">Usar este template</button>
                </div>
              </div>
            </div>
          )}

          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTemplateSel(t)}
              className="btn w-full bg-zinc-900 border border-zinc-800 active:border-zinc-600 rounded-2xl p-5 text-left">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-white font-bold text-base">{t.nome}</p>
                  <span className="text-zinc-500 text-xs">{t.nivel}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                  <IconTemplate/>
                </div>
              </div>
              <p className="text-zinc-500 text-sm mb-3">{t.descricao}</p>
              <div className="flex flex-wrap gap-2">
                {t.splits.map((s, i) => (
                  <span key={i} className="text-zinc-400 text-xs bg-zinc-800 px-2.5 py-1 rounded-lg font-medium">{s.split(' —')[0].split(' (')[0]}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}