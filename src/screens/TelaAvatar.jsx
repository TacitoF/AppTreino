import React, { useState, useMemo } from 'react';
import Avatar, { genConfig } from 'react-nice-avatar';
import { apiFetch } from '../auth';
import { R } from '../config';

const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;

// ─── DETECTOR DE ERROS GLOBAIS ──────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, errorInfo) { this.setState({ errorInfo }); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-900 p-6 flex flex-col items-center justify-center">
          <h1 className="text-red-500 font-black text-2xl mb-4">O App Crashou!</h1>
          <p className="text-white mb-2">Por favor, envie o erro abaixo para o Gemini:</p>
          <div className="bg-black text-red-400 p-4 rounded-xl text-xs font-mono w-full overflow-auto">
            <p className="font-bold">{this.state.error.toString()}</p>
            <p className="mt-4 text-zinc-500">{this.state.errorInfo?.componentStack}</p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-xl">
            Recarregar App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
function TelaAvatarConteudo({ usuario, onVoltar, onSalvar, mostrarToast }) {
  const [config, setConfig] = useState(() => {
    try {
      if (usuario?.avatar_config) return JSON.parse(usuario.avatar_config);
    } catch (e) {}
    return {
      sex: 'man',
      faceColor: '#f9c9b6',
      earSize: 'small',
      eyeStyle: 'circle',
      noseStyle: 'short',
      mouthStyle: 'smile',
      shirtStyle: 'hoody',
      glassesStyle: 'none',
      hairColor: '#000000',
      hairStyle: 'normal',
      shirtColor: '#c8f542',
    };
  });

  const salvar = async () => {
    mostrarToast('Simulação de salvamento', 'info');
    onVoltar();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-4 pt-12 pb-3 flex items-center justify-between border-b border-zinc-900">
        <button onClick={onVoltar} className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
          <IconBack />
        </button>
        <h1 className="text-lg font-black text-white">Modo Debug</h1>
        <button onClick={salvar} className="text-[#c8f542] font-bold text-sm">Salvar</button>
      </div>

      <div className="flex justify-center items-center py-10 bg-zinc-900/50">
        <div className="w-48 h-48 rounded-full border-4 border-zinc-800 shadow-xl overflow-hidden flex items-center justify-center">
          {/* A renderização direta do Avatar que pode estar causando o crash */}
          <Avatar style={{ width: '100%', height: '100%' }} {...config} />
        </div>
      </div>
      
      <div className="p-5 text-center text-zinc-500">
        Se você está vendo esta tela inteira, a biblioteca carregou com sucesso!
      </div>
    </div>
  );
}

export default function TelaAvatar(props) {
  return (
    <ErrorBoundary>
      <TelaAvatarConteudo {...props} />
    </ErrorBoundary>
  );
}