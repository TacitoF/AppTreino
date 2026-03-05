import React, { useState, useEffect, useRef, useCallback } from 'react';

import { apiFetch, getAuthToken, clearAuthToken, salvarSessao, carregarSessao } from './auth';
import { R } from './config';
import { Toast } from './components/ui';
import { IOSInstallBanner } from './components/ui';
import TelaAuth             from './screens/TelaAuth';
import TelaGrupamentos      from './screens/TelaGrupamentos';
import TelaGerenciarSplits  from './screens/TelaGerenciarSplits';
import TelaTreino           from './screens/TelaTreino';
import TelaResumo           from './screens/TelaResumo';
import TelaRank             from './screens/TelaRank';
import TelaCardio           from './screens/TelaCardio';

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Restaura sessão salva (evita voltar ao login quando iOS descarrega a página)
  const sessaoSalva = carregarSessao();
  const tokenSalvo  = getAuthToken();
  const podeRestaurar = !!(sessaoSalva?.usuario && tokenSalvo);

  const [usuario, setUsuario]        = useState(podeRestaurar ? sessaoSalva.usuario : null);
  const [tela, setTela]              = useState(podeRestaurar ? sessaoSalva.tela : 'auth');
  const [splits, setSplits]          = useState([]);
  const [loadingSplits, setLoadingS] = useState(false);
  const [splitAtivo, setSplitAtivo]  = useState(podeRestaurar ? sessaoSalva.splitAtivo : null);
  const [historico, setHistorico]    = useState([]);
  const [resultado, setResultado]    = useState(null);
  const [lobbyConvite, setLobbyConvite] = useState(null);
  const [toast, setToast]            = useState(null);
  const toastTimerRef                = useRef(null);

  // Persiste sessão sempre que estado crítico muda
  const usuarioRef   = useRef(usuario);
  const telaRef      = useRef(tela);
  const splitAtivoRef = useRef(splitAtivo);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);
  useEffect(() => { telaRef.current = tela; }, [tela]);
  useEffect(() => { splitAtivoRef.current = splitAtivo; }, [splitAtivo]);

  useEffect(() => {
    if (usuario) salvarSessao(usuario, tela, splitAtivo);
  }, [usuario, tela, splitAtivo]);

  // Se restaurou sessão, recarrega splits em background sem bloquear a UI
  useEffect(() => {
    if (podeRestaurar && sessaoSalva.usuario) {
      carregarSplitsInterno(sessaoSalva.usuario.id);
      // Se estava no treino, recarrega histórico em background também
      if (sessaoSalva.tela === 'treino' && sessaoSalva.splitAtivo) {
        const sa = sessaoSalva.splitAtivo;
        const nomeParaBusca = sa.nomeHistorico || sa.nome;
        apiFetch(
          `${R.historico}?id_usuario=${sessaoSalva.usuario.id}` +
          `&split_id=${encodeURIComponent(sa.id)}` +
          `&nome_treino=${encodeURIComponent(nomeParaBusca)}`
        )
          .then(r => setHistorico(r.series || []))
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrarToast = useCallback((mensagem, tipo='sucesso') => {
    clearTimeout(toastTimerRef.current);
    setToast({ mensagem, tipo });
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const carregarSplitsInterno = useCallback(async uid => {
    setLoadingS(true);
    try {
      const r = await apiFetch(`${R.splits}?id_usuario=${uid}`);
      setSplits(r.splits || []);
    } catch (err) {
      console.error('Erro ao carregar splits:', err);
      setSplits([]);
    } finally { setLoadingS(false); }
  }, []);

  const carregarSplits = carregarSplitsInterno;

  const onLogin = useCallback(u => {
    setUsuario(u);
    carregarSplitsInterno(u.id);
    setTela('grupamentos');
    mostrarToast(`Bem-vindo, ${u.nome.split(' ')[0]}.`, 'sucesso');
  }, [carregarSplitsInterno, mostrarToast]);

  const onLogout = useCallback(() => {
    clearAuthToken();
    setUsuario(null); setTela('auth'); setSplits([]);
    setSplitAtivo(null); setHistorico([]);
  }, []);

  const onSelecionarSplit = useCallback(split => {
    // Navega imediatamente para dar feedback visual ao usuário
    setSplitAtivo(split);
    setHistorico([]);
    setTela('treino');
    // Busca histórico em background — TelaTreino reage quando historicoAnterior muda
    const nomeParaBusca = split.nomeHistorico || split.nome;
    apiFetch(
      `${R.historico}?id_usuario=${usuarioRef.current.id}` +
      `&split_id=${encodeURIComponent(split.id)}` +
      `&nome_treino=${encodeURIComponent(nomeParaBusca)}`
    )
      .then(r => setHistorico(r.series || []))
      .catch(() => {});
  }, []);

  const onFinalizar = useCallback(res => {
    setResultado(res);
    setSplitAtivo(null);
    setTela('resumo');
    mostrarToast('Treino finalizado.', 'sucesso');
  }, [mostrarToast]);

  return (
    <>
      <Toast data={toast}/>
      <IOSInstallBanner/>
      {tela==='auth'             && <TelaAuth onLogin={onLogin} mostrarToast={mostrarToast}/>}
      {tela==='grupamentos'      && usuario && <TelaGrupamentos usuario={usuario} splits={splits} loadingSplits={loadingSplits} onSelecionarSplit={onSelecionarSplit} onGerenciar={()=>setTela('gerenciar-splits')} onRank={()=>setTela('rank')} onCardio={()=>setTela('cardio')} onLogout={onLogout}/>}
      {tela==='gerenciar-splits' && usuario && <TelaGerenciarSplits usuario={usuario} splits={splits} onSalvar={l=>{setSplits(l);setTela('grupamentos');}} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
      {tela==='treino'           && splitAtivo && <TelaTreino usuario={usuario} split={splitAtivo} historicoAnterior={historico} onFinalizar={onFinalizar} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
      {tela==='resumo'           && resultado && <TelaResumo resultado={resultado} onVoltar={()=>setTela('grupamentos')}/>}
      {tela==='rank'             && usuario && <TelaRank usuario={usuario} mostrarToast={mostrarToast} onVoltar={()=>setTela('grupamentos')}/>}
      {tela==='cardio'           && usuario && <TelaCardio usuario={usuario} onVoltar={()=>setTela('grupamentos')} mostrarToast={mostrarToast}/>}
    </>
  );
}