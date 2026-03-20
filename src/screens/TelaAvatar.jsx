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

// ─── DOCUMENTAÇÃO OFICIAL: todos os campos usam HEX sem # ────────────────────
// skinColor:   hex sem #  → ex: 'edb98a'
// hairColor:   hex sem #  → ex: '2c1b18'
// clothesColor:hex sem #  → ex: 'a7ffc4'
// top:         string     → ex: 'shortFlat'
// eyes:        string     → ex: 'default'
// etc.

const OPCOES = {
  top: [
    'shortFlat','shortRound','shortWaved','shortCurly','sides',
    'straight01','straight02','bob','bun','curly','curvy',
    'dreads','fro','froBand','longButNotTooLong','miaWallace',
    'shavedSides','theCaesar','turban','winterHat1','hijab',
  ],
  eyes: ['default','happy','wink','winkWacky','surprised','squint','hearts','eyeRoll','closed','cry','side','xDizzy'],
  eyebrows: ['default','defaultNatural','flatNatural','frownNatural','raisedExcited','raisedExcitedNatural','sadConcerned','sadConcernedNatural','angry','angryNatural','upDown','upDownNatural','unibrowNatural'],
  mouth: ['smile','default','twinkle','serious','grimace','sad','concerned','disbelief','eating','tongue','screamOpen','vomit'],
  clothing: ['hoodie','shirtCrewNeck','shirtVNeck','shirtScoopNeck','collarAndSweater','blazerAndShirt','blazerAndSweater','overall','graphicShirt'],
  accessories: ['prescription01','prescription02','round','sunglasses','wayfarers','kurt','eyepatch'],
};

const LABELS = {
  top: { shortFlat:'Curto liso',shortRound:'Curto redondo',shortWaved:'Curto ondulado',shortCurly:'Curto cacheado',sides:'Lateral',straight01:'Liso 1',straight02:'Liso 2',bob:'Bob',bun:'Coque',curly:'Cacheado',curvy:'Ondulado',dreads:'Dreads',fro:'Afro',froBand:'Afro c/ faixa',longButNotTooLong:'Longo',miaWallace:'Mia Wallace',shavedSides:'Raspado lateral',theCaesar:'César',turban:'Turbante',winterHat1:'Gorro',hijab:'Hijab' },
  eyes: { default:'Normal',happy:'Feliz',wink:'Piscando',winkWacky:'Maluco',surprised:'Surpreso',squint:'Franzido',hearts:'Coração',eyeRoll:'Revirando',closed:'Fechado',cry:'Chorando',side:'Lateral',xDizzy:'Tonto' },
  eyebrows: { default:'Normal',defaultNatural:'Natural',flatNatural:'Reto natural',frownNatural:'Franzido',raisedExcited:'Levantado',raisedExcitedNatural:'Levant. natural',sadConcerned:'Preocupado',sadConcernedNatural:'Preoc. natural',angry:'Bravo',angryNatural:'Bravo natural',upDown:'Assimétrico',upDownNatural:'Assim. natural',unibrowNatural:'Unibrow' },
  mouth: { smile:'Sorriso',default:'Normal',twinkle:'Tímido',serious:'Sério',grimace:'Careta',sad:'Triste',concerned:'Preocupado',disbelief:'Descrente',eating:'Comendo',tongue:'Língua',screamOpen:'Grito',vomit:'Nojento' },
  clothing: { hoodie:'Moletom',shirtCrewNeck:'Camiseta',shirtVNeck:'Decote V',shirtScoopNeck:'Decote U',collarAndSweater:'Suéter',blazerAndShirt:'Blazer c/ camisa',blazerAndSweater:'Blazer c/ suéter',overall:'Macacão',graphicShirt:'Estampada' },
  accessories: { prescription01:'Óculos 1',prescription02:'Óculos 2',round:'Redondo',sunglasses:'Sol',wayfarers:'Wayfarer',kurt:'Kurt',eyepatch:'Tapa-olho' },
};

// ── Cores: salvas como HEX sem # (formato exigido pelo DiceBear v9) ──────────
const CORES = {
  skinColor: [
    { id:'ffdbb4', hex:'#FFDBB4', label:'Muito claro' },
    { id:'f8d25c', hex:'#F8D25C', label:'Amarelo'     },
    { id:'edb98a', hex:'#EDB98A', label:'Claro'       },
    { id:'fd9841', hex:'#FD9841', label:'Bronzeado'   },
    { id:'d08b5b', hex:'#D08B5B', label:'Marrom claro'},
    { id:'ae5d29', hex:'#AE5D29', label:'Marrom'      },
    { id:'614335', hex:'#614335', label:'Escuro'      },
  ],
  hairColor: [
    { id:'2c1b18', hex:'#2C1B18', label:'Preto'        },
    { id:'4a312c', hex:'#4A312C', label:'Castanho esc.' },
    { id:'724133', hex:'#724133', label:'Castanho'     },
    { id:'a55728', hex:'#A55728', label:'Ruivo'        },
    { id:'b58143', hex:'#B58143', label:'Mel'          },
    { id:'d6b370', hex:'#D6B370', label:'Loiro'        },
    { id:'e8e1e1', hex:'#E8E1E1', label:'Grisalho'    },
    { id:'ecdcbf', hex:'#ECDCBF', label:'Loiro claro' },
    { id:'f59797', hex:'#F59797', label:'Rosa'         },
    { id:'c93305', hex:'#C93305', label:'Vermelho'     },
  ],
  clothesColor: [
    { id:'262e33', hex:'#262E33', label:'Preto'        },
    { id:'929598', hex:'#929598', label:'Cinza'        },
    { id:'e6e6e6', hex:'#E6E6E6', label:'Branco'       },
    { id:'65c9ff', hex:'#65C9FF', label:'Azul claro'   },
    { id:'b1e2ff', hex:'#B1E2FF', label:'Azul pastel'  },
    { id:'a7ffc4', hex:'#A7FFC4', label:'Verde pastel' },
    { id:'ff5c5c', hex:'#FF5C5C', label:'Vermelho'     },
    { id:'ff488e', hex:'#FF488E', label:'Rosa'         },
    { id:'ffafb9', hex:'#FFAFB9', label:'Rosa claro'   },
    { id:'ffffb1', hex:'#FFFFB1', label:'Amarelo'      },
  ],
};

// ─── GERADOR ──────────────────────────────────────────────────────────────────
// REGRAS CRÍTICAS (documentação oficial DiceBear v9):
//  - skinColor, hairColor, clothesColor, accessoriesColor → hex SEM '#'
//  - top, eyes, mouth, clothing, eyebrows               → string normal
//  - topProbability: 100   → força o cabelo aparecer (padrão varia por seed)
//  - facialHairProbability: 0 → sem barba
//  - accessoriesProbability: 0 ou 100 conforme escolha
//  - seed FIXO → PRNG não muda; só os parâmetros explícitos definem o visual
const buildUrl = (cfg) => {
  try {
    return createAvatar(avataaars, {
      seed:          'volt',
      randomizeIds:  true,
      backgroundColor: ['transparent'],

      // Cabelo — topProbability:100 garante que apareça independente do seed
      top:              [cfg.top],
      topProbability:   100,
      hairColor:        [cfg.hairColor],   // hex sem #

      // Pele — hex sem #
      skinColor:        [cfg.skinColor],   // hex sem #

      // Rosto
      eyes:             [cfg.eyes],
      eyebrows:         [cfg.eyebrows],
      mouth:            [cfg.mouth],

      // Roupa — clothesColor (não clothingColor!)
      clothing:         [cfg.clothing],
      clothesColor:     [cfg.clothesColor], // hex sem #

      // Barba sempre desligada
      facialHairProbability: 0,

      // Acessórios
      accessoriesProbability: cfg.accessories === 'none' ? 0 : 100,
      ...(cfg.accessories !== 'none' && {
        accessories:      [cfg.accessories],
        accessoriesColor: ['262e33'],
      }),
    }).toDataUri();
  } catch (e) {
    console.error('buildUrl error:', e);
    return '';
  }
};

const buildPreview = (cfg, campo, valor) => buildUrl({ ...cfg, [campo]: valor });

// ─── CONFIG PADRÃO ────────────────────────────────────────────────────────────
const DEFAULT = {
  top: 'shortFlat',
  hairColor:    '2c1b18',   // hex sem #
  skinColor:    'edb98a',   // hex sem #
  clothing:     'hoodie',
  clothesColor: 'a7ffc4',  // hex sem #
  eyes:         'default',
  eyebrows:     'default',
  mouth:        'smile',
  accessories:  'none',
};

// Nomes antigos (ex: 'light', 'black') → mapeados para hex
const SKIN_NAME_TO_HEX  = { pale:'ffdbb4', light:'edb98a', yellow:'f8d25c', tanned:'fd9841', brown:'d08b5b', darkBrown:'ae5d29', black:'614335' };
const HAIR_NAME_TO_HEX  = { black:'2c1b18', brownDark:'4a312c', brown:'724133', auburn:'a55728', blonde:'d6b370', red:'c93305', silverGray:'e8e1e1', pastelPink:'f59797' };
const CLOTH_NAME_TO_HEX = { black:'262e33', gray02:'929598', white:'e6e6e6', blue02:'65c9ff', pastelBlue:'b1e2ff', pastelGreen:'a7ffc4', pastelRed:'ff5c5c', pink:'ff488e', red:'ff5c5c' };

const isHex6 = (s) => /^[0-9a-fA-F]{6}$/.test(s ?? '');

const parseConfig = (raw) => {
  try {
    if (!raw) return { ...DEFAULT };
    const p = JSON.parse(raw);

    const resolveSkin  = (v) => SKIN_NAME_TO_HEX[v]  || (isHex6(v) ? v.toLowerCase() : DEFAULT.skinColor);
    const resolveHair  = (v) => HAIR_NAME_TO_HEX[v]  || (isHex6(v) ? v.toLowerCase() : DEFAULT.hairColor);
    const resolveCloth = (v) => CLOTH_NAME_TO_HEX[v] || (isHex6(v) ? v.toLowerCase() : DEFAULT.clothesColor);

    return {
      top:          p.top                                      || DEFAULT.top,
      hairColor:    resolveHair(p.hairColor),
      skinColor:    resolveSkin(p.skinColor),
      clothing:     p.clothing    || p.clothes                || DEFAULT.clothing,
      clothesColor: resolveCloth(p.clothesColor || p.clothingColor || p.clotheColor),
      eyes:         p.eyes                                     || DEFAULT.eyes,
      eyebrows:     p.eyebrows                                 || DEFAULT.eyebrows,
      mouth:        p.mouth                                    || DEFAULT.mouth,
      accessories:  p.accessories                              || DEFAULT.accessories,
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

  // ── Grid de estilos ──────────────────────────────────────────────────────
  const renderPreviews = (campo, label, opcoes, comNenhum = false) => (
    <div className="mb-7">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {comNenhum && (
          <button
            onClick={() => set(campo, 'none')}
            className={['aspect-square rounded-2xl flex items-center justify-center border-2 transition-all bg-zinc-900',
              config[campo] === 'none' ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105' : 'border-zinc-800 opacity-70'].join(' ')}
          >
            <span className="text-zinc-500 text-xs font-bold">Nenhum</span>
          </button>
        )}
        {opcoes.map(valor => {
          const sel = config[campo] === valor;
          const url = buildPreview(config, campo, valor);
          return (
            <button
              key={valor}
              onClick={() => set(campo, valor)}
              className={['relative aspect-square rounded-2xl overflow-hidden flex flex-col bg-zinc-900 border-2 transition-all',
                sel ? 'border-[#c8f542] bg-[#c8f542]/10 scale-105 z-10' : 'border-zinc-800 opacity-60 active:opacity-100'].join(' ')}
            >
              {url && (
                <img src={url} alt={valor}
                  className="absolute inset-0 w-full h-full object-contain scale-[1.4] translate-y-3 pointer-events-none"
                  loading="lazy"
                />
              )}
              <span className="absolute bottom-0 left-0 right-0 text-[9px] font-bold text-zinc-400 py-1 px-1 truncate text-center bg-zinc-900/80">
                {LABELS[campo]?.[valor] ?? valor}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Swatches de cor (hex sem #) ──────────────────────────────────────────
  const renderCores = (campo, label) => (
    <div className="mb-5">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">{label}</p>
      <div className="flex flex-wrap gap-3">
        {CORES[campo].map(cor => (
          <button
            key={cor.id}
            onClick={() => set(campo, cor.id)}
            title={cor.label}
            className={['w-10 h-10 rounded-full border-4 transition-all active:scale-90',
              config[campo] === cor.id ? 'border-[#c8f542] scale-110' : 'border-zinc-800'].join(' ')}
            style={{ backgroundColor: cor.hex }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between bg-[#0a0a0a]/95 backdrop-blur-md z-10 sticky top-0 border-b border-zinc-900">
        <button onClick={onVoltar} disabled={salvando}
          className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800">
          <IconBack />
        </button>
        <h1 className="text-lg font-black text-white">Seu Personagem</h1>
        <button onClick={salvar} disabled={salvando}
          className="text-[#c8f542] font-bold text-sm bg-[#c8f542]/10 px-4 py-2 rounded-xl active:bg-[#c8f542]/20 transition-colors disabled:opacity-50">
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
        {[{id:'cabelo',label:'Cabelo'},{id:'rosto',label:'Rosto'},{id:'roupa',label:'Roupa'},{id:'cores',label:'Cores'}]
          .map(({ id, label }) => (
            <button key={id} onClick={() => setAba(id)}
              className={['flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2',
                aba === id ? 'text-[#c8f542] border-[#c8f542]' : 'text-zinc-600 border-transparent active:text-zinc-400'].join(' ')}>
              {label}
            </button>
          ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {aba === 'cabelo' && renderPreviews('top', 'Corte de Cabelo', OPCOES.top)}
        {aba === 'rosto' && <>
          {renderPreviews('eyes',        'Olhos',               OPCOES.eyes)}
          {renderPreviews('eyebrows',    'Sobrancelhas',        OPCOES.eyebrows)}
          {renderPreviews('mouth',       'Boca',                OPCOES.mouth)}
          {renderPreviews('accessories', 'Óculos / Acessórios', OPCOES.accessories, true)}
        </>}
        {aba === 'roupa' && renderPreviews('clothing', 'Estilo da Roupa', OPCOES.clothing)}
        {aba === 'cores' && <>
          {renderCores('skinColor',    'Tom de Pele'   )}
          <div className="h-px bg-zinc-900 my-2" />
          {renderCores('hairColor',    'Cor do Cabelo' )}
          <div className="h-px bg-zinc-900 my-2" />
          {renderCores('clothesColor', 'Cor da Roupa'  )}
        </>}
      </div>
    </div>
  );
}