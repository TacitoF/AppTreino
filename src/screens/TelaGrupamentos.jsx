import React, { useState, useEffect, useRef } from 'react';
import { IconDumbbell, IconChevronRight } from '../components/icons';
import { apiFetch } from '../auth';
import { R } from '../config';
import { Spinner } from '../components/ui';

/* ─────────────────────────────────────────────────────────────────────────────
   ÍCONES — todos 20×20 via w-5 h-5, stroke uniforme 2px
───────────────────────────────────────────────────────────────────────────── */
const Icon = {
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="15" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78"  x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Diet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  Cardio: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  Report: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  Progress: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Chevron: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Fire: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 3-1.5.5 1.5.5 3-.5 4.5A7.5 7.5 0 0112 23z"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────────────────────
   BOTTOM SHEET
───────────────────────────────────────────────────────────────────────────── */
function BottomSheet({ open, onClose, children }) {
  const sheetRef = useRef(null);
  const startY   = useRef(null);
  const currentY = useRef(0);

  // fecha ao arrastar pra baixo
  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      currentY.current = dy;
      if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };
  const onTouchEnd = () => {
    if (currentY.current > 100) { onClose(); }
    else if (sheetRef.current)  { sheetRef.current.style.transform = ''; }
    currentY.current = 0;
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background:    open ? 'rgba(0,0,0,0.65)' : 'transparent',
          backdropFilter: open ? 'blur(3px)' : 'none',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* painel */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-3xl border-t border-zinc-800 flex flex-col"
        style={{
          maxHeight: '90dvh',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* alça */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700"/>
        </div>
        {children}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ITEM DO MENU
───────────────────────────────────────────────────────────────────────────── */
function MenuItem({ icon, label, sub, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full px-5 py-4 active:bg-white/5 rounded-2xl transition-colors text-left"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* ícone num quadrado fixo 44×44 */}
      <div
        className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>

      {/* texto */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-[15px] leading-tight">{label}</p>
        {sub && <p className="text-zinc-500 text-[13px] mt-0.5 truncate">{sub}</p>}
      </div>

      <span className="text-zinc-700 flex-shrink-0"><Icon.Chevron/></span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TELA PRINCIPAL
───────────────────────────────────────────────────────────────────────────── */
export default function TelaGrupamentos({
  usuario, splits, loadingSplits,
  onSelecionarSplit, onGerenciar, onRank, onCardio, onDieta,
  onHistorico, onRelatorio, onLogout, onPerfil, onPeso, onProgressao,
  tema, onToggleTema,
}) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const [streak,     setStreak]     = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);

  useEffect(() => {
    if (!usuario?.id) return;
    apiFetch(`${R.relatorio}?id_usuario=${usuario.id}`)
      .then(r => setStreak({
        dias:        r.streak_dias,
        semanas:     r.streak_semanas,
        totalTreinos: r.total_treinos_historico,
      }))
      .catch(() => {});
  }, [usuario?.id]);

  // fecha menu e navega depois da animação sair
  const nav = (fn) => { setMenuOpen(false); setTimeout(fn, 280); };

  const MENU_ITEMS = [
    { icon: <Icon.Diet/>,     label: 'Dieta & Macros',          sub: 'Calorias e nutrientes',   accent: '#60a5fa', fn: onDieta      },
    { icon: <Icon.Cardio/>,   label: 'Cardio & Calorias',       sub: 'Atividades aeróbicas',    accent: '#fb923c', fn: onCardio     },
    { icon: <Icon.History/>,  label: 'Histórico & Gráficos',    sub: 'Seus treinos passados',   accent: '#a78bfa', fn: onHistorico  },
    { icon: <Icon.Trophy/>,   label: 'Ranking',                 sub: 'Compare com amigos',      accent: '#c8f542', fn: onRank       },
    { icon: <Icon.Report/>,   label: 'Relatório Semanal',       sub: 'Sua semana em números',   accent: '#fbbf24', fn: onRelatorio  },
    { icon: <Icon.Scale/>,    label: 'Peso Corporal',           sub: 'Acompanhe a evolução',    accent: '#38bdf8', fn: onPeso       },
    { icon: <Icon.Progress/>, label: 'Progressão & Templates',  sub: 'Sugestões de carga',      accent: '#34d399', fn: onProgressao },
    { icon: <Icon.Settings/>, label: 'Gerenciar grupos',        sub: 'Editar splits',           accent: '#94a3b8', fn: onGerenciar  },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[#c8f542] text-xs font-bold uppercase tracking-widest">
              {dias[new Date().getDay()]} · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
            <h1 className="text-[28px] font-black text-white leading-tight mt-1">
              Bora treinar,{' '}
              <span className="text-[#c8f542]">{usuario.nome.split(' ')[0]}</span>!
            </h1>
          </div>

          {/* botão de menu — canto superior direito, 48×48 para toque fácil */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300 active:bg-zinc-800 flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon.Menu/>
          </button>
        </div>

        {/* ── Streak banner ── */}
        {streak && (streak.dias > 0 || streak.semanas > 0) && (
          <button
            onClick={onRelatorio}
            className="w-full bg-[#c8f542]/8 border border-[#c8f542]/20 active:bg-[#c8f542]/12 rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="w-9 h-9 rounded-xl bg-[#c8f542]/15 flex items-center justify-center text-[#c8f542] flex-shrink-0">
              <Icon.Fire/>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[#c8f542] font-bold text-sm leading-tight">
                {streak.semanas > 1
                  ? `${streak.semanas} semanas seguidas 🔥`
                  : streak.dias > 0
                  ? `${streak.dias} dia${streak.dias > 1 ? 's' : ''} de streak 🔥`
                  : 'Treino registrado!'}
              </p>
              <p className="text-zinc-600 text-xs mt-0.5 truncate">
                {streak.totalTreinos} treino{streak.totalTreinos !== 1 ? 's' : ''} no histórico · ver relatório
              </p>
            </div>
            <Icon.Chevron/>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════
          SPLITS
      ══════════════════════════════════════ */}
      <div className="px-5 flex flex-col gap-3 pb-32 flex-1">
        {loadingSplits ? (
          <Spinner/>
        ) : splits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
              <IconDumbbell/>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">Nenhum grupo ainda</p>
              <p className="text-zinc-500 text-sm mt-1">Configure seus grupos musculares</p>
            </div>
            <button
              onClick={onGerenciar}
              className="px-8 py-4 bg-[#c8f542] text-black font-bold rounded-2xl text-base"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Configurar grupos
            </button>
          </div>
        ) : (
          splits.map(split => (
            <button
              key={split.id}
              onClick={() => onSelecionarSplit(split)}
              className="w-full bg-zinc-900 border border-zinc-800 active:border-zinc-600 active:bg-zinc-800 rounded-2xl p-5 text-left flex items-center gap-4"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                <IconDumbbell/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-[17px] truncate">{split.nome}</p>
                <p className="text-zinc-500 text-sm mt-0.5">
                  {split.ultimo_treino ? `Último: ${split.ultimo_treino}` : 'Nenhum treino registrado'}
                </p>
              </div>
              <span className="text-zinc-600 flex-shrink-0"><Icon.Chevron/></span>
            </button>
          ))
        )}
      </div>

      {/* ══════════════════════════════════════
          BOTTOM SHEET (menu)
      ══════════════════════════════════════ */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)}>

        {/* cabeçalho do sheet */}
        <div className="px-5 pt-2 pb-4 flex items-center justify-between flex-shrink-0 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center text-[#c8f542]">
              <Icon.User/>
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-tight">{usuario.nome.split(' ')[0]}</p>
              <p className="text-zinc-500 text-xs">{usuario.email || 'Voltapp'}</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:bg-zinc-700"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon.Close/>
          </button>
        </div>

        {/* lista scrollável */}
        <div className="overflow-y-auto flex-1 px-2 py-3" style={{ overscrollBehavior: 'contain' }}>
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              sub={item.sub}
              accent={item.accent}
              onClick={() => nav(item.fn)}
            />
          ))}
        </div>

        {/* rodapé fixo — tema + perfil + sair */}
        <div className="flex-shrink-0 border-t border-zinc-800/60 px-4 pt-3 pb-8 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onToggleTema}
              className="flex-1 h-12 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl flex items-center justify-center gap-2 text-zinc-300 active:bg-zinc-700 text-sm font-semibold"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tema === 'claro' ? <Icon.Moon/> : <Icon.Sun/>}
              {tema === 'claro' ? 'Escuro' : 'Claro'}
            </button>
            <button
              onClick={() => nav(onPerfil)}
              className="flex-1 h-12 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl flex items-center justify-center gap-2 text-zinc-300 active:bg-zinc-700 text-sm font-semibold"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Icon.User/>
              Perfil
            </button>
          </div>
          <button
            onClick={() => { setMenuOpen(false); onLogout(); }}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-semibold text-sm active:bg-red-500/10 border border-red-500/15"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon.Logout/>
            Sair da conta
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}