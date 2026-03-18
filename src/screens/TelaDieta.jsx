import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { ALIMENTOS_DB } from '../data/alimentosDB';

// ─── ícones ───────────────────────────────────────────────────────────────────
const IconBack     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconSearch   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const IconPlus     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IconX        = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconFlame    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#f97316]"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>;
const IconTrash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconClock    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>;
const IconProteina = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.828 10.828L15.07 15.07m-9.9-9.9l4.243 4.243m.707 1.414l-4.243 4.243a2 2 0 000 2.828l2.828 2.828a2 2 0 002.828 0l4.243-4.243m-5.657-5.657l4.243-4.243a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-4.243 4.243"/></svg>;
const IconCarbo    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12M12 12C12 6.5 16.5 2 22 2c0 5.5-4.5 10-10 10zM12 12C12 6.5 7.5 2 2 2c0 5.5 4.5 10 10 10z"/></svg>;
const IconGordura  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>;
const IconLaticinios = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h10v12a4 4 0 01-8 0V4zM16 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2"/></svg>;
const IconFrutas   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M15.5 6A6.5 6.5 0 1112 21a6.5 6.5 0 013.5-15z"/></svg>;
const IconCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

// ─── NumInput para gramas (polegar-friendly) ──────────────────────────────────
function GramasInput({ value, onChange }) {
  const [txt, setTxt] = useState(String(value || ''));
  const ref = useRef(null);
  const num = parseFloat(String(value)) || 0;

  useEffect(() => {
    if (document.activeElement !== ref.current) setTxt(String(value || ''));
  }, [value]);

  const confirmar = () => {
    const n = parseFloat(txt.replace(',', '.'));
    if (!isNaN(n) && n > 0) { onChange(n); setTxt(String(n)); }
    else { setTxt(String(value || '')); }
  };

  const step = num >= 200 ? 50 : num >= 100 ? 25 : 10;

  const dec = (e) => {
    e.stopPropagation();
    const novo = Math.max(1, num - step);
    onChange(novo); setTxt(String(novo));
  };
  const inc = (e) => {
    e.stopPropagation();
    const novo = num + step;
    onChange(novo); setTxt(String(novo));
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-zinc-700 bg-black">
      <div className="pt-3 pb-1 text-center">
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Quantidade</span>
      </div>
      <div className="flex items-stretch">
        <button
          onPointerDown={dec}
          className="flex-1 flex items-center justify-center py-5 active:bg-zinc-800 select-none touch-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="text-white text-3xl font-light leading-none select-none">−</span>
        </button>
        <div className="w-px bg-zinc-800 my-2 flex-shrink-0"/>
        <div className="flex-[2] flex items-center justify-center relative">
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            value={txt}
            onChange={e => setTxt(e.target.value)}
            onBlur={confirmar}
            onFocus={e => e.target.select()}
            onKeyDown={e => e.key === 'Enter' && ref.current?.blur()}
            autoFocus
            placeholder="0"
            className="w-full text-center text-4xl font-black bg-transparent outline-none text-[#c8f542] py-4 num"
            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
        </div>
        <div className="w-px bg-zinc-800 my-2 flex-shrink-0"/>
        <button
          onPointerDown={inc}
          className="flex-1 flex items-center justify-center py-5 active:bg-zinc-800 select-none touch-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="text-white text-3xl font-light leading-none select-none">+</span>
        </button>
      </div>
      <div className="pb-2 text-center">
        <span className="text-zinc-500 text-sm font-semibold">gramas</span>
      </div>
    </div>
  );
}

export default function TelaDieta({ usuario, onVoltar, mostrarToast }) {
  const [refeicoes, setRefeicoes]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [abaPrincipal, setAbaPrincipal] = useState('hoje');
  const [resumoSemanal, setResumoSemanal]   = useState([]);
  const [loadingSemana, setLoadingSemana]   = useState(false);

  const [modalBusca, setModalBusca]               = useState(false);
  const [termoBusca, setTermoBusca]               = useState('');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
  const [itemParaExcluir, setItemParaExcluir]     = useState(null);
  const [gramas, setGramas]                       = useState(100);
  const [salvando, setSalvando]                   = useState(false);
  const inputBuscaRef = useRef(null);

  const [recentes, setRecentes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alimentos_recentes')) || []; }
    catch { return []; }
  });
  const [abaAtiva, setAbaAtiva] = useState('recentes');
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const categoriasPopulares = useMemo(() => {
    const buscar = (termos) => {
      const itens = [];
      termos.forEach(termo => {
        const encontrado = ALIMENTOS_DB.find(a => a.nome.toLowerCase().includes(termo.toLowerCase()));
        if (encontrado && !itens.some(i => i.id === encontrado.id)) itens.push(encontrado);
      });
      return itens;
    };
    return [
      { id: 'proteinas',  nome: 'Proteínas',    icone: <IconProteina/>,  itens: buscar(['frango', 'ovo', 'patinho bovino', 'whey', 'peito de peru']) },
      { id: 'carbos',     nome: 'Carboidratos', icone: <IconCarbo/>,     itens: buscar(['arroz branco', 'tapioca', 'batata doce', 'pão francês', 'aveia']) },
      { id: 'gorduras',   nome: 'Gorduras',     icone: <IconGordura/>,   itens: buscar(['azeite de oliva', 'abacate', 'castanha', 'amendoim', 'manteiga']) },
      { id: 'laticinios', nome: 'Laticínios',   icone: <IconLaticinios/>,itens: buscar(['leite integral', 'mussarela', 'iogurte', 'requeijão', 'queijo prato']) },
      { id: 'frutas',     nome: 'Frutas',       icone: <IconFrutas/>,    itens: buscar(['banana', 'maçã', 'mamão', 'melancia', 'laranja']) },
    ];
  }, []);

  useEffect(() => {
    if (modalBusca) setAbaAtiva(recentes.length > 0 ? 'recentes' : 'proteinas');
  }, [modalBusca, recentes.length]);

  useEffect(() => {
    apiFetch(`${R.dietaRegistro}?id_usuario=${usuario.id}&data=${hoje}`)
      .then(r => setRefeicoes(r.registros || []))
      .catch(() => mostrarToast('Erro ao carregar dieta', 'erro'))
      .finally(() => setLoading(false));
  }, [usuario.id, hoje, mostrarToast]);

  useEffect(() => {
    if (abaPrincipal !== 'semana') return;
    setLoadingSemana(true);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    Promise.all(
      dias.map(data =>
        apiFetch(`${R.dietaRegistro}?id_usuario=${usuario.id}&data=${data}`)
          .then(r => ({ data, registros: r.registros || [] }))
          .catch(() => ({ data, registros: [] }))
      )
    ).then(results => {
      setResumoSemanal(results.map(({ data, registros }) => {
        const totais = registros.reduce((acc, ref) => ({
          kcal:     acc.kcal     + (parseInt( ref.Calorias    || ref.calorias    ) || 0),
          proteina: acc.proteina + (parseFloat(ref.Proteinas_g || ref.proteinas_g) || 0),
          carbo:    acc.carbo    + (parseFloat(ref.Carbos_g    || ref.carbos_g   ) || 0),
          gordura:  acc.gordura  + (parseFloat(ref.Gorduras_g  || ref.gorduras_g ) || 0),
        }), { kcal: 0, proteina: 0, carbo: 0, gordura: 0 });
        return { data, ...totais };
      }));
    }).finally(() => setLoadingSemana(false));
  }, [abaPrincipal, usuario.id]);

  const metas = useMemo(() => {
    const peso   = parseFloat(usuario.peso_atual) || 70;
    const altura = parseFloat(usuario.altura) || 170;
    const idade  = parseInt(usuario.idade) || 25;
    const genero = usuario.genero === 'F' ? 'F' : 'M';
    const obj    = usuario.objetivo || 'Manutencao';
    let tmb = (10 * peso) + (6.25 * altura) - (5 * idade);
    tmb += (genero === 'M') ? 5 : -161;
    const fatoresAtividade = { sedentario: 1.2, leve: 1.375, moderado: 1.55, ativo: 1.725, muito_ativo: 1.9 };
    let metaKcal = tmb * (fatoresAtividade[usuario.atividade] || 1.375);
    if (obj === 'Emagrecimento') metaKcal -= 400;
    if (obj === 'Hipertrofia')   metaKcal += 300;
    const protPorKg    = obj === 'Emagrecimento' ? 2.2 : obj === 'Hipertrofia' ? 2.0 : 1.8;
    const metaProteina = Math.round(peso * protPorKg);
    const metaGordura  = Math.round(peso * 1.0);
    const metaCarbo    = Math.round((metaKcal - metaProteina * 4 - metaGordura * 9) / 4);
    return { kcal: Math.round(metaKcal), proteina: metaProteina, carbo: Math.max(metaCarbo, 50), gordura: metaGordura };
  }, [usuario]);

  const consumido = useMemo(() => refeicoes.reduce((acc, ref) => ({
    kcal:     acc.kcal     + (parseInt( ref.Calorias    || ref.calorias    ) || 0),
    proteina: acc.proteina + (parseFloat(ref.Proteinas_g || ref.proteinas_g) || 0),
    carbo:    acc.carbo    + (parseFloat(ref.Carbos_g    || ref.carbos_g   ) || 0),
    gordura:  acc.gordura  + (parseFloat(ref.Gorduras_g  || ref.gorduras_g ) || 0),
  }), { kcal: 0, proteina: 0, carbo: 0, gordura: 0 }), [refeicoes]);

  const progressoKcal = Math.min((consumido.kcal     / metas.kcal)     * 100, 100);
  const progressoProt = Math.min((consumido.proteina / metas.proteina) * 100, 100);
  const progressoCarb = Math.min((consumido.carbo    / metas.carbo)    * 100, 100);
  const progressoGord = Math.min((consumido.gordura  / metas.gordura)  * 100, 100);

  const resultadosBusca = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (termo.length < 2) return [];
    return ALIMENTOS_DB.filter(a => a.nome.toLowerCase().includes(termo)).slice(0, 40);
  }, [termoBusca]);

  const salvarRefeicao = async () => {
    const g = parseFloat(gramas);
    if (!g || g <= 0) return mostrarToast('Digite uma quantidade válida.', 'erro');
    setSalvando(true);
    const mult          = g / 100;
    const novaRefeicao  = {
      id_registro:   `D${Date.now()}`,
      id_usuario:    String(usuario.id),
      data:          hoje,
      tipo_refeicao: `${alimentoSelecionado.nome} (${g}g)`,
      calorias:      Math.round(alimentoSelecionado.kcal * mult),
      proteinas_g:   Math.round(alimentoSelecionado.proteina * mult * 10) / 10,
      carbos_g:      Math.round(alimentoSelecionado.carbo    * mult * 10) / 10,
      gorduras_g:    Math.round(alimentoSelecionado.gordura  * mult * 10) / 10,
      check_agua: '', check_whey: '', check_creatina: '',
    };
    try {
      await apiFetch(R.dietaRegistro, { method: 'POST', body: novaRefeicao });
      const novosRecentes = [alimentoSelecionado, ...recentes.filter(r => r.id !== alimentoSelecionado.id)].slice(0, 10);
      setRecentes(novosRecentes);
      localStorage.setItem('alimentos_recentes', JSON.stringify(novosRecentes));
      setRefeicoes(prev => [...prev, {
        ID_Registro:   novaRefeicao.id_registro,
        Tipo_Refeicao: novaRefeicao.tipo_refeicao,
        Calorias:      novaRefeicao.calorias,
        Proteinas_g:   novaRefeicao.proteinas_g,
        Carbos_g:      novaRefeicao.carbos_g,
        Gorduras_g:    novaRefeicao.gorduras_g,
      }]);
      mostrarToast('Refeição adicionada.', 'sucesso');
      fecharBusca();
    } catch {
      mostrarToast('Erro ao salvar. Verifique a conexão.', 'erro');
    } finally { setSalvando(false); }
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    const id = itemParaExcluir.ID_Registro || itemParaExcluir.id_registro;
    try {
      await apiFetch(`${R.dietaRegistro}?id_registro=${id}`, { method: 'DELETE' });
      setRefeicoes(prev => prev.filter(r => r.ID_Registro !== id && r.id_registro !== id));
      mostrarToast('Alimento removido.', 'sucesso');
    } catch { mostrarToast('Erro ao remover.', 'erro'); }
    finally { setItemParaExcluir(null); }
  };

  const fecharBusca = () => {
    setModalBusca(false);
    setAlimentoSelecionado(null);
    setTermoBusca('');
    setGramas(100);
    setAbaAtiva(recentes.length > 0 ? 'recentes' : 'proteinas');
  };

  // preview calculado a partir do state `gramas`
  // declarado ANTES de renderizarAlimento para evitar acesso antes da definição
  const preview = alimentoSelecionado && gramas > 0 ? {
    kcal:  Math.round(alimentoSelecionado.kcal    * (gramas / 100)),
    prot:  Math.round(alimentoSelecionado.proteina * (gramas / 100) * 10) / 10,
    carbo: Math.round(alimentoSelecionado.carbo    * (gramas / 100) * 10) / 10,
    gord:  Math.round(alimentoSelecionado.gordura  * (gramas / 100) * 10) / 10,
  } : { kcal: 0, prot: '0', carbo: '0', gord: '0' };

  const renderizarAlimento = (a) => (
    <button key={a.id} onClick={() => { setAlimentoSelecionado(a); setGramas(100); }}
      className="w-full text-left bg-zinc-900 border border-zinc-800 active:border-[#c8f542]/40 active:bg-[#c8f542]/5 rounded-2xl p-4 mb-3 flex flex-col gap-2">
      <div className="flex justify-between items-start gap-3">
        <p className="text-white font-bold text-sm leading-tight">{a.nome}</p>
        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
          <IconPlus/>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
        <span className="text-[#f97316] bg-[#f97316]/10 px-2 py-0.5 rounded-md">{a.kcal} kcal</span>
        <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">{a.proteina}g P</span>
        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">{a.carbo}g C</span>
        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">{a.gordura}g G</span>
        <span className="text-zinc-600 ml-auto">por 100g</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">

      {/* header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={onVoltar}
          className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Dieta & Macros</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Alvo adaptado p/ {usuario.objetivo}</p>
        </div>
      </div>

      {/* abas hoje / semana */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 gap-1">
          {[
            { id: 'hoje',   label: 'Hoje',          icon: <IconFlame/> },
            { id: 'semana', label: 'Últimos 7 dias', icon: <IconCalendar/> },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setAbaPrincipal(id)}
              className={`btn flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${abaPrincipal === id ? 'bg-[#c8f542] text-black' : 'text-zinc-500'}`}>
              <span className={abaPrincipal === id ? 'text-black' : 'text-zinc-600'}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 flex flex-col gap-5">

        {/* ── ABA HOJE ── */}
        {abaPrincipal === 'hoje' && (<>

          {/* card calorias */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <IconFlame/>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Calorias</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white font-black text-4xl num tracking-tight">{consumido.kcal}</span>
                  <span className="text-zinc-500 text-sm font-semibold">/ {metas.kcal} kcal</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${consumido.kcal > metas.kcal ? 'bg-red-500/10 text-red-500' : 'bg-[#c8f542]/10 text-[#c8f542]'}`}>
                {consumido.kcal > metas.kcal ? 'Passou ' : 'Faltam '}
                {Math.abs(metas.kcal - consumido.kcal)}
              </span>
            </div>
            <div className="w-full h-3.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${consumido.kcal > metas.kcal ? 'bg-red-500' : 'bg-[#c8f542]'}`}
                style={{ width: `${progressoKcal}%` }}
              />
            </div>
          </div>

          {/* card macros */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Macronutrientes</p>
            {[
              { icon: <IconProteina/>, label: 'Proteína',     val: consumido.proteina, meta: metas.proteina, pct: progressoProt, cor: 'bg-blue-500' },
              { icon: <IconCarbo/>,   label: 'Carboidratos', val: consumido.carbo,    meta: metas.carbo,    pct: progressoCarb, cor: 'bg-emerald-500' },
              { icon: <IconGordura/>, label: 'Gorduras',      val: consumido.gordura,  meta: metas.gordura,  pct: progressoGord, cor: 'bg-amber-400' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-center gap-1.5">
                    {m.icon}
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{m.label}</span>
                  </div>
                  <span className="text-white font-black text-sm num">
                    {Math.round(m.val * 10) / 10}
                    <span className="text-zinc-500 font-semibold"> / {m.meta} g</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${m.cor} transition-all duration-1000 rounded-full`} style={{ width: `${m.pct}%` }}/>
                </div>
              </div>
            ))}
          </div>

          {/* botão adicionar */}
          <button onClick={() => setModalBusca(true)}
            className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl flex items-center justify-center gap-2">
            <IconPlus/> Adicionar alimento
          </button>

          {/* lista de hoje */}
          <div>
            <h2 className="text-white font-bold text-base mb-3">Consumido hoje</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#c8f542] rounded-full animate-spin"/>
              </div>
            ) : refeicoes.length === 0 ? (
              <div className="text-center py-10 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-500 text-sm">Nenhum registro ainda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {refeicoes.map((ref, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight truncate">
                        {ref.Tipo_Refeicao || ref.tipo_refeicao}
                      </p>
                      <div className="flex gap-2 flex-wrap mt-1.5">
                        <span className="text-blue-400 text-xs font-semibold bg-blue-500/10 px-2 py-0.5 rounded-lg">
                          {ref.Proteinas_g || ref.proteinas_g}g P
                        </span>
                        <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                          {ref.Carbos_g || ref.carbos_g || 0}g C
                        </span>
                        <span className="text-amber-400 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-lg">
                          {ref.Gorduras_g || ref.gorduras_g || 0}g G
                        </span>
                      </div>
                    </div>
                    {/* kcal + delete */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[#c8f542] font-black text-lg num leading-none">{ref.Calorias || ref.calorias}</p>
                        <p className="text-zinc-600 text-xs">kcal</p>
                      </div>
                      {/* botão delete maior */}
                      <button
                        onClick={() => setItemParaExcluir(ref)}
                        className="w-11 h-11 bg-red-500/10 active:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center"
                      >
                        <IconTrash/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>)}

        {/* ── ABA SEMANA ── */}
        {abaPrincipal === 'semana' && (
          <div className="flex flex-col gap-4">
            {loadingSemana ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#c8f542] rounded-full animate-spin"/>
              </div>
            ) : (() => {
              const diasComDados = resumoSemanal.filter(d => d.kcal > 0);
              const media = diasComDados.length > 0 ? {
                kcal:     Math.round(diasComDados.reduce((a, d) => a + d.kcal, 0)     / diasComDados.length),
                proteina: Math.round(diasComDados.reduce((a, d) => a + d.proteina, 0) / diasComDados.length * 10) / 10,
                carbo:    Math.round(diasComDados.reduce((a, d) => a + d.carbo, 0)    / diasComDados.length * 10) / 10,
                gordura:  Math.round(diasComDados.reduce((a, d) => a + d.gordura, 0)  / diasComDados.length * 10) / 10,
              } : null;

              return (<>
                {/* cards média */}
                {media ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                      Média diária — {diasComDados.length} dia{diasComDados.length !== 1 ? 's' : ''} com registro
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Calorias',    value: `${media.kcal}`,      unit: 'kcal', cor: 'text-[#f97316]', bg: 'bg-[#f97316]/10' },
                        { label: 'Proteína',    value: `${media.proteina}g`, unit: '',     cor: 'text-blue-400',  bg: 'bg-blue-500/10'  },
                        { label: 'Carboidrato', value: `${media.carbo}g`,    unit: '',     cor: 'text-emerald-400',bg:'bg-emerald-500/10'},
                        { label: 'Gordura',     value: `${media.gordura}g`,  unit: '',     cor: 'text-amber-400', bg: 'bg-amber-500/10' },
                      ].map(x => (
                        <div key={x.label} className={`${x.bg} border border-zinc-800/50 rounded-2xl p-4 text-center`}>
                          <div className={`font-black text-xl num ${x.cor}`}>{x.value}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">{x.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                    <p className="text-zinc-500 text-sm">Nenhum registro nos últimos 7 dias.</p>
                  </div>
                )}

                {/* cards por dia — substituindo a tabela densa */}
                <div className="flex flex-col gap-2">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-1">Por dia</p>
                  {resumoSemanal.map((d, i) => {
                    const dt     = new Date(d.data + 'T00:00:00');
                    const ehHoje = d.data === hoje;
                    const diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'short' });
                    const diaMes    = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                    return (
                      <div key={i} className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
                        ehHoje ? 'bg-[#c8f542]/5 border-[#c8f542]/20' : 'bg-zinc-900 border-zinc-800'
                      }`}>
                        {/* data */}
                        <div className="w-14 flex-shrink-0 text-center">
                          <div className={`text-xs font-bold capitalize ${ehHoje ? 'text-[#c8f542]' : 'text-zinc-500'}`}>
                            {ehHoje ? 'Hoje' : diaSemana}
                          </div>
                          {!ehHoje && <div className="text-zinc-600 text-xs">{diaMes}</div>}
                        </div>

                        {d.kcal > 0 ? (
                          <>
                            {/* kcal em destaque */}
                            <div className="flex-shrink-0 text-right min-w-[56px]">
                              <span className="text-[#f97316] font-black text-base num">{d.kcal}</span>
                              <span className="text-zinc-600 text-xs ml-1">kcal</span>
                            </div>
                            {/* macros como pills */}
                            <div className="flex-1 flex items-center gap-1.5 flex-wrap justify-end">
                              <span className="text-blue-400 text-xs font-semibold bg-blue-500/10 px-2 py-0.5 rounded-lg">
                                {Math.round(d.proteina)}g P
                              </span>
                              <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                                {Math.round(d.carbo)}g C
                              </span>
                              <span className="text-amber-400 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                {Math.round(d.gordura)}g G
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 text-right">
                            <span className="text-zinc-700 text-sm">sem registro</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>);
            })()}
          </div>
        )}
      </div>

      {/* ── modal confirmar exclusão ── */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex flex-col justify-end" onClick={() => setItemParaExcluir(null)}>
          <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6"/>
            <h3 className="text-white font-black text-xl mb-2 text-center">Remover alimento?</h3>
            <p className="text-zinc-400 text-sm mb-8 text-center leading-relaxed">
              <strong className="text-white">{itemParaExcluir.Tipo_Refeicao || itemParaExcluir.tipo_refeicao}</strong>
              <br/>será removido do diário de hoje.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setItemParaExcluir(null)}
                className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">
                Cancelar
              </button>
              <button onClick={confirmarExclusao}
                className="btn flex-1 py-4 bg-red-500/10 text-red-500 active:bg-red-500/20 font-bold rounded-2xl">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal buscar alimento ── */}
      {modalBusca && (
        <div
          className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* barra de busca */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <button onClick={fecharBusca}
              className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
              <IconBack/>
            </button>
            <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-1 focus-within:border-[#c8f542] transition-colors">
              <div className="text-zinc-500"><IconSearch/></div>
              <input
                ref={inputBuscaRef}
                type="text"
                placeholder="Ex: Frango, Arroz..."
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                className="flex-1 bg-transparent text-white px-3 py-3 outline-none text-base placeholder-zinc-600"
              />
              {termoBusca && (
                <button onClick={() => { setTermoBusca(''); setAbaAtiva(recentes.length > 0 ? 'recentes' : 'proteinas'); }} className="text-zinc-500 active:text-white p-2 -mr-2">
                  <IconX/>
                </button>
              )}
            </div>
          </div>

          {/* resultados ou categorias */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {termoBusca.trim().length > 0 ? (
              <div className="px-4 py-4">
                {termoBusca.trim().length === 1 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">Digite pelo menos 2 letras...</div>
                ) : resultadosBusca.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">Alimento não encontrado.</div>
                ) : (
                  <>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">
                      {resultadosBusca.length} resultado{resultadosBusca.length !== 1 ? 's' : ''}
                    </p>
                    {resultadosBusca.map(renderizarAlimento)}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* abas categorias — scroll horizontal */}
                <div
                  className="overflow-x-auto sticky top-0 bg-[#0a0a0a] z-10 border-b border-zinc-900"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex flex-nowrap w-max gap-2 px-4 py-3">
                    {recentes.length > 0 && (
                      <button onClick={() => setAbaAtiva('recentes')}
                        className={`flex-none inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${abaAtiva === 'recentes' ? 'bg-[#c8f542] text-black border-[#c8f542]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                        <span className={abaAtiva === 'recentes' ? 'text-black' : 'text-zinc-500'}><IconClock/></span>
                        Recentes
                      </button>
                    )}
                    {categoriasPopulares.map(cat => (
                      <button key={cat.id} onClick={() => setAbaAtiva(cat.id)}
                        className={`flex-none inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${abaAtiva === cat.id ? 'bg-[#c8f542] text-black border-[#c8f542]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                        <span className={abaAtiva === cat.id ? 'text-black' : 'text-zinc-500'}>{cat.icone}</span>
                        {cat.nome}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-4 flex-1">
                  {abaAtiva === 'recentes' && (
                    <>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Recentes</p>
                      {recentes.map(renderizarAlimento)}
                    </>
                  )}
                  {abaAtiva !== 'recentes' && (
                    categoriasPopulares.find(c => c.id === abaAtiva)?.itens.map(renderizarAlimento)
                  )}
                  <div className="mt-4 mb-8 bg-zinc-900/30 border border-dashed border-zinc-800/50 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600 mb-3">
                      <IconSearch/>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">Explore a base completa</h4>
                    <p className="text-zinc-500 text-xs mb-5 max-w-[240px]">Use a pesquisa para encontrar qualquer alimento.</p>
                    <button onClick={() => inputBuscaRef.current?.focus()}
                      className="btn px-6 py-3 bg-zinc-800 active:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                      Pesquisar alimento
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── bottom sheet: alimento selecionado ── */}
          {alimentoSelecionado && (
            <div
              className="absolute inset-0 bg-black/80 flex flex-col justify-end z-[60]"
              onClick={() => setAlimentoSelecionado(null)}
            >
              <div
                className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-5 pt-5 pb-8 slide-up"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-5"/>

                {/* nome do alimento */}
                <h3 className="text-white font-black text-xl mb-0.5 pr-4 leading-tight">
                  {alimentoSelecionado.nome}
                </h3>
                <p className="text-zinc-500 text-sm mb-5">Qual a quantidade consumida?</p>

                {/* input de gramas — polegar-friendly */}
                <div className="mb-5">
                  <GramasInput value={gramas} onChange={setGramas}/>
                </div>

                {/* preview dos macros calculados */}
                <div className="bg-zinc-800/40 border border-zinc-800/80 rounded-2xl p-4 mb-5">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Total a adicionar</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: preview.kcal,  u: 'kcal', c: 'text-[#f97316]' },
                      { v: `${preview.prot}g`,  u: 'Prot',  c: 'text-blue-400' },
                      { v: `${preview.carbo}g`, u: 'Carbo', c: 'text-emerald-400' },
                      { v: `${preview.gord}g`,  u: 'Gord',  c: 'text-amber-400' },
                    ].map((x, i) => (
                      <div key={i} className="text-center">
                        <p className={`${x.c} font-black text-lg num leading-none`}>{x.v}</p>
                        <p className="text-zinc-500 text-xs mt-1">{x.u}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ações */}
                <div className="flex gap-3">
                  <button onClick={() => setAlimentoSelecionado(null)}
                    className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">
                    Cancelar
                  </button>
                  <button onClick={salvarRefeicao} disabled={salvando}
                    className="btn flex-[2] py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {salvando
                      ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
                      : <IconPlus/>}
                    {salvando ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}