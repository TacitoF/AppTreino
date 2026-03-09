import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getAuthToken, clearAuthToken, salvarSessao, carregarSessao } from './auth';
import { R } from './config';
import { Toast, IOSInstallBanner } from './components/ui';
import TelaAuth             from './screens/TelaAuth';
import TelaGrupamentos      from './screens/TelaGrupamentos';
import TelaGerenciarSplits  from './screens/TelaGerenciarSplits';
import TelaTreino           from './screens/TelaTreino';
import TelaResumo           from './screens/TelaResumo';
import TelaRank             from './screens/TelaRank';
import TelaCardio           from './screens/TelaCardio';
import TelaDieta            from './screens/TelaDieta';
import TelaPerfil           from './screens/TelaPerfil';
import TelaHistorico        from './screens/TelaHistorico';
import TelaGraficos         from './screens/TelaGraficos';

export default function App() {
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
  const [toast, setToast]            = useState(null);
  // para navegar direto de histórico → gráficos filtrando por split
  const [splitGraficoPre, setSplitGraficoPre] = useState(null);
  const toastTimerRef                = useRef(null);

  const usuarioRef = useRef(usuario);
  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);

  useEffect(() => {
    if (usuario) salvarSessao(usuario, tela, splitAtivo);
  }, [usuario, tela, splitAtivo]);

  useEffect(() => {
    if (podeRestaurar && sessaoSalva.usuario) {
      carregarSplitsInterno(sessaoSalva.usuario.id);
      if (sessaoSalva.tela === 'treino' && sessaoSalva.splitAtivo) {
        const sa = sessaoSalva.splitAtivo;
        const nomeParaBusca = sa.nomeHistorico || sa.nome;
        apiFetch(`${R.historico}?id_usuario=${sessaoSalva.usuario.id}&split_id=${encodeURIComponent(sa.id)}&nome_treino=${encodeURIComponent(nomeParaBusca)}`)
          .then(r => setHistorico(r.series || []))
          .catch(() => {});
      }
    }
  }, []);

  const mostrarToast = useCallback((mensagem, tipo = 'sucesso') => {
    clearTimeout(toastTimerRef.current);
    setToast({ mensagem, tipo });
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const carregarSplitsInterno = useCallback(async uid => {
    setLoadingS(true);
    try {
      const r = await apiFetch(`${R.splits}?id_usuario=${uid}`);
      setSplits(r.splits || []);
    } catch {
      setSplits([]);
    } finally { setLoadingS(false); }
  }, []);

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
    setSplitAtivo(split);
    setHistorico([]);
    setTela('treino');
    const nomeParaBusca = split.nomeHistorico || split.nome;
    apiFetch(`${R.historico}?id_usuario=${usuarioRef.current.id}&split_id=${encodeURIComponent(split.id)}&nome_treino=${encodeURIComponent(nomeParaBusca)}`)
      .then(r => setHistorico(r.series || []))
      .catch(() => {});
  }, []);

  const onFinalizar = useCallback(res => {
    setResultado(res);
    setSplitAtivo(null);
    setTela('resumo');
    mostrarToast('Treino finalizado.', 'sucesso');
  }, [mostrarToast]);

  // navega para gráficos com split pré-filtrado (vindo do histórico)
  const irParaGraficos = useCallback((splitNome) => {
    setSplitGraficoPre(splitNome);
    setTela('graficos');
  }, []);

  return (
    <>
      <Toast data={toast}/>
      <IOSInstallBanner/>

      {tela === 'auth' && (
        <TelaAuth onLogin={onLogin} mostrarToast={mostrarToast}/>
      )}

      {tela === 'grupamentos' && usuario && (
        <TelaGrupamentos
          usuario={usuario}
          splits={splits}
          loadingSplits={loadingSplits}
          onSelecionarSplit={onSelecionarSplit}
          onGerenciar={() => setTela('gerenciar-splits')}
          onRank={() => setTela('rank')}
          onCardio={() => setTela('cardio')}
          onDieta={() => setTela('dieta')}
          onPerfil={() => setTela('perfil')}
          onHistorico={() => setTela('historico')}
          onLogout={onLogout}
        />
      )}

      {tela === 'perfil' && usuario && (
        <TelaPerfil
          usuario={usuario}
          onSalvar={u => { setUsuario(u); setTela('grupamentos'); mostrarToast('Perfil atualizado!', 'sucesso'); }}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'gerenciar-splits' && usuario && (
        <TelaGerenciarSplits
          usuario={usuario}
          splits={splits}
          onSalvar={l => { setSplits(l); setTela('grupamentos'); }}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'treino' && splitAtivo && (
        <TelaTreino
          usuario={usuario}
          split={splitAtivo}
          historicoAnterior={historico}
          onFinalizar={onFinalizar}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'resumo' && resultado && (
        <TelaResumo resultado={resultado} onVoltar={() => setTela('grupamentos')}/>
      )}

      {tela === 'rank' && usuario && (
        <TelaRank usuario={usuario} mostrarToast={mostrarToast} onVoltar={() => setTela('grupamentos')}/>
      )}

      {tela === 'cardio' && usuario && (
        <TelaCardio usuario={usuario} onVoltar={() => setTela('grupamentos')} mostrarToast={mostrarToast}/>
      )}

      {tela === 'dieta' && usuario && (
        <TelaDieta usuario={usuario} onVoltar={() => setTela('grupamentos')} mostrarToast={mostrarToast}/>
      )}

      {tela === 'historico' && usuario && (
        <TelaHistorico
          usuario={usuario}
          splits={splits}
          onVoltar={() => setTela('grupamentos')}
          onVerGraficos={irParaGraficos}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'graficos' && usuario && (
        <TelaGraficos
          usuario={usuario}
          splitInicial={splitGraficoPre}
          onVoltar={() => setTela('historico')}
          mostrarToast={mostrarToast}
        />
      )}
    </>
  );
}