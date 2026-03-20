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

// ─── OPÇÕES VÁLIDAS DO DICEBEAR AVATAAARS ────────────────────────────────────
const OPCOES = {
  top: [
    'shortFlat','shortRound','shortWaved','sides','straight01',
    'bob','bun','curly','dreads','fro','turban','winterHat1','shavedHead',
  ],
  eyes: ['default','happy','wink','surprised','squint','hearts','eyeRoll','closed'],
  eyebrows: ['default','defaultNatural','flatNatural','frownNatural','raised','sadConcerned','upDown','unibrow'],
  mouth: ['default','smile','twinkle','serious','grimace','sad'],
  clothing: [
    'hoodie','shirtCrewNeck','shirtVNeck',
    'collarAndSweater','blazerAndShirt','overall','graphicShirt',
  ],
  accessories: ['prescription01','prescription02','round','sunglasses','wayfarers'],
};

const LABELS = {
  top: {
    shortFlat:'Curto liso', shortRound:'Curto redondo', shortWaved:'Curto ondulado',
    sides:'Lateral', straight01:'Liso', bob:'Bob', bun:'Coque', curly:'Cacheado',
    dreads:'Dreads', fro:'Afro', turban:'Turbante', winterHat1:'Gorro', shavedHead:'Careca',
  },
  eyes: {
    default:'Normal', happy:'Feliz', wink:'Piscando', surprised:'Surpreso',
    squint:'Franzido', hearts:'Coração', eyeRoll:'Revirando', closed:'Fechado',
  },
  eyebrows: {
    default:'Normal', defaultNatural:'Natural', flatNatural:'Reto', frownNatural:'Franzido',
    raised:'Levantado', sadConcerned:'Triste', upDown:'Assimétrico', unibrow:'Unibrow',
  },
  mouth: { default:'Normal', smile:'Sorriso', twinkle:'Tímido', serious:'Sério', grimace:'Careta', sad:'Triste' },
  clothing: {
    hoodie:'Moletom', shirtCrewNeck:'Camiseta', shirtVNeck:'Decote V',
    collarAndSweater:'Suéter', blazerAndShirt:'Blazer', overall:'Macacão', graphicShirt:'Estampada',
  },
  accessories: {
    prescription01:'Óculos 1', prescription02:'Óculos 2',
    round:'Redondo', sunglasses:'Sol', wayfarers:'Wayfarer',
  },
};

const CORES = {
  skinColor: [
    { id:'pale',      hex:'#FFDBB4' },
    { id:'light',     hex:'#EDB98A' },
    { id:'yellow',    hex:'#F2C811' },
    { id:'tanned',    hex:'#FD9841' },
    { id:'brown',     hex:'#D08B5B' },
    { id:'darkBrown', hex:'#AE5D29' },
    { id:'black',     hex:'#614335' },
  ],
  hairColor: [
    { id:'black',      hex:'#262E33' },
    { id:'brownDark',  hex:'#4A3123' },
    { id:'brown',      hex:'#724133' },
    { id:'auburn',     hex:'#A55728' },
    { id:'blonde',     hex:'#D6B370' },
    { id:'red',        hex:'#C93305' },
    { id:'silverGray', hex:'#E8E1E1' },
    { id:'pastelPink', hex:'#F59797' },
  ],
  clothingColor: [
    { id:'black',       hex:'#262E33' },
    { id:'gray02',      hex:'#929598' },
    { id:'white',       hex:'#FFFFFF' },
    { id:'blue02',      hex:'#65C9FF' },
    { id:'pastelBlue',  hex:'#B1E2FF' },
    { id:'pastelGreen', hex:'#A7FFC4' },
    { id:'pastelRed',   hex:'#FFA7A7' },
    { id:'pink',        hex:'#FF488E' },
    { id:'red',         hex:'#FF5C5C' },
  ],
};

// ─── GERADOR DE AVATAR ────────────────────────────────────────────────────────
// CORREÇÕES APLICADAS:
//  1. seed FIXO 'volt' — o PRNG não muda nunca; só os parâmetros explícitos definem o visual
//  2. Cada campo passado como array de 1 item → probabilidade 100%, sem sorteio pelo PRNG
//  3. accessories: quando "none", usar accessoriesProbability:0 (não passar array vazio)
//  4. facialHair: sempre 'blank' + probability 0 → evita barba sorteada pelo PRNG
//  5. randomizeIds:true → evita colisão de IDs entre múltiplos SVGs na mesma página
const buildUrl = (cfg) => {
  try {
    return createAvatar(avataaars, {
      seed:          'volt',   // FIXO — nunca muda
      randomizeIds:  true,
      backgroundColor: ['transparent'],

      // Todos os campos obrigatórios como array de 1 item
      top:           [cfg.top],
      hairColor:     [cfg.hairColor],
      skinColor:     [cfg.skinColor],
      eyes:          [cfg.eyes],
      eyebrows:      [cfg.eyebrows],
      mouth:         [cfg.mouth],
      clothing:      [cfg.clothing],
      clothingColor: [cfg.clothingColor],

      // Barba sempre desligada
      facialHair:            ['blank'],
      facialHairProbability: 0,

      // Acessórios: probability 0 = sem óculos; 100 = mostra o modelo escolhido
      accessoriesProbability: cfg.accessories === 'none' ? 0 : 100,
      ...(cfg.accessories !== 'none' && { accessories: [cfg.accessories] }),
    }).toDataUri();
  } catch {
    return '';
  }
};

// Preview: estado atual com apenas UM campo diferente
const buildPreview = (cfg, campo, valor) => buildUrl({ ...cfg, [campo]: valor });

// ─── CONFIG PADRÃO / PARSE SEGURO ────────────────────────────────────────────
const DEFAULT = {
  top: 'shortFlat', hairColor: 'black', skinColor: 'light',
  clothing: 'hoodie', clothingColor: 'pastelGreen',
  eyes: 'default', eyebrows: 'default', mouth: 'smile', accessories: 'none',
};

const parseConfig = (raw) => {
  try {
    if (!raw) return { ...DEFAULT };
    const p   = JSON.parse(raw);
    const hex = (s) => /^[0-9A-Fa-f]{6}$/.test(s ?? '');
    return {
      top:           p.top                                          || DEFAULT.top,
      hairColor:     hex(p.hairColor)     ? DEFAULT.hairColor      : (p.hairColor     || DEFAULT.hairColor),
      skinColor:     hex(p.skinColor)     ? DEFAULT.skinColor      : (p.skinColor     || DEFAULT.skinColor),
      clothing:      p.clothing           || p.clothes             || DEFAULT.clothing,
      clothingColor: hex(p.clothingColor) ? DEFAULT.clothingColor  : (p.clothingColor || p.clotheColor || DEFAULT.clothingColor),
      eyes:          p.eyes                                         || DEFAULT.eyes,
      eyebrows:      p.eyebrows                                     || DEFAULT.eyebrows,
      mouth:         p.mouth                                        || DEFAULT.mouth,
      accessories:   p.accessories                                  || DEFAULT.accessories,
    };
  } catch {
    return { ...DEFAULT };
  }
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function TelaAvatar({ usuario, onVoltar, onSalvar, mostrarToast }) {
  const [config, setConfig]     = useState(() => parseConfig(usuario?.avatar_config));
  const [aba, setAba]           = useState('cabelo');
  const [salvando, setSalvando] = useState(false);

  const avatarUrl = useMemo(() => buildUrl(config), [config]);
  const set = (campo, valor) => setConfig(prev => ({ ...prev, [campo]: valor }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await apiFetch(R.editarUsuario || '/api/usuario/editar', {
        method: 'POST',
        body: {
          id_usuario: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          avatar_config: JSON.stringify(config),
        },
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

  // ── Grid de previews de estilo ────────────────────────────────────────────
  const renderPreviews = (campo, label, opcoes, exibirNenhum = false) => (
    <div className="mb-7">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-3">

        {exibirNenhum && (
          <button
            onClick={() => set(campo, 'none')}
            className={[
              'aspect-square rounded-2xl flex items-center justify-center border-2 transition-all bg-zinc-900',
              config[campo] === 'none'
                ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105'
                : 'border-zinc-800 opacity-70',
            ].join(' ')}
          >
            <span className="text-zinc-500 text-xs font-bold">Nenhum</span>
          </button>
        )}

        {opcoes.map(valor => {
          const selecionado = config[campo] === valor;
          const url = buildPreview(config, campo, valor);
          return (
            <button
              key={valor}
              onClick={() => set(campo, valor)}
              className={[
                'relative aspect-square rounded-2xl overflow-hidden flex flex-col items-end bg-zinc-900 border-2 transition-all',
                selecionado
                  ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105 z-10'
                  : 'border-zinc-800 opacity-60 active:opacity-100',
              ].join(' ')}
            >
              {url && (
                <img
                  src={url}
                  alt={valor}
                  className="absolute inset-0 w-full h-full object-contain scale-[1.4] translate-y-3 pointer-events-none"
                  loading="lazy"
                />
              )}
              <span className="relative z-10 text-[9px] font-bold text-zinc-400 py-1 px-1 truncate w-full text-center bg-zinc-900/75 mt-auto">
                {LABELS[campo]?.[valor] ?? valor}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Swatches de cor ────────────────────────────────────────────────────────
  const renderCores = (campo, label) => (
    <div className="mb-5">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="flex flex-wrap gap-3">
        {CORES[campo].map(cor => (
          <button
            key={cor.id}
            onClick={() => set(campo, cor.id)}
            title={cor.id}
            className={[
              'w-10 h-10 rounded-full border-4 transition-all active:scale-90',
              config[campo] === cor.id ? 'border-[#c8f542] scale-110' : 'border-zinc-800',
            ].join(' ')}
            style={{ backgroundColor: cor.hex }}
          />
        ))}
      </div>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between bg-[#0a0a0a]/95 backdrop-blur-md z-10 sticky top-0 border-b border-zinc-900">
        <button
          onClick={onVoltar}
          disabled={salvando}
          className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800"
        >
          <IconBack />
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
            ? <img src={avatarUrl} alt="Avatar" className="w-[115%] h-[115%] object-contain mt-4" />
            : <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#c8f542] animate-spin" />
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-zinc-900">
        {[
          { id:'cabelo', label:'Cabelo' },
          { id:'rosto',  label:'Rosto'  },
          { id:'roupa',  label:'Roupa'  },
          { id:'cores',  label:'Cores'  },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={[
              'flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2',
              aba === id
                ? 'text-[#c8f542] border-[#c8f542]'
                : 'text-zinc-600 border-transparent active:text-zinc-400',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">

        {aba === 'cabelo' && renderPreviews('top', 'Corte de Cabelo', OPCOES.top)}

        {aba === 'rosto' && (
          <>
            {renderPreviews('eyes',        'Olhos',                  OPCOES.eyes)}
            {renderPreviews('eyebrows',    'Sobrancelhas',           OPCOES.eyebrows)}
            {renderPreviews('mouth',       'Boca',                   OPCOES.mouth)}
            {renderPreviews('accessories', 'Óculos / Acessórios',    OPCOES.accessories, true)}
          </>
        )}

        {aba === 'roupa' && renderPreviews('clothing', 'Estilo da Roupa', OPCOES.clothing)}

        {aba === 'cores' && (
          <>
            {renderCores('skinColor',     'Tom de Pele'  )}
            <div className="h-px bg-zinc-900 my-2" />
            {renderCores('hairColor',     'Cor do Cabelo')}
            <div className="h-px bg-zinc-900 my-2" />
            {renderCores('clothingColor', 'Cor da Roupa' )}
          </>
        )}

      </div>
    </div>
  );
}