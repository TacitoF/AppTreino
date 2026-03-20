import React, { useState, useMemo } from 'react';
import Avatar, { genConfig } from 'react-nice-avatar';
import { apiFetch } from '../auth';
import { R } from '../config';

const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;

// ─── TODAS AS OPÇÕES DISPONÍVEIS NA BIBLIOTECA ──────────────────────────────
const OPCOES = {
  sex: ['man', 'woman'],
  hairStyle: ['normal', 'thick', 'mohawk', 'womanLong', 'womanShort'],
  hatStyle: ['none', 'beanie', 'turban'],
  faceColor: ['#f9c9b6', '#f8b69b', '#e09879', '#ac6651', '#7b3f2f', '#4e2418'],
  hairColor: ['#000000', '#4a3123', '#d6b370', '#e8e1d3', '#d64d4d', '#71b8e6', '#c8f542'],
  shirtStyle: ['hoody', 'short', 'polo'],
  shirtColor: ['#c8f542', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#000000', '#ffffff'],
  eyeStyle: ['circle', 'oval', 'smile'],
  noseStyle: ['short', 'long', 'round'],
  mouthStyle: ['smile', 'laugh', 'peace'],
  glassesStyle: ['none', 'round', 'square'],
};

export default function TelaAvatar({ usuario, onVoltar, onSalvar, mostrarToast }) {
  const [config, setConfig] = useState(() => {
    try {
      if (usuario.avatar_config) return JSON.parse(usuario.avatar_config);
    } catch (e) {}
    return {
      sex: 'man',
      faceColor: OPCOES.faceColor[0],
      earSize: 'small',
      eyeStyle: 'circle',
      noseStyle: 'short',
      mouthStyle: 'smile',
      shirtStyle: 'hoody',
      glassesStyle: 'none',
      hairColor: OPCOES.hairColor[0],
      hairStyle: 'normal',
      hatStyle: 'none',
      shirtColor: OPCOES.shirtColor[0],
      bgColor: 'transparent' // Fundo transparente para não bugar o preview
    };
  });

  const [aba, setAba] = useState('cabelo');
  const [salvando, setSalvando] = useState(false);

  // Trava a configuração para não gerar traços aleatórios sozinhos
  const avatarSeguro = useMemo(() => genConfig({ ...config, isRandom: false }), [config]);

  const atualizar = (chave, valor) => {
    setConfig(prev => ({ ...prev, [chave]: valor }));
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        id_usuario: usuario.id,
        nome: usuario.nome, 
        email: usuario.email,
        avatar_config: JSON.stringify(config)
      };
      await apiFetch(R.editarUsuario || '/api/usuario/editar', { method: 'POST', body: payload });
      const usrAtualizado = { ...usuario, avatar_config: JSON.stringify(config) };
      if (onSalvar) onSalvar(usrAtualizado);
      mostrarToast('Avatar atualizado!', 'sucesso');
      onVoltar();
    } catch {
      mostrarToast('Erro ao salvar avatar.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  // ─── RENDERIZADORES VISUAIS ───────────────────────────────────────────────
  
  // Renderiza bolinhas de cor
  const renderCores = (chave) => (
    <div className="grid grid-cols-6 gap-3 mt-3 mb-6">
      {OPCOES[chave].map(cor => (
        <button
          key={cor}
          onClick={() => atualizar(chave, cor)}
          className={`aspect-square rounded-full border-4 transition-all ${
            config[chave] === cor ? 'border-[#c8f542] scale-110 shadow-lg' : 'border-zinc-800'
          }`}
          style={{ backgroundColor: cor }}
        />
      ))}
    </div>
  );

  // Renderiza botões com MINIATURAS do avatar (O pulo do gato!)
  const renderPreviews = (chave, label) => (
    <div className="mb-6">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {OPCOES[chave].map(estilo => {
          // Criamos uma config temporária só para mostrar como o boneco ficaria com essa peça
          const previewConfig = genConfig({ ...config, [chave]: estilo, isRandom: false });
          
          return (
            <button
              key={estilo}
              onClick={() => atualizar(chave, estilo)}
              className={`relative aspect-square rounded-2xl overflow-hidden transition-all flex items-center justify-center bg-zinc-900 border-2 ${
                config[chave] === estilo
                  ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105 z-10'
                  : 'border-zinc-800 opacity-70 hover:opacity-100'
              }`}
            >
              {estilo === 'none' && chave !== 'hatStyle' ? (
                <span className="text-zinc-500 text-xs font-bold">Nenhum</span>
              ) : (
                <div className="w-[140%] h-[140%] pointer-events-none mt-4">
                  <Avatar style={{ width: '100%', height: '100%' }} {...previewConfig} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-4 pt-12 pb-3 flex items-center justify-between bg-[#0a0a0a]/95 backdrop-blur-md z-10 sticky top-0 border-b border-zinc-900">
        <button onClick={onVoltar} disabled={salvando} className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800">
          <IconBack />
        </button>
        <h1 className="text-lg font-black text-white">Seu Personagem</h1>
        <button onClick={salvar} disabled={salvando} className="text-[#c8f542] font-bold text-sm bg-[#c8f542]/10 px-4 py-2 rounded-xl active:bg-[#c8f542]/20 transition-colors">
          {salvando ? '...' : 'Salvar'}
        </button>
      </div>

      <div className="flex justify-center items-center py-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="w-40 h-40 rounded-full shadow-[0_0_40px_rgba(200,245,66,0.1)] border-4 border-zinc-800/80 overflow-hidden relative bg-zinc-900">
          <Avatar style={{ width: '100%', height: '100%' }} {...avatarSeguro} />
        </div>
      </div>

      <div className="flex px-4 border-b border-zinc-900">
        {['cabelo', 'rosto', 'roupa', 'cores'].map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              aba === a ? 'text-[#c8f542] border-[#c8f542]' : 'text-zinc-600 border-transparent active:text-zinc-400'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {aba === 'cabelo' && (
          <div>
            {renderPreviews('sex', 'Base do Corpo (Resolve bugs de cabelo)')}
            {renderPreviews('hairStyle', 'Corte de Cabelo')}
            {renderPreviews('hatStyle', 'Acessórios de Cabeça')}
          </div>
        )}
        {aba === 'rosto' && (
          <div>
            {renderPreviews('eyeStyle', 'Olhos')}
            {renderPreviews('noseStyle', 'Nariz')}
            {renderPreviews('mouthStyle', 'Boca')}
            {renderPreviews('glassesStyle', 'Óculos')}
          </div>
        )}
        {aba === 'roupa' && <div>{renderPreviews('shirtStyle', 'Estilo da Roupa')}</div>}
        {aba === 'cores' && (
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2">Tom de Pele</p>
            {renderCores('faceColor')}
            <div className="h-px bg-zinc-900 my-4" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cor do Cabelo</p>
            {renderCores('hairColor')}
            <div className="h-px bg-zinc-900 my-4" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cor da Roupa</p>
            {renderCores('shirtColor')}
          </div>
        )}
      </div>
    </div>
  );
}