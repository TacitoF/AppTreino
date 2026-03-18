import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../auth';
import { IconBack, IconUsers, IconChevronRight, IconLink } from '../components/icons';
import { Spinner } from '../components/ui';

// ─── Ícones locais ────────────────────────────────────────────────────────────
const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
  </svg>
);
const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
  </svg>
);
const IconAdd = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
function Sheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl px-5 pt-4 pb-10 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
        {children}
      </div>
    </div>
  );
}

// ─── Card de posição no ranking ───────────────────────────────────────────────
function CardRanking({ p, i, meuId, maxPontos }) {
  const eu = p.id_usuario === meuId;
  const estilos = [
    'bg-amber-400/8 border-amber-400/25',
    'bg-zinc-900 border-zinc-800',
    'bg-orange-900/10 border-orange-800/25',
  ];

  // SVGs de medalha por posição
  const IconMedal1 = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8" fill="#fbbf24" opacity="0.9"/>
      <path d="M12 7v10M9.5 9l2.5-2 2.5 2" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IconMedal2 = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8" fill="#94a3b8" opacity="0.9"/>
      <path d="M9.5 9.5C9.5 8.1 10.6 7 12 7s2.5 1.1 2.5 2.5c0 1-0.6 1.8-1.5 2.2L11 14h4" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IconMedal3 = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8" fill="#c2692a" opacity="0.85"/>
      <path d="M10 7.5h3.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H10h2.5c1.1 0 2 .9 2 2s-.9 2-2 2H10" stroke="#431407" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const medals = [<IconMedal1/>, <IconMedal2/>, <IconMedal3/>];

  return (
    <div className={`rounded-2xl border px-4 py-4 flex items-center gap-3.5 ${estilos[i] ?? 'bg-zinc-900 border-zinc-800'} ${eu ? 'ring-1 ring-[#c8f542]/30' : ''}`}>
      {/* Medalha / posição */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black ${
        i === 0 ? 'bg-amber-400/15' : i === 1 ? 'bg-zinc-700/60' : i === 2 ? 'bg-orange-900/30' : 'bg-zinc-800'
      }`}>
        {i < 3 ? medals[i] : <span className="text-zinc-500 text-sm">{i + 1}</span>}
      </div>

      {/* Nome + barra de progresso */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`font-bold truncate ${eu ? 'text-[#c8f542]' : 'text-white'} text-sm`}>{p.nome}</span>
          {eu && <span className="text-[10px] text-[#c8f542]/60 font-semibold flex-shrink-0">você</span>}
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-zinc-600'}`}
            style={{ width: `${Math.round((p.pontos / Math.max(maxPontos, p.pontos)) * 100)}%` }}/>
        </div>
      </div>

      {/* Pontos */}
      <div className="text-right flex-shrink-0">
        <div className={`text-xl font-black ${i === 0 ? 'text-amber-300' : 'text-zinc-300'}`}>{p.pontos}</div>
        <div className="text-zinc-600 text-xs">pts</div>
      </div>
    </div>
  );
}

// ─── Tela de um lobby ─────────────────────────────────────────────────────────
function TelaLobby({ lobby, usuario, onVoltar, mostrarToast }) {
  const [ranking, setRanking]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sheetComp, setComp]    = useState(false);

  useEffect(() => {
    apiFetch(`/api/rank/ranking?codigo=${lobby.codigo}`)
      .then(r => setRanking(r.ranking || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lobby.codigo]);

  const hoje = new Date().toISOString().slice(0, 10);
  const encerrado = lobby.data_fim < hoje;

  const copiar = (texto, label) => {
    navigator.clipboard.writeText(texto).then(() => {
      mostrarToast(`${label} copiado!`, 'sucesso');
      setComp(false);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/96 backdrop-blur-md px-4 pt-12 pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar}
            className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-[11px] font-bold uppercase tracking-widest ${encerrado ? 'text-red-400' : 'text-[#c8f542]'}`}>
              {encerrado ? '● Encerrado' : `● Ativo · até ${new Date(lobby.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
            </div>
            <div className="text-white font-black text-lg leading-tight truncate">{lobby.nome}</div>
          </div>
          <button onClick={() => setComp(true)}
            className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 active:bg-zinc-800 flex-shrink-0">
            <IconShare/>
          </button>
        </div>
      </div>

      {/* Código em destaque */}
      <div className="mx-4 mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider">Código do lobby</p>
          <p className="text-white font-black text-3xl tracking-[0.25em] mt-0.5">{lobby.codigo}</p>
        </div>
        <button onClick={() => copiar(lobby.codigo, 'Código')}
          className="btn flex items-center gap-2 px-4 py-3 bg-zinc-800 active:bg-zinc-700 rounded-xl text-zinc-300 text-sm font-semibold">
          <IconCopy/> Copiar
        </button>
      </div>

      {/* Ranking */}
      <div className="flex-1 px-4 pt-4 pb-10">
        {encerrado && (
          <div className="bg-amber-400/8 border border-amber-400/20 rounded-2xl px-4 py-3 flex items-center gap-3 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3h14l-2 8H7L5 3zm0 0a2 2 0 00-2 2v1h18V5a2 2 0 00-2-2"/>
            </svg>
            <p className="text-amber-300 font-bold text-sm">Resultado final</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner/></div>
        ) : ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={1.8} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-white font-bold">Ninguém treinou ainda</p>
            <p className="text-zinc-500 text-sm">Convide seus amigos e treinem juntos!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {(() => {
              const maxPts = ranking.length > 0 ? Math.max(...ranking.map(r => r.pontos), 1) : 1;
              return ranking.map((p, i) => (
                <CardRanking key={p.id_usuario} p={p} i={i} meuId={usuario.id} maxPontos={maxPts}/>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Sheet compartilhar */}
      <Sheet open={sheetComp} onClose={() => setComp(false)}>
        <p className="text-white font-black text-xl mb-5">Convidar amigos</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => copiar(lobby.codigo, 'Código')}
            className="btn w-full flex items-center gap-4 px-4 py-4 bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl text-left">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0"><IconCopy/></div>
            <div>
              <div className="text-white font-bold text-sm">Copiar código</div>
              <div className="text-zinc-500 text-xs tracking-widest">{lobby.codigo}</div>
            </div>
          </button>
          <button onClick={() => copiar(`${window.location.origin}?lobby=${lobby.codigo}`, 'Link')}
            className="btn w-full flex items-center gap-4 px-4 py-4 bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl text-left">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0"><IconLink/></div>
            <div>
              <div className="text-white font-bold text-sm">Copiar link de convite</div>
              <div className="text-zinc-500 text-xs">Abre diretamente no lobby</div>
            </div>
          </button>
        </div>
      </Sheet>
    </div>
  );
}

// ─── TelaRank principal ───────────────────────────────────────────────────────
function TelaRank({ usuario, mostrarToast, onVoltar }) {
  const [aba, setAba]               = useState('meus');
  const [meusLobbies, setMeus]      = useState([]);
  const [lobbyAtivo, setLobby]      = useState(null);
  const [loading, setLoading]       = useState(false);
  const [nomeLobby, setNomeLobby]   = useState('');
  const [dataFim, setDataFim]       = useState('');
  const [codigo, setCodigo]         = useState('');

  const carregarMeus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/rank/lobbies?id_usuario=${usuario.id}`);
      setMeus(r.lobbies || []);
    } catch { mostrarToast('Erro ao carregar lobbies.', 'erro'); }
    finally { setLoading(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregarMeus(); }, [carregarMeus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cod = params.get('lobby');
    if (cod) { setCodigo(cod); setAba('entrar'); }
  }, []);

  const criarLobby = async () => {
    if (!nomeLobby.trim() || !dataFim) { mostrarToast('Preencha nome e data.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch('/api/rank/criar', {
        method: 'POST',
        body: { id_usuario: usuario.id, nome_usuario: usuario.nome, nome: nomeLobby.trim(), data_fim: dataFim },
      });
      mostrarToast('Lobby criado!', 'sucesso');
      setNomeLobby(''); setDataFim('');
      await carregarMeus();
      setLobby(r.lobby);
    } catch(e) { mostrarToast(e.message || 'Erro ao criar.', 'erro'); }
    finally { setLoading(false); }
  };

  const entrarLobby = async () => {
    if (!codigo.trim()) { mostrarToast('Digite o código.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch('/api/rank/entrar', {
        method: 'POST',
        body: { id_usuario: usuario.id, nome_usuario: usuario.nome, codigo: codigo.trim().toUpperCase() },
      });
      mostrarToast('Entrou no lobby!', 'sucesso');
      setCodigo('');
      window.history.replaceState({}, '', window.location.pathname);
      await carregarMeus();
      setLobby(r.lobby);
    } catch(e) { mostrarToast(e.message || 'Código inválido.', 'erro'); }
    finally { setLoading(false); }
  };

  const hoje = new Date().toISOString().slice(0, 10);

  if (lobbyAtivo) {
    return <TelaLobby lobby={lobbyAtivo} usuario={usuario} onVoltar={() => setLobby(null)} mostrarToast={mostrarToast}/>;
  }

  const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="px-4 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={onVoltar}
          className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Ranking</h1>
          <p className="text-zinc-500 text-xs">Compita com amigos</p>
        </div>
      </div>

      {/* Tabs — flex, altura confortável */}
      <div className="px-4 pt-4 pb-2 flex gap-2">
        {[['meus','Meus lobbies'], ['criar','Criar'], ['entrar','Entrar']].map(([v,l]) => (
          <button key={v} onClick={() => setAba(v)}
            className={`btn flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
              aba === v ? 'bg-[#c8f542] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 active:bg-zinc-800'
            }`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 pt-3 pb-10">

        {/* ── ABA: MEUS LOBBIES ── */}
        {aba === 'meus' && (
          loading ? (
            <div className="flex items-center justify-center py-16"><Spinner/></div>
          ) : meusLobbies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={1.8} className="w-9 h-9">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3h14l-2 8H7L5 3zm0 0a2 2 0 00-2 2v1h18V5a2 2 0 00-2-2"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-lg">Sem lobbies ainda</p>
                <p className="text-zinc-500 text-sm mt-1 max-w-xs">Crie um lobby e desafie seus amigos a treinar mais</p>
              </div>
              <button onClick={() => setAba('criar')}
                className="btn px-8 py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black rounded-2xl">
                Criar meu primeiro lobby
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {meusLobbies.map(lb => {
                const enc = lb.data_fim < new Date().toISOString().slice(0, 10);
                return (
                  <button key={lb.codigo} onClick={() => setLobby(lb)}
                    className="btn w-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl p-4 text-left flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${enc ? 'bg-zinc-800' : 'bg-[#c8f542]/10'}`}>
                      {enc ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth={2} className="w-5 h-5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={1.8} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3h14l-2 8H7L5 3zm0 0a2 2 0 00-2 2v1h18V5a2 2 0 00-2-2"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-base truncate">{lb.nome}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${enc ? 'bg-zinc-800 text-zinc-500' : 'bg-[#c8f542]/10 text-[#c8f542]'}`}>
                          {enc ? 'Encerrado' : `Até ${new Date(lb.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                        </span>
                        <span className="text-zinc-600 text-xs">{lb.membros} membro{lb.membros !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-zinc-600 flex-shrink-0"><IconChevronRight/></div>
                  </button>
                );
              })}
              <button onClick={() => setAba('criar')}
                className="btn w-full py-4 border border-dashed border-zinc-800 active:border-zinc-600 rounded-2xl flex items-center justify-center gap-2 text-zinc-600 active:text-zinc-400 text-sm font-semibold mt-1">
                <IconAdd/> Novo lobby
              </button>
            </div>
          )
        )}

        {/* ── ABA: CRIAR ── */}
        {aba === 'criar' && (
          <div className="flex flex-col gap-4 pt-2">

            {/* Preview vivo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#c8f542]/10 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={1.8} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3h14l-2 8H7L5 3zm0 0a2 2 0 00-2 2v1h18V5a2 2 0 00-2-2"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate">
                  {nomeLobby.trim() || <span className="text-zinc-600 font-normal">Nome do lobby</span>}
                </div>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {dataFim
                    ? `Encerra ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`
                    : 'Defina a data abaixo'
                  }
                </div>
              </div>
            </div>

            <input type="text" placeholder="Nome do lobby (ex: Galera da academia)"
              value={nomeLobby} onChange={e => setNomeLobby(e.target.value)} maxLength={40}
              className={inp}/>

            <div className="relative">
              <input type="date" value={dataFim} min={hoje}
                onChange={e => setDataFim(e.target.value)}
                className={`${inp} [color-scheme:dark]`}/>
              {!dataFim && (
                <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                  <span className="text-zinc-600">Data de encerramento</span>
                </div>
              )}
            </div>

            <button onClick={criarLobby} disabled={loading || !nomeLobby.trim() || !dataFim}
              className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black text-base rounded-2xl disabled:opacity-40">
              {loading ? 'Criando...' : 'Criar lobby'}
            </button>

            {/* Regras */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-4 flex flex-col gap-3">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Como funciona</p>
              {[
                {
                  ic: <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
                  bg: 'bg-[#c8f542]/10',
                  txt: <>Treinou hoje → <span className="text-[#c8f542] font-bold">+1 ponto</span></>
                },
                {
                  ic: <svg viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
                  bg: 'bg-zinc-800',
                  txt: <>Não treinou → <span className="text-zinc-500 font-semibold">0 pontos</span></>
                },
                {
                  ic: <svg viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
                  bg: 'bg-zinc-800',
                  txt: 'Compartilhe o código com os amigos'
                },
              ].map(({ ic, bg, txt }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>{ic}</div>
                  <span className="text-zinc-300 text-sm">{txt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ABA: ENTRAR ── */}
        {aba === 'entrar' && (
          <div className="flex flex-col gap-5 pt-4">
            <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={1.8} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
              <p className="text-white font-black text-xl">Entrar no lobby</p>
              <p className="text-zinc-500 text-sm mt-1">Digite o código de 6 letras que seu amigo compartilhou</p>
            </div>

            {/* Input grande, legível, tipicamente 6 caracteres */}
            <input
              type="text"
              placeholder="ABC123"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              className="w-full bg-zinc-900 text-white px-6 py-5 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-3xl font-black text-center tracking-[0.4em] placeholder-zinc-700 uppercase [color-scheme:dark]"
            />

            {/* Indicador de progresso do código */}
            {codigo.length > 0 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${i < codigo.length ? 'bg-[#c8f542]' : 'bg-zinc-800'}`}/>
                ))}
              </div>
            )}

            <button onClick={entrarLobby} disabled={loading || codigo.trim().length < 6}
              className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black text-base rounded-2xl disabled:opacity-40">
              {loading ? 'Entrando...' : 'Entrar no lobby'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelaRank;