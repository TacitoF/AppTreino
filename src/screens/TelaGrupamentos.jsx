import React, { useState, useEffect, useRef } from 'react';
import { IconDumbbell, IconChevronRight } from '../components/icons';
import { apiFetch } from '../auth';
import { R } from '../config';
import { Spinner } from '../components/ui';

/* ─────────────────────────────────────────────────────────────────────────────
   ÍCONES
   Todos encapsulados no mesmo wrapper fixo w-5 h-5 (20×20 px).
   O SVG interno usa w-full h-full — tamanho visual 100% idêntico.
───────────────────────────────────────────────────────────────────────────── */
const Ic = ({ children }) => (
  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {children}
    </svg>
  </span>
);

const IcMenu     = () => <Ic><path d="M4 6h16M4 12h10M4 18h16"/></Ic>;
const IcClose    = () => <Ic><path d="M6 18L18 6M6 6l12 12"/></Ic>;
const IcUser     = () => <Ic><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></Ic>;
const IcMoon     = () => <Ic><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></Ic>;
const IcSun      = () => <Ic><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"/></Ic>;
const IcLogout   = () => <Ic><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></Ic>;
const IcDiet     = () => <Ic><path d="M9 5H7a2 2 0 00-2 2v3a6 6 0 006 6 6 6 0 006-6V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M12 14v4M9 18h6"/></Ic>;
const IcCardio   = () => <Ic><path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"/></Ic>;
const IcHistory  = () => <Ic><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></Ic>;
const IcTrophy   = () => <Ic><path d="M8 21h8m-4-4v4M5 3H3a2 2 0 000 4c0 2.21 1.343 4.124 3.273 5.12M19 3h2a2 2 0 010 4c0 2.21-1.343 4.124-3.273 5.12M12 17c-3.866 0-7-3.134-7-7V3h14v7c0 3.866-3.134 7-7 7z"/></Ic>;
const IcReport   = () => <Ic><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></Ic>;
const IcScale    = () => <Ic><path d="M3 10h18M3 10a9 9 0 009 9m-9-9a9 9 0 0118 0M12 19v-9"/><path d="M8 14l4-4 4 4"/></Ic>;
const IcProgress = () => <Ic><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></Ic>;
const IcGear     = () => <Ic><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></Ic>;
const IcArrow    = () => <Ic><path d="M9 5l7 7-7 7"/></Ic>;
const IcFire     = () => (
  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 3-1.5.5 1.5.5 3-.5 4.5A7.5 7.5 0 0112 23z"/>
    </svg>
  </span>
);

/* ─────────────────────────────────────────────────────────────────────────────
   ITEM DO BOTTOM SHEET
───────────────────────────────────────────────────────────────────────────── */
function NavItem({ icon, label, sublabel, iconColor, iconBg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn w-full flex items-center gap-4 px-4 rounded-2xl active:bg-zinc-800/70 text-left"
      style={{ minHeight: '68px' }}
    >
      {/* container 44×44 — área mínima de toque recomendada para mobile */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-[15px] leading-tight ${iconColor}`}>{label}</p>
        {sublabel && <p className="text-zinc-500 text-[13px] mt-0.5">{sublabel}</p>}
      </div>
      <span className="text-zinc-700 flex-shrink-0"><IcArrow /></span>
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
  const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const [streak, setStreak]       = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragY, setDragY]         = useState(0);
  const dragStart = useRef(null);

  useEffect(() => {
    if (!usuario?.id) return;
    apiFetch(`${R.relatorio}?id_usuario=${usuario.id}`)
      .then(r => setStreak({
        dias: r.streak_dias,
        semanas: r.streak_semanas,
        totalTreinos: r.total_treinos_historico,
      }))
      .catch(() => {});
  }, [usuario?.id]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const closeSheet = () => { setSheetOpen(false); setDragY(0); };
  const nav = (fn) => { closeSheet(); setTimeout(fn, 260); };

  const onTouchStart = (e) => { dragStart.current = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    const delta = e.touches[0].clientY - (dragStart.current ?? e.touches[0].clientY);
    if (delta > 0) setDragY(delta);
  };
  const onTouchEnd = () => {
    if (dragY > 90) closeSheet(); else setDragY(0);
    dragStart.current = null;
  };

  const NAV = [
    { icon: <IcDiet/>,     label: 'Dieta & Macros',         sublabel: 'Calorias e nutrientes', iconColor: 'text-blue-400',    iconBg: 'bg-blue-500/15',    action: onDieta },
    { icon: <IcCardio/>,   label: 'Cardio & Calorias',      sublabel: 'Atividades aeróbicas',  iconColor: 'text-orange-400',  iconBg: 'bg-orange-500/15',  action: onCardio },
    { icon: <IcHistory/>,  label: 'Histórico & Gráficos',   sublabel: 'Seus treinos passados', iconColor: 'text-violet-400',  iconBg: 'bg-violet-500/15',  action: onHistorico },
    { icon: <IcTrophy/>,   label: 'Ranking',                sublabel: 'Compare com amigos',    iconColor: 'text-[#c8f542]',   iconBg: 'bg-[#c8f542]/10',   action: onRank },
    { icon: <IcReport/>,   label: 'Relatório Semanal',      sublabel: 'Sua semana em números', iconColor: 'text-amber-400',   iconBg: 'bg-amber-500/15',   action: onRelatorio },
    { icon: <IcScale/>,    label: 'Peso Corporal',          sublabel: 'Acompanhe a evolução',  iconColor: 'text-sky-400',     iconBg: 'bg-sky-500/15',     action: onPeso },
    { icon: <IcProgress/>, label: 'Progressão & Templates', sublabel: 'Sugestões de carga',    iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15', action: onProgressao },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setSheetOpen(true)}
            className="btn w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300 active:bg-zinc-800 flex-shrink-0"
            aria-label="Abrir menu"
          >
            <IcMenu />
          </button>
          <span className="text-[#c8f542] text-xs font-semibold uppercase tracking-widest">
            {DIAS[new Date().getDay()]} · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>
        <h1 className="text-3xl font-black text-white leading-snug">
          Qual treino de hoje,{' '}
          <span className="text-[#c8f542]">{usuario.nome.split(' ')[0]}</span>?
        </h1>
      </div>

      {/* ── STREAK ──────────────────────────────────────────────────────────── */}
      {streak && (streak.dias > 0 || streak.semanas > 0) && (
        <div className="px-5 mb-3">
          <button
            onClick={onRelatorio}
            className="btn w-full bg-[#c8f542]/5 border border-[#c8f542]/20 active:bg-[#c8f542]/10 rounded-2xl px-4 py-3.5 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#c8f542]/15 flex items-center justify-center flex-shrink-0 text-[#c8f542]">
              <IcFire />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#c8f542] font-bold text-sm">
                {streak.semanas > 1 ? `${streak.semanas} semanas seguidas`
                  : streak.dias > 0 ? `${streak.dias} dia${streak.dias > 1 ? 's' : ''} de streak`
                  : 'Treino registrado'}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {streak.totalTreinos} treino{streak.totalTreinos !== 1 ? 's' : ''} no histórico · ver relatório
              </p>
            </div>
            <span className="text-zinc-600"><IcArrow /></span>
          </button>
        </div>
      )}

      {/* ── SPLITS ──────────────────────────────────────────────────────────── */}
      <div className="px-5 flex flex-col gap-3 pb-10 flex-1">
        {loadingSplits ? <Spinner /> : (
          <>
            {splits.length === 0 && (
              <div className="text-center py-16 flex flex-col items-center gap-4">
                <p className="text-zinc-500 text-sm">Nenhum grupo muscular configurado.</p>
                <button
                  onClick={onGerenciar}
                  className="btn px-8 py-4 bg-[#c8f542] text-black font-bold rounded-2xl text-base"
                >
                  Configurar grupos
                </button>
              </div>
            )}
            {splits.map(split => (
              <button
                key={split.id}
                onClick={() => onSelecionarSplit(split)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:border-zinc-600 active:bg-zinc-800 rounded-2xl p-5 text-left flex items-center gap-4"
                style={{ minHeight: '76px' }}
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                  <IconDumbbell />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base truncate">{split.nome}</p>
                  <p className="text-zinc-500 text-sm mt-0.5">
                    {split.ultimo_treino ? `Último: ${split.ultimo_treino}` : 'Nenhum treino registrado'}
                  </p>
                </div>
                <span className="text-zinc-600 flex-shrink-0"><IconChevronRight /></span>
              </button>
            ))}

            {splits.length > 0 && (
              <button
                onClick={onGerenciar}
                className="btn w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 active:bg-zinc-900 active:border-zinc-600 active:text-zinc-300"
                style={{ minHeight: '56px' }}
              >
                <IcGear />
                <span className="text-sm font-semibold">Gerenciar grupos</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM SHEET — sobe a partir da parte de baixo da tela
          Ideal para mobile: polegar alcança naturalmente a partir de baixo.
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* Backdrop */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
          onClick={closeSheet}
        />
      )}

      {/* Painel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-3xl border-t border-zinc-800 flex flex-col"
        style={{
          maxHeight: '90dvh',
          transform: sheetOpen ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: dragY > 0 ? 'none' : 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Cabeçalho fixo do sheet */}
        <div className="flex-shrink-0">
          {/* Pill de arraste */}
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-zinc-700" />
          </div>

          {/* Linha do usuário + botões de ação */}
          <div className="flex items-center justify-between px-5 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#c8f542]/15 border border-[#c8f542]/25 flex items-center justify-center text-[#c8f542]">
                <IcUser />
              </div>
              <div>
                <p className="text-white font-bold text-[15px] leading-tight">{usuario.nome.split(' ')[0]}</p>
                <p className="text-zinc-500 text-xs">{usuario.email || 'Volt'}</p>
              </div>
            </div>

            {/* Botões 44×44 — tamanho mínimo recomendado para toque */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleTema}
                className="btn w-11 h-11 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-700"
                aria-label="Alternar tema"
              >
                {tema === 'claro' ? <IcMoon /> : <IcSun />}
              </button>
              <button
                onClick={() => nav(onPerfil)}
                className="btn w-11 h-11 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-700"
                aria-label="Perfil"
              >
                <IcUser />
              </button>
              <button
                onClick={closeSheet}
                className="btn w-11 h-11 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-700"
                aria-label="Fechar"
              >
                <IcClose />
              </button>
            </div>
          </div>
        </div>

        {/* Lista scrollável */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
          {NAV.map((item, i) => (
            <NavItem
              key={i}
              icon={item.icon}
              label={item.label}
              sublabel={item.sublabel}
              iconColor={item.iconColor}
              iconBg={item.iconBg}
              onClick={() => nav(item.action)}
            />
          ))}

          {/* Divisor */}
          <div className="h-px bg-zinc-800/70 mx-4 my-2" />

          {/* Sair */}
          <button
            onClick={() => { closeSheet(); onLogout(); }}
            className="btn w-full flex items-center gap-4 px-4 rounded-2xl active:bg-red-500/10 text-left"
            style={{ minHeight: '68px' }}
          >
            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-400">
              <IcLogout />
            </div>
            <span className="text-red-400 font-semibold text-[15px]">Sair da conta</span>
          </button>

          {/* Safe area para home indicator do iPhone */}
          <div style={{ height: 'max(24px, env(safe-area-inset-bottom))' }} />
        </div>
      </div>
    </div>
  );
}