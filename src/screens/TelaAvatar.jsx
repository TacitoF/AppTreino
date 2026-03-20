import React, { useState, useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { apiFetch } from '../auth';
import { R } from '../config';

const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
);

const OPCOES = {
  top: ['shortFlat','shortRound','shortWaved','sides','straight01','bob','bun','curly','dreads','fro','turban','winterHat1','shavedHead'],
  eyes: ['default','happy','wink','surprised','squint','hearts','eyeRoll','closed'],
  mouth: ['default','smile','twinkle','serious','grimace','sad'],
  clothes: ['hoodie','shirtCrewNeck','shirtVNeck','collarAndSweater','blazerAndShirt','overall','graphicShirt'],
  accessories: ['none','prescription01','prescription02','round','sunglasses','wayfarers'],
};

const LABELS = {
  top: { shortFlat:'Curto liso', shortRound:'Curto redondo', shortWaved:'Curto ondulado', sides:'Lateral', straight01:'Liso', bob:'Bob', bun:'Coque', curly:'Cacheado', dreads:'Dreads', fro:'Afro', turban:'Turbante', winterHat1:'Gorro', shavedHead:'Careca' },
  eyes: { default:'Normal', happy:'Feliz', wink:'Piscando', surprised:'Surpreso', squint:'Franzido', hearts:'Coração', eyeRoll:'Revirando', closed:'Fechado' },
  mouth: { default:'Normal', smile:'Sorriso', twinkle:'Brilho', serious:'Sério', grimace:'Careta', sad:'Triste' },
  clothes: { hoodie:'Moletom', shirtCrewNeck:'Camiseta', shirtVNeck:'Decote V', collarAndSweater:'Suéter', blazerAndShirt:'Blazer', overall:'Macacão', graphicShirt:'Estampada' },
  accessories: { none:'Nenhum', prescription01:'Óculos 1', prescription02:'Óculos 2', round:'Redondo', sunglasses:'Sol', wayfarers:'Wayfarer' },
};

const CORES = {
  skinColor: [
    { id:'pale', hex:'#FFDBB4' }, { id:'light', hex:'#EDB98A' }, { id:'yellow', hex:'#F2C811' },
    { id:'tanned', hex:'#FD9841' }, { id:'brown', hex:'#D08B5B' }, { id:'darkBrown', hex:'#AE5D29' }, { id:'black', hex:'#614335' },
  ],
  hairColor: [
    { id:'black', hex:'#262E33' }, { id:'brownDark', hex:'#4A3123' }, { id:'brown', hex:'#724133' },
    { id:'auburn', hex:'#A55728' }, { id:'blonde', hex:'#D6B370' }, { id:'red', hex:'#C93305' },
    { id:'silverGray', hex:'#E8E1E1' }, { id:'pastelPink', hex:'#F59797' },
  ],
  clotheColor: [
    { id:'black', hex:'#262E33' }, { id:'gray02', hex:'#929598' }, { id:'white', hex:'#FFFFFF' },
    { id:'blue02', hex:'#65C9FF' }, { id:'pastelBlue', hex:'#B1E2FF' }, { id:'pastelGreen', hex:'#A7FFC4' },
    { id:'pastelRed', hex:'#FFA7A7' }, { id:'pink', hex:'#FF488E' }, { id:'red', hex:'#FF5C5C' },
  ],
};

// ─── CORE: gera o dataUri do avatar ──────────────────────────────────────────
// CORREÇÃO PRINCIPAL:
//   1. seed = string única por combinação (não fixo 'Volt') → força o PRNG a
//      respeitar os parâmetros passados como único valor possível no array.
//   2. randomizeIds: true → evita colisão de IDs entre múltiplos SVGs na página.
//   3. Todos os campos são sempre passados como array de 1 item → probabilidade
//      100%, o PRNG não tem outra opção para sortear.
const buildAvatarUrl = (cfg, seedSuffix = '') => {
  try {
    const seed = `volt_${cfg.top}_${cfg.eyes}_${cfg.mouth}_${cfg.clothes}_${cfg.skinColor}_${cfg.hairColor}_${cfg.clotheColor}_${cfg.accessories}${seedSuffix}`;

    const avatar = createAvatar(avataaars, {
      seed,
      randomizeIds: true,
      backgroundColor: ['transparent'],
      // Cada campo como array de 1 elemento = seleção determinística garantida
      top:           cfg.top           !== 'none' ? [cfg.top]           : undefined,
      eyes:          cfg.eyes          !== 'none' ? [cfg.eyes]          : undefined,
      mouth:         cfg.mouth         !== 'none' ? [cfg.mouth]         : undefined,
      clothing:      cfg.clothes       !== 'none' ? [cfg.clothes]       : undefined,
      clothingColor: cfg.clotheColor   !== 'none' ? [cfg.clotheColor]   : undefined,
      skinColor:     cfg.skinColor     !== 'none' ? [cfg.skinColor]     : undefined,
      hairColor:     cfg.hairColor     !== 'none' ? [cfg.hairColor]     : undefined,
      accessories:   cfg.accessories   !== 'none' ? [cfg.accessories]   : ['blank'],
      accessoriesColor: ['262e33'],
    });

    return avatar.toDataUri();
  } catch {
    return '';
  }
};

// Preview de um estilo específico (sobrescreve só a chave relevante)
const buildPreviewUrl = (baseConfig, chave, valor) =>
  buildAvatarUrl({ ...baseConfig, [chave]: valor }, `_prev_${chave}_${valor}`);

// ─── ESTADO PADRÃO / PARSE SEGURO ────────────────────────────────────────────
const DEFAULT_CONFIG = {
  top: 'shortFlat', hairColor: 'black', skinColor: 'light',
  clothes: 'hoodie', clotheColor: 'pastelGreen',
  eyes: 'default', mouth: 'smile', accessories: 'none',
};

const parseConfig = (raw) => {
  try {
    if (!raw) return { ...DEFAULT_CONFIG };
    const p = JSON.parse(raw);
    const isHex = (s) => /^[0-9A-Fa-f]{6}$/.test(s);
    return {
      top:         p.top         || DEFAULT_CONFIG.top,
      eyes:        p.eyes        || DEFAULT_CONFIG.eyes,
      mouth:       p.mouth       || DEFAULT_CONFIG.mouth,
      clothes:     p.clothes     || p.clothing    || DEFAULT_CONFIG.clothes,
      clotheColor: isHex(p.clotheColor || '') ? DEFAULT_CONFIG.clotheColor : (p.clotheColor || p.clothingColor || DEFAULT_CONFIG.clotheColor),
      skinColor:   isHex(p.skinColor   || '') ? DEFAULT_CONFIG.skinColor   : (p.skinColor   || DEFAULT_CONFIG.skinColor),
      hairColor:   isHex(p.hairColor   || '') ? DEFAULT_CONFIG.hairColor   : (p.hairColor   || DEFAULT_CONFIG.hairColor),
      accessories: p.accessories || DEFAULT_CONFIG.accessories,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function TelaAvatar({ usuario, onVoltar, onSalvar, mostrarToast }) {
  const [config, setConfig]   = useState(() => parseConfig(usuario?.avatar_config));
  const [aba, setAba]         = useState('cabelo');
  const [salvando, setSalvando] = useState(false);

  // Avatar principal — recalculado toda vez que config muda
  const avatarUrl = useMemo(() => buildAvatarUrl(config), [config]);

  const atualizar = (chave, valor) => setConfig(prev => ({ ...prev, [chave]: valor }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await apiFetch(R.editarUsuario || '/api/usuario/editar', {
        method: 'POST',
        body: { id_usuario: usuario.id, nome: usuario.nome, email: usuario.email, avatar_config: JSON.stringify(config) },
      });
      onSalvar?.({ ...usuario, avatar_config: JSON.stringify(config) });
      mostrarToast('Avatar atualizado!', 'sucesso');
      onVoltar();
    } catch {
      mostrarToast('Erro ao salvar avatar.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  // ── Renders ─────────────────────────────────────────────────────────────────
  const renderPreviews = (chave, label) => (
    <div className="mb-6">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {OPCOES[chave].map(estilo => {
          const selecionado = config[chave] === estilo;
          // Gera preview com seed único → cabelo/olhos/boca aparecem corretamente
          const url = buildPreviewUrl(config, chave, estilo);
          return (
            <button
              key={estilo}
              onClick={() => atualizar(chave, estilo)}
              className={[
                'relative aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-zinc-900 border-2 transition-all',
                selecionado
                  ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105 z-10'
                  : 'border-zinc-800 opacity-70 active:opacity-100',
              ].join(' ')}
            >
              {estilo === 'none' ? (
                <span className="text-zinc-500 text-xs font-bold">Nenhum</span>
              ) : (
                <>
                  <div className="w-[150%] h-[150%] pointer-events-none flex items-center justify-center mt-3 flex-shrink-0">
                    {url && <img src={url} alt={estilo} className="w-full h-full object-contain" loading="lazy"/>}
                  </div>
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-zinc-600 px-1 truncate">
                    {LABELS[chave]?.[estilo] || estilo}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCores = (chave, label) => (
    <div className="mb-5">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="flex flex-wrap gap-3">
        {CORES[chave].map(cor => (
          <button
            key={cor.id}
            onClick={() => atualizar(chave, cor.id)}
            className={[
              'w-10 h-10 rounded-full border-4 transition-all active:scale-90',
              config[chave] === cor.id ? 'border-[#c8f542] scale-110' : 'border-zinc-800',
            ].join(' ')}
            style={{ backgroundColor: cor.hex }}
            title={cor.id}
          />
        ))}
      </div>
    </div>
  );

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between bg-[#0a0a0a]/95 backdrop-blur-md z-10 sticky top-0 border-b border-zinc-900">
        <button
          onClick={onVoltar}
          disabled={salvando}
          className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800"
        >
          <IconBack/>
        </button>
        <h1 className="text-lg font-black text-white">Seu Personagem</h1>
        <button
          onClick={salvar}
          disabled={salvando}
          className="text-[#c8f542] font-bold text-sm bg-[#c8f542]/10 px-4 py-2 rounded-xl active:bg-[#c8f542]/20 transition-colors disabled:opacity-50"
        >
          {salvando ? '...' : 'Salvar'}
        </button>
      </div>

      {/* Preview principal */}
      <div className="flex justify-center items-center py-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="w-40 h-40 rounded-full shadow-[0_0_40px_rgba(200,245,66,0.1)] border-4 border-zinc-800/80 overflow-hidden bg-zinc-900 flex items-center justify-center">
          {avatarUrl
            ? <img src={avatarUrl} alt="Avatar" className="w-[115%] h-[115%] object-contain mt-4"/>
            : <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#c8f542] animate-spin"/>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-zinc-900">
        {[
          { id:'cabelo', label:'Cabelo'  },
          { id:'rosto',  label:'Rosto'   },
          { id:'roupa',  label:'Roupa'   },
          { id:'cores',  label:'Cores'   },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={[
              'flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2',
              aba === id ? 'text-[#c8f542] border-[#c8f542]' : 'text-zinc-600 border-transparent active:text-zinc-400',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {aba === 'cabelo' && renderPreviews('top', 'Corte de Cabelo')}

        {aba === 'rosto' && (
          <>
            {renderPreviews('eyes', 'Olhos')}
            {renderPreviews('mouth', 'Boca')}
            {renderPreviews('accessories', 'Óculos / Acessórios')}
          </>
        )}

        {aba === 'roupa' && renderPreviews('clothes', 'Estilo da Roupa')}

        {aba === 'cores' && (
          <>
            {renderCores('skinColor', 'Tom de Pele')}
            <div className="h-px bg-zinc-900 my-2"/>
            {renderCores('hairColor', 'Cor do Cabelo')}
            <div className="h-px bg-zinc-900 my-2"/>
            {renderCores('clotheColor', 'Cor da Roupa')}
          </>
        )}
      </div>
    </div>
  );
}