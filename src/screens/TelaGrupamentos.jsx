import React, { useState, useEffect, useRef } from 'react';
import { IconDumbbell, IconSettings, IconCardio, IconTrophy, IconChevronRight } from '../components/icons';
import { apiFetch } from '../auth';
import { R } from '../config';
import { Spinner } from '../components/ui';

// ─── Ícones internos ────────────────────────────────────────────────────────

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"  x2="5.64"  y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64"  y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
);

// ─── Itens da barra lateral ──────────────────────────────────────────────────

function SidebarItem({ icon, label, sublabel, color, bg, border, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`btn w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl ${bg} ${border} active:opacity-70 transition-opacity text-left`}
    >
      <div className={`w-9 h-9 rounded-xl ${bg.replace('10','20').replace('8','15')} flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${color}`}>{label}</div>
        {sublabel && <div className="text-zinc-600 text-xs mt-0.5 truncate">{sublabel}</div>}
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 flex-shrink-0 ${color} opacity-40`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

function TelaGrupamentos({
  usuario, splits, loadingSplits,
  onSelecionarSplit, onGerenciar, onRank, onCardio, onDieta,
  onHistorico, onRelatorio, onLogout, onPerfil, onPeso, onProgressao,
  tema, onToggleTema,
}) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const [streak, setStreak]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!usuario?.id) return;
    apiFetch(`${R.relatorio}?id_usuario=${usuario.id}`)
      .then(r => setStreak({ dias: r.streak_dias, semanas: r.streak_semanas, totalTreinos: r.total_treinos_historico }))
      .catch(() => {});
  }, [usuario?.id]);

  // Fechar sidebar ao clicar fora
  const handleBackdrop = (e) => {
    if (e.target === backdropRef.current) setSidebarOpen(false);
  };

  // Bloquear scroll do body quando sidebar aberta
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const nav = (fn) => { setSidebarOpen(false); setTimeout(fn, 200); };

  const navItems = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>,
      label: 'Dieta & Macros', sublabel: 'Calorias e nutrientes', color: 'text-blue-400',
      bg: 'bg-blue-500/10', border: 'border border-blue-500/20', action: onDieta,
    },
    {
      icon: <IconCardio/>,
      label: 'Cardio & Calorias', sublabel: 'Atividades aeróbicas', color: 'text-orange-400',
      bg: 'bg-orange-500/10', border: 'border border-orange-500/20', action: onCardio,
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
      label: 'Histórico & Gráficos', sublabel: 'Seus treinos passados', color: 'text-violet-400',
      bg: 'bg-violet-500/10', border: 'border border-violet-500/20', action: onHistorico,
    },
    {
      icon: <IconTrophy/>,
      label: 'Ranking', sublabel: 'Compare com amigos', color: 'text-[#c8f542]',
      bg: 'bg-[#c8f542]/8', border: 'border border-[#c8f542]/20', action: onRank,
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
      label: 'Relatório Semanal', sublabel: 'Sua semana em números', color: 'text-amber-400',
      bg: 'bg-amber-500/8', border: 'border border-amber-500/20', action: onRelatorio,
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3v2a9 9 0 01-18 0V6zM12 3v6"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 13v4M9 17h6"/></svg>,
      label: 'Peso Corporal', sublabel: 'Acompanhe a evolução', color: 'text-sky-400',
      bg: 'bg-sky-500/8', border: 'border border-sky-500/20', action: onPeso,
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
      label: 'Progressão & Templates', sublabel: 'Sugestões de carga', color: 'text-emerald-400',
      bg: 'bg-emerald-500/8', border: 'border border-emerald-500/20', action: onProgressao,
    },
    {
      icon: <IconSettings/>,
      label: 'Gerenciar grupos', sublabel: 'Editar splits', color: 'text-zinc-400',
      bg: 'bg-zinc-900', border: 'border border-zinc-800', action: onGerenciar,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#c8f542] text-xs font-semibold uppercase tracking-widest">
            {dias[new Date().getDay()]} · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
          <div className="flex items-center gap-2">
            {/* Botão hambúrguer */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800"
              aria-label="Abrir menu"
            >
              <IconMenu/>
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-black text-white leading-snug">
          Qual treino de hoje,{' '}
          <span className="text-[#c8f542]">{usuario.nome.split(' ')[0]}</span>?
        </h1>
      </div>

      {/* ── Streak banner ───────────────────────────────────────────────────── */}
      {streak && (streak.dias > 0 || streak.semanas > 0) && (
        <div className="mx-5 mb-2">
          <button
            onClick={onRelatorio}
            className="btn w-full bg-[#c8f542]/5 border border-[#c8f542]/20 active:bg-[#c8f542]/10 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#c8f542]/15 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#c8f542]">
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3c.6 0 1 .4 1 1v5.6l3.2 1.9c.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4l-3.7-2.2A1 1 0 0111 12V6c0-.6.4-1 1-1z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-[#c8f542] font-bold text-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline-block mr-1 align-text-bottom">
                  <path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 3-1.5.5 1.5.5 3-.5 4.5A7.5 7.5 0 0112 23z"/>
                </svg>
                {streak.semanas > 1
                  ? `${streak.semanas} semanas seguidas`
                  : streak.dias > 0
                  ? `${streak.dias} dia${streak.dias > 1 ? 's' : ''} de streak`
                  : 'Treino registrado'}
              </div>
              <div className="text-zinc-600 text-xs mt-0.5">
                {streak.totalTreinos} treino{streak.totalTreinos !== 1 ? 's' : ''} no histórico · toque para relatório
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Lista de splits ─────────────────────────────────────────────────── */}
      <div className="px-5 flex flex-col gap-3 pb-10 flex-1">
        {loadingSplits ? <Spinner/> : (
          <>
            {splits.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-sm mb-4">Nenhum grupo muscular configurado.</p>
                <button onClick={onGerenciar} className="btn px-6 py-4 bg-[#c8f542] text-black font-bold rounded-2xl">
                  Configurar grupos
                </button>
              </div>
            )}

            {splits.map(split => (
              <button
                key={split.id}
                onClick={() => onSelecionarSplit(split)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:border-zinc-600 active:bg-zinc-800 rounded-2xl p-5 text-left flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                  <IconDumbbell/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg truncate">{split.nome}</div>
                  <div className="text-zinc-500 text-sm mt-0.5">
                    {split.ultimo_treino ? `Último: ${split.ultimo_treino}` : 'Nenhum treino registrado'}
                  </div>
                </div>
                <div className="text-zinc-600"><IconChevronRight/></div>
              </button>
            ))}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDEBAR DRAWER
      ════════════════════════════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleBackdrop}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: sidebarOpen ? 'rgba(0,0,0,0.7)' : 'transparent',
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          backdropFilter: sidebarOpen ? 'blur(2px)' : 'none',
        }}
      />

      {/* Painel lateral */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-[#0d0d0d] border-l border-zinc-800/80 shadow-2xl"
        style={{
          width: 'min(320px, 88vw)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header do sidebar */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c8f542]/15 flex items-center justify-center text-[#c8f542]">
              <IconUser/>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{usuario.nome.split(' ')[0]}</p>
              <p className="text-zinc-600 text-xs">{usuario.email || 'Voltapp'}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 active:bg-zinc-700"
          >
            <IconClose/>
          </button>
        </div>

        {/* Itens de navegação (scrollável) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
          {/* Seção: Ferramentas */}
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest px-1 mb-1">Ferramentas</p>

          {navItems.map((item, i) => (
            <SidebarItem
              key={i}
              icon={item.icon}
              label={item.label}
              sublabel={item.sublabel}
              color={item.color}
              bg={item.bg}
              border={item.border}
              onClick={() => nav(item.action)}
            />
          ))}
        </div>

        {/* Footer do sidebar */}
        <div className="px-4 pb-10 pt-3 border-t border-zinc-800/60 flex flex-col gap-2">
          {/* Toggle tema + Perfil */}
          <div className="flex gap-2">
            <button
              onClick={onToggleTema}
              className="btn flex-1 h-11 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 active:bg-zinc-800 text-sm font-medium"
            >
              {tema === 'claro' ? <IconMoon/> : <IconSun/>}
              <span className="text-xs">{tema === 'claro' ? 'Escuro' : 'Claro'}</span>
            </button>
            <button
              onClick={() => nav(onPerfil)}
              className="btn flex-1 h-11 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 active:bg-zinc-800"
            >
              <IconUser/>
              <span className="text-xs font-medium">Perfil</span>
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={() => { setSidebarOpen(false); onLogout(); }}
            className="btn w-full h-11 bg-red-500/8 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 text-red-400 active:bg-red-500/15 text-sm font-semibold"
          >
            <IconLogout/>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

export default TelaGrupamentos;