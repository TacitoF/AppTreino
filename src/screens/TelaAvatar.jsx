import React, { useState } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';

const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;

// ─── OS PARÂMETROS EXATOS E MILIMÉTRICOS EXIGIDOS PELO DICEBEAR ──────────────
const OPCOES = {
  top: ['shortFlat', 'shortRound', 'shortWaved', 'sides', 'straight01', 'bob', 'bun', 'curly', 'dreads', 'fro', 'turban', 'winterHat1', 'shavedHead'],
  eyes: ['default', 'happy', 'wink', 'surprised', 'squint', 'hearts', 'eyeRoll', 'closed'],
  mouth: ['default', 'smile', 'twinkle', 'serious', 'grimace', 'sad'],
  clothes: ['hoodie', 'shirtCrewNeck', 'shirtVNeck', 'collarAndSweater', 'blazerAndShirt', 'overall', 'graphicShirt'],
  accessories: ['none', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
};

const CORES = {
  skinColor: [
    { id: 'pale', hex: '#FFDBB4' }, { id: 'light', hex: '#EDB98A' }, { id: 'yellow', hex: '#F2C811' },
    { id: 'tanned', hex: '#FD9841' }, { id: 'brown', hex: '#D08B5B' }, { id: 'darkBrown', hex: '#AE5D29' }, { id: 'black', hex: '#614335' }
  ],
  hairColor: [
    { id: 'black', hex: '#262E33' }, { id: 'brownDark', hex: '#4A3123' }, { id: 'brown', hex: '#724133' },
    { id: 'auburn', hex: '#A55728' }, { id: 'blonde', hex: '#D6B370' }, { id: 'red', hex: '#C93305' },
    { id: 'silverGray', hex: '#E8E1E1' }, { id: 'pastelPink', hex: '#F59797' }
  ],
  clotheColor: [
    { id: 'black', hex: '#262E33' }, { id: 'gray02', hex: '#929598' }, { id: 'white', hex: '#FFFFFF' },
    { id: 'blue02', hex: '#65C9FF' }, { id: 'pastelBlue', hex: '#B1E2FF' }, { id: 'pastelGreen', hex: '#A7FFC4' },
    { id: 'pastelRed', hex: '#FFA7A7' }, { id: 'pink', hex: '#FF488E' }, { id: 'red', hex: '#FF5C5C' }
  ]
};

// Construtor Blindado de URL
const getAvatarUrl = (config) => {
  const params = new URLSearchParams();
  params.append('seed', 'Volt');
  params.append('backgroundColor', 'transparent');
  Object.entries(config).forEach(([key, val]) => {
    if (val !== 'none') params.append(key, val);
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
};

export default function TelaAvatar({ usuario, onVoltar, onSalvar, mostrarToast }) {
  const [config, setConfig] = useState(() => {
    try {
      if (usuario?.avatar_config) {
        const parsed = JSON.parse(usuario.avatar_config);
        
        // Auto-Higienização: Converte configs velhas corrompidas para o padrão correto
        const safeConfig = {
          top: parsed.top || 'shortFlat',
          eyes: parsed.eyes || 'default',
          mouth: parsed.mouth || 'smile',
          clothes: parsed.clothes || parsed.clothing || 'hoodie',
          clotheColor: parsed.clotheColor || parsed.clothesColor || 'pastelGreen',
          skinColor: parsed.skinColor || 'light',
          hairColor: parsed.hairColor || 'black',
          accessories: parsed.accessories || 'none'
        };

        // Regra de Ouro: A API bloqueia códigos HEX. Se tiver HEX nas cores, nós as resetamos.
        const isHex = (str) => /^[0-9A-Fa-f]{6}$/.test(str);
        if (isHex(safeConfig.clotheColor)) safeConfig.clotheColor = 'pastelGreen';
        if (isHex(safeConfig.skinColor)) safeConfig.skinColor = 'light';
        if (isHex(safeConfig.hairColor)) safeConfig.hairColor = 'black';

        return safeConfig;
      }
    } catch (e) {}
    
    // Configuração Inicial de Fábrica
    return {
      top: 'shortFlat', hairColor: 'black', skinColor: 'light', clothes: 'hoodie',
      clotheColor: 'pastelGreen', eyes: 'default', mouth: 'smile', accessories: 'none'
    };
  });

  const [aba, setAba] = useState('cabelo');
  const [salvando, setSalvando] = useState(false);

  const atualizar = (chave, valor) => setConfig(prev => ({ ...prev, [chave]: valor }));

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

  const renderCores = (chave) => (
    <div className="grid grid-cols-6 gap-3 mt-3 mb-6">
      {CORES[chave].map(cor => (
        <button
          key={cor.id}
          onClick={() => atualizar(chave, cor.id)}
          className={`aspect-square rounded-full border-4 transition-all ${
            config[chave] === cor.id ? 'border-[#c8f542] scale-110 shadow-lg' : 'border-zinc-800'
          }`}
          style={{ backgroundColor: cor.hex }} // O HEX fica só na UI, o ID limpo vai pro state!
        />
      ))}
    </div>
  );

  const renderPreviews = (chave, label) => (
    <div className="mb-6">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {OPCOES[chave].map(estilo => {
          const previewUrl = getAvatarUrl({ ...config, [chave]: estilo });
          return (
            <button
              key={estilo}
              onClick={() => atualizar(chave, estilo)}
              className={`relative aspect-square rounded-2xl overflow-hidden transition-all flex items-center justify-center bg-zinc-900 border-2 ${
                config[chave] === estilo ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105 z-10' : 'border-zinc-800 opacity-70 hover:opacity-100'
              }`}
            >
              {estilo === 'none' ? (
                <span className="text-zinc-500 text-xs font-bold">Nenhum</span>
              ) : (
                <div className="w-[140%] h-[140%] pointer-events-none mt-4 flex items-center justify-center">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-contain" loading="lazy" />
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
        <div className="w-40 h-40 rounded-full shadow-[0_0_40px_rgba(200,245,66,0.1)] border-4 border-zinc-800/80 overflow-hidden relative bg-zinc-900 flex items-center justify-center">
          <img src={getAvatarUrl(config)} alt="Avatar" className="w-[115%] h-[115%] object-contain mt-4" />
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
        {aba === 'cabelo' && <div>{renderPreviews('top', 'Corte de Cabelo')}</div>}
        {aba === 'rosto' && (
          <div>
            {renderPreviews('eyes', 'Olhos')}
            {renderPreviews('mouth', 'Boca')}
            {renderPreviews('accessories', 'Óculos')}
          </div>
        )}
        {aba === 'roupa' && <div>{renderPreviews('clothes', 'Estilo da Roupa')}</div>}
        {aba === 'cores' && (
          <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2">Tom de Pele</p>
            {renderCores('skinColor')}
            <div className="h-px bg-zinc-900 my-4" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cor do Cabelo</p>
            {renderCores('hairColor')}
            <div className="h-px bg-zinc-900 my-4" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cor da Roupa</p>
            {renderCores('clotheColor')}
          </div>
        )}
      </div>
    </div>
  );
}