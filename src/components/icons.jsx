import { memo } from 'react';

// ─── ÍCONES GERAIS ───────────────────────────────────────────────────────────
// ─── ÍCONES — memo para evitar re-render desnecessário ───────────────────────
export const IconCheck = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
));
export const IconUndo = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
  </svg>
));
export const IconPlus = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
));
export const IconTrash = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"/>
  </svg>
));
export const IconBack = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
));
export const IconTimer = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="12" cy="13" r="8"/>
    <path strokeLinecap="round" d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5"/>
  </svg>
));
export const IconHistory = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
));
export const IconDumbbell = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8v8M17.5 8v8M4 9.5v5M20 9.5v5M6.5 12h11"/>
    <rect x="3.5" y="9" width="3" height="6" rx="1.5"/>
    <rect x="17.5" y="9" width="3" height="6" rx="1.5"/>
  </svg>
));
export const IconSettings = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="12" cy="12" r="3"/>
    <path strokeLinecap="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
));
export const IconChevronRight = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
));
export const IconTrophy = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
  </svg>
));
export const IconStop = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <rect x="5" y="5" width="14" height="14" rx="2"/>
  </svg>
));

export const IconCardio = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5C3.5 5.46 5.96 3 9 3c1.67 0 3.17.75 4.2 1.94A5.5 5.5 0 0120.5 8.5c0 5.5-7.5 10.5-9.5 10.5S3.5 14 3.5 8.5z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h3l2-4 3 8 2-5 2 3 1-2h4"/>
  </svg>
));

export const IconFlame = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C9 6 7 8 7 11a5 5 0 0010 0c0-1-.3-2-.8-3C14.5 10 13 10 12 8c0 0 1.5-2 0-6z"/>
    <path d="M12 14a2 2 0 100 4 2 2 0 000-4z" opacity=".6"/>
  </svg>
));

export const IconUsers = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
));
export const IconCrown = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M2 19h20v2H2v-2zM2 6l5 7 5-7 5 7 5-7v11H2V6z"/>
  </svg>
));
export const IconLink = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
));

// ─── TOAST ────────────────────────────────────────────────────────────────────

// ─── ÍCONE DRAG HANDLE ───────────────────────────────────────────────────────
export const IconDrag = memo(() => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="9" cy="6"  r="1.5"/><circle cx="15" cy="6"  r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
));


// ─── ÍCONES DE MÚSCULO ───────────────────────────────────────────────────────
export const MuscPeito      = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M12 20 Q 20 10 31 18 L 31 40 Q 20 46 12 36 Z"/><path d="M52 20 Q 44 10 33 18 L 33 40 Q 44 46 52 36 Z"/></svg>);
export const MuscCostas     = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 12 12 Q 24 16 31 20 L 31 52 Q 20 52 14 34 Z"/><path d="M 52 12 Q 40 16 33 20 L 33 52 Q 44 52 50 34 Z"/></svg>);
export const MuscOmbro      = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 12 32 C 12 14 26 14 26 32 Z"/><path d="M 52 32 C 52 14 38 14 38 32 Z"/></svg>);
export const MuscBiceps     = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><rect x="14" y="12" width="14" height="40" rx="7"/><rect x="36" y="12" width="14" height="40" rx="7"/></svg>);
export const MuscTriceps    = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 18 10 C 24 10 26 40 20 54 C 14 48 12 10 18 10 Z"/><path d="M 46 10 C 40 10 38 40 44 54 C 50 48 52 10 46 10 Z"/></svg>);
export const MuscAbdomen    = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><rect x="18" y="10" width="12" height="12" rx="4"/><rect x="34" y="10" width="12" height="12" rx="4"/><rect x="18" y="26" width="12" height="12" rx="4"/><rect x="34" y="26" width="12" height="12" rx="4"/><rect x="18" y="42" width="12" height="12" rx="4"/><rect x="34" y="42" width="12" height="12" rx="4"/></svg>);
export const MuscQuad       = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 22 10 C 32 10 32 46 24 54 C 14 54 12 10 22 10 Z"/><path d="M 42 10 C 32 10 32 46 40 54 C 50 54 52 10 42 10 Z"/></svg>);
export const MuscPost       = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 26 12 C 30 12 30 50 26 52 C 14 50 14 12 26 12 Z"/><path d="M 38 12 C 34 12 34 50 38 52 C 50 50 50 12 38 12 Z"/></svg>);
export const MuscGluteo     = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><circle cx="22" cy="32" r="16"/><circle cx="42" cy="32" r="16"/></svg>);
export const MuscPanturr    = memo(() => <svg viewBox="0 0 64 64" fill="currentColor" className="w-full h-full"><path d="M 22 12 C 28 12 28 40 24 52 C 18 48 16 12 22 12 Z"/><path d="M 42 12 C 36 12 36 40 40 52 C 46 48 48 12 42 12 Z"/></svg>);


// ─── ÍCONES DE CARDIO ────────────────────────────────────────────────────────
export const CardCorrida    = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 4a1 1 0 100-2 1 1 0 000 2zM5 17l2-5 3 2 3-4 4 1M5 17l-1 3M19 10l-3-2"/></svg>);
export const CardBike       = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 16l4-8h4l2 8M10 8l2 3h4"/></svg>);
export const CardEliptico   = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M8 7l4 4 4-4M8 17l4-4 4 4M12 17v4"/><ellipse cx="12" cy="12" rx="4" ry="2"/></svg>);
export const CardEsteira    = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17h18M6 17V9l3-3 3 3v5M15 9h3l1 4M12 6a1 1 0 100-2 1 1 0 000 2z"/></svg>);
export const CardCorda      = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2zM5 8c1 3 2 4 7 4s6-1 7-4M5 16c1-3 2-4 7-4s6 1 7 4"/></svg>);
export const CardNatacao    = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M14 8l-4-4M10 4l6 2-2 4"/></svg>);
export const CardRemo       = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 2 4-4 5 5M15 6a1 1 0 100-2 1 1 0 000 2zM9 10l3-4 3 2"/></svg>);
export const CardHIIT       = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg>);
export const CardEscada     = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h4v-4h4v-4h4v-4h4V5"/></svg>);
export const CardCaminhada  = memo(() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 4a1 1 0 100-2 1 1 0 000 2zM9 21l1-5 3 2 2-6M7 9l2-2 4 2 3-2M17 21l-2-5"/></svg>);