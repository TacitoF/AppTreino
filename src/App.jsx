import React, { useState, useEffect, useRef, useCallback } from 'react';
// Adicionado o setAuthToken na importação abaixo para evitar erro no Login!
import { apiFetch, getAuthToken, setAuthToken, clearAuthToken, salvarSessao, carregarSessao } from './auth';
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
import TelaRelatorio        from './screens/TelaRelatorio';
import TelaPeso             from './screens/TelaPeso';
import TelaProgressao       from './screens/TelaProgressao';
import TelaAvatar           from './screens/TelaAvatar';

const TEMA_KEY = 'volt_tema';

export default function App() {
  const sessaoSalva   = carregarSessao();
  const tokenSalvo    = getAuthToken();
  const podeRestaurar = !!(sessaoSalva?.usuario && tokenSalvo);

  const [usuario, setUsuario]        = useState(podeRestaurar ? sessaoSalva.usuario : null);
  const [tela, setTela]              = useState(podeRestaurar ? sessaoSalva.tela : 'auth');
  const [splitAtivo, setSplitAtivo]  = useState(podeRestaurar ? sessaoSalva.splitAtivo : null);
  const [resultadoTreino, setResultadoTreino] = useState(null);
  const [splits, setSplits]          = useState([]);
  const [loadingSplits, setLoadingSplits] = useState(false);
  const [toast, setToast]            = useState(null);
  const [tema, setTema]              = useState(() => localStorage.getItem(TEMA_KEY) || 'escuro');
  const [splitGraficoPre, setSplitGraficoPre] = useState(null);

  // ── FUNÇÃO DE SALVAR USUÁRIO ──
  const handleSalvarUsuario = (userAtualizado) => {
    setUsuario(userAtualizado);
    salvarSessao(userAtualizado, tela, splitAtivo);
  };
  // ──────────────────────────────

  const mostrarToast = useCallback((msg, tipo = 'info') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const carregarSplits = useCallback(async (id_usuario) => {
    setLoadingSplits(true);
    try {
      const r = await apiFetch(`${R.splits}?id_usuario=${id_usuario}`);
      setSplits(r.splits || []);
    } catch {
      mostrarToast('Erro ao carregar treinos.', 'erro');
    } finally {
      setLoadingSplits(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    if (usuario) carregarSplits(usuario.id);
  }, [usuario, carregarSplits]);

  useEffect(() => {
    if (usuario && tela !== 'auth') salvarSessao(usuario, tela, splitAtivo);
  }, [usuario, tela, splitAtivo]);

  const toggleTema = useCallback(() => {
    const novo = tema === 'escuro' ? 'claro' : 'escuro';
    setTema(novo);
    localStorage.setItem(TEMA_KEY, novo);
  }, [tema]);

  const handleLogin = (u, t) => {
    setUsuario(u);
    setAuthToken(t);
    setTela('grupamentos');
  };

  const handleLogout = () => {
    setUsuario(null);
    setTela('auth');
    setSplitAtivo(null);
    clearAuthToken();
  };

  const irParaGraficos = useCallback((splitNome) => {
    setSplitGraficoPre(splitNome);
    setTela('graficos');
  }, []);

  return (
    <div className={tema === 'claro' ? 'tema-claro' : 'tema-escuro'}>
      <IOSInstallBanner />
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

      {tela === 'auth' && (
        <TelaAuth onLogin={handleLogin} mostrarToast={mostrarToast} />
      )}

      {tela === 'grupamentos' && usuario && (
        <TelaGrupamentos
          usuario={usuario}
          splits={splits}
          loadingSplits={loadingSplits}
          onSelecionarSplit={s => { setSplitAtivo(s); setTela('treino'); }}
          onGerenciar={() => setTela('gerenciar_splits')}
          onLogout={handleLogout}
          onPerfil={() => setTela('perfil')}
          onRank={() => setTela('rank')}
          onCardio={() => setTela('cardio')}
          onDieta={() => setTela('dieta')}
          onHistorico={() => setTela('historico')}
          onRelatorio={() => setTela('relatorio')}
          onPeso={() => setTela('peso')}
          onProgressao={() => setTela('progressao')}
          tema={tema}
          onToggleTema={toggleTema}
        />
      )}

      {tela === 'gerenciar_splits' && usuario && (
        <TelaGerenciarSplits
          usuario={usuario}
          splits={splits}
          onSalvar={() => { carregarSplits(usuario.id); setTela('grupamentos'); }}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'perfil' && usuario && (
        <TelaPerfil
          usuario={usuario}
          onSalvar={handleSalvarUsuario}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
          tema={tema}
          onToggleTema={toggleTema}
          onEditAvatar={() => setTela('avatar')}
        />
      )}

      {tela === 'avatar' && usuario && (
        <TelaAvatar
          usuario={usuario}
          onSalvar={handleSalvarUsuario}
          onVoltar={() => setTela('perfil')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'treino' && usuario && splitAtivo && (
        <TelaTreino
          usuario={usuario}
          split={splitAtivo}
          onVoltar={() => setTela('grupamentos')}
          onFinalizar={(res) => { setResultadoTreino(res); setTela('resumo'); }}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'resumo' && resultadoTreino && (
        <TelaResumo
          resultado={resultadoTreino}
          onVoltar={() => setTela('grupamentos')}
        />
      )}

      {tela === 'rank' && usuario && (
        <TelaRank usuario={usuario} onVoltar={() => setTela('grupamentos')} mostrarToast={mostrarToast}/>
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

      {tela === 'relatorio' && usuario && (
        <TelaRelatorio
          usuario={usuario}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'graficos' && usuario && (
        <TelaGraficos
          usuario={usuario}
          splitInicial={splitGraficoPre}
          onVoltar={() => { setSplitGraficoPre(null); setTela('historico'); }}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'peso' && usuario && (
        <TelaPeso
          usuario={usuario}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
        />
      )}

      {tela === 'progressao' && usuario && (
        <TelaProgressao
          usuario={usuario}
          splits={splits}
          onVoltar={() => setTela('grupamentos')}
          mostrarToast={mostrarToast}
          onUsarTemplate={async () => {
            mostrarToast('Template aplicado com sucesso!', 'sucesso');
            carregarSplits(usuario.id);
            setTela('grupamentos');
          }}
        />
      )}

    </div>
  );
}