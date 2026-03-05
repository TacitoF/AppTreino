import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { apiFetch } from '../auth';
import { IconBack, IconUsers, IconChevronRight, IconLink } from '../components/icons';
import { Spinner } from '../components/ui';

// ─── TELA RANK — LOBBY ────────────────────────────────────────────────────────
function TelaRank({ usuario, mostrarToast, onVoltar }) {
  const [aba, setAba]           = useState('meus');   
  const [meusLobbies, setMeus]  = useState([]);
  const [lobbyAtivo, setLobby]  = useState(null);
  const [ranking, setRanking]   = useState([]);
  const [loading, setLoading]   = useState(false);

  const [nomeLobby, setNomeLobby] = useState('');
  const [dataFim, setDataFim]     = useState('');
  const [codigo, setCodigo]       = useState('');

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
        body: { id_usuario: usuario.id, nome: nomeLobby.trim(), data_fim: dataFim },
      });
      mostrarToast('Lobby criado!', 'sucesso');
      setNomeLobby(''); setDataFim('');
      await carregarMeus();
      abrirLobby(r.lobby);
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
      abrirLobby(r.lobby);
    } catch(e) { mostrarToast(e.message || 'Código inválido.', 'erro'); }
    finally { setLoading(false); }
  };

  const abrirLobby = async (lobby) => {
    setLobby(lobby);
    setAba('lobby');
    setLoading(true);
    try {
      const r = await apiFetch(`/api/rank/ranking?codigo=${lobby.codigo}`);
      setRanking(r.ranking || []);
    } catch { }
    finally { setLoading(false); }
  };

  const [menuAberto, setMenuAberto] = useState(false);

  const copiarLink = (cod) => {
    const url = `${window.location.origin}?lobby=${cod}`;
    navigator.clipboard.writeText(url).then(() => { mostrarToast('Link copiado!', 'sucesso'); setMenuAberto(false); });
  };

  const copiarCodigo = (cod) => {
    navigator.clipboard.writeText(cod).then(() => { mostrarToast('Código copiado!', 'sucesso'); setMenuAberto(false); });
  };

  const encerrado = lobbyAtivo && new Date(lobbyAtivo.data_fim) < new Date();
  const hoje      = new Date().toISOString().slice(0, 10);

  if (aba === 'lobby' && lobbyAtivo) {
    const medalhas = ['🥇','🥈','🥉'];
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="sticky top-0 z-30 bg-[#0a0a0a]/96 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => { setAba('meus'); setLobby(null); }}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold uppercase tracking-wider ${encerrado ? 'text-red-400' : 'text-[#c8f542]'}`}>
              {encerrado ? 'Encerrado' : `Até ${new Date(lobbyAtivo.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
            </div>
            <div className="text-white font-bold text-lg truncate">{lobbyAtivo.nome}</div>
          </div>
          <div className="relative">
            <button onClick={() => setMenuAberto(v => !v)}
              className="btn flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm active:bg-zinc-800">
              <IconLink/><span className="text-xs font-semibold tracking-widest">{lobbyAtivo.codigo}</span>
            </button>
            {menuAberto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)}/>
                <div className="absolute right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-xl w-48">
                  <button onClick={() => copiarCodigo(lobbyAtivo.codigo)}
                    className="btn w-full flex items-center gap-3 px-4 py-3.5 text-left text-white text-sm font-semibold active:bg-zinc-800 border-b border-zinc-800">
                    <span className="text-base">🔢</span> Copiar código
                  </button>
                  <button onClick={() => copiarLink(lobbyAtivo.codigo)}
                    className="btn w-full flex items-center gap-3 px-4 py-3.5 text-left text-white text-sm font-semibold active:bg-zinc-800">
                    <span className="text-base">🔗</span> Copiar link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-4 pt-6 pb-10 flex flex-col gap-3">
          {encerrado && (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-3 text-center mb-2">
              <p className="text-amber-400 font-bold text-sm">🏆 Lobby encerrado — resultado final</p>
            </div>
          )}

          {loading ? <Spinner/> : ranking.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-sm">Nenhum treino registrado ainda.</div>
          ) : ranking.map((p, i) => (
            <div key={p.id_usuario}
              className={`rounded-2xl border px-4 py-4 flex items-center gap-4 ${
                i === 0 ? 'bg-amber-400/8 border-amber-400/25' :
                i === 1 ? 'bg-zinc-800/60 border-zinc-700' :
                i === 2 ? 'bg-orange-900/20 border-orange-800/30' :
                          'bg-zinc-900 border-zinc-800'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 font-black ${
                i === 0 ? 'bg-amber-400/15 text-amber-400' :
                i === 1 ? 'bg-zinc-700 text-zinc-300' :
                i === 2 ? 'bg-orange-900/40 text-orange-400' :
                          'bg-zinc-800 text-zinc-500'}`}>
                {i < 3 ? medalhas[i] : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate">{p.nome}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{p.pontos} dia{p.pontos !== 1 ? 's' : ''} treinado{p.pontos !== 1 ? 's' : ''}</div>
              </div>
              <div className={`text-right flex-shrink-0 ${i === 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                <div className="text-xl font-black num">{p.pontos}</div>
                <div className="text-xs text-zinc-600">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── TELA PRINCIPAL RANK ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={onVoltar}
          className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <h1 className="text-xl font-bold text-white">Ranking</h1>
      </div>

      <div className="flex gap-2 px-5 pt-4 pb-2">
        {[['meus','Meus Lobbies'],['criar','Criar'],['entrar','Entrar']].map(([v,l]) => (
          <button key={v} onClick={() => setAba(v)}
            className={`btn px-4 py-2 rounded-xl text-sm font-semibold ${aba===v ? 'bg-[#c8f542] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4 pb-10 flex flex-col gap-3">

        {aba === 'meus' && (
          loading ? <Spinner/> : meusLobbies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-sm mb-4">Você ainda não participa de nenhum lobby.</p>
              <button onClick={() => setAba('criar')}
                className="btn px-6 py-4 bg-[#c8f542] text-black font-bold rounded-2xl">Criar lobby</button>
            </div>
          ) : meusLobbies.map(lb => {
            const enc = new Date(lb.data_fim) < new Date();
            return (
              <button key={lb.codigo} onClick={() => abrirLobby(lb)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl p-4 text-left flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${enc ? 'bg-zinc-800 text-zinc-500' : 'bg-[#c8f542]/10 text-[#c8f542]'}`}>
                  <IconUsers/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate">{lb.nome}</div>
                  <div className={`text-xs mt-0.5 ${enc ? 'text-red-400' : 'text-zinc-500'}`}>
                    {enc ? 'Encerrado' : `Até ${new Date(lb.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`} · {lb.membros} membro{lb.membros !== 1 ? 's' : ''}
                  </div>
                </div>
                <IconChevronRight/>
              </button>
            );
          })
        )}

        {aba === 'criar' && (
          <div className="flex flex-col items-center gap-5 pt-4">
            <div className="w-16 h-16 rounded-2xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center text-[#c8f542]">
              <IconUsers/>
            </div>
            <div className="text-center">
              <h2 className="text-white font-black text-xl">Criar lobby</h2>
              <p className="text-zinc-500 text-sm mt-1">Convide amigos e vejam quem treina mais</p>
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center">Nome do lobby</label>
                <input
                  type="text"
                  placeholder="Ex: Semana dos Bros"
                  value={nomeLobby}
                  onChange={e => setNomeLobby(e.target.value)}
                  maxLength={40}
                  className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600 text-center"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center">Data de encerramento</label>
                <input
                  type="date"
                  value={dataFim}
                  min={hoje}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base text-center [color-scheme:dark]"
                />
                {dataFim && (
                  <p className="text-center text-[#c8f542] text-xs font-semibold">
                    Encerra {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={criarLobby}
              disabled={loading || !nomeLobby.trim() || !dataFim}
              className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl disabled:opacity-40">
              {loading ? 'Criando...' : 'Criar lobby 🚀'}
            </button>

            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 flex flex-col gap-2">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center mb-1">Como funciona</p>
              <div className="flex items-center gap-3">
                <span className="text-lg">✅</span>
                <span className="text-zinc-300 text-sm">Treinou hoje → <span className="text-[#c8f542] font-bold">+1 ponto</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">❌</span>
                <span className="text-zinc-300 text-sm">Não treinou hoje → <span className="text-zinc-500 font-bold">0 pontos</span></span>
              </div>
            </div>
          </div>
        )}

        {aba === 'entrar' && (
          <div className="flex flex-col gap-3">
            <p className="text-zinc-500 text-sm">Digite o código ou acesse o link de convite.</p>
            <input type="text" placeholder="Código (ex: ABC123)" value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())} maxLength={6}
              className="w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600 tracking-widest font-bold uppercase"/>
            <button onClick={entrarLobby} disabled={loading || !codigo.trim()}
              className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar no lobby'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelaRank;