import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '../auth';
import { ALIMENTOS_DB } from '../data/alimentosDB';

// ─── ÍCONES PADRÃO ──────────────────────────────────────────────────────────
const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const IconPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IconX = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconFlame = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#f97316]"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
const IconTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// ─── ÍCONES DAS CATEGORIAS ──────────────────────────────────────────────────
const IconClock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>;
const IconProteina = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.828 10.828L15.07 15.07m-9.9-9.9l4.243 4.243m.707 1.414l-4.243 4.243a2 2 0 000 2.828l2.828 2.828a2 2 0 002.828 0l4.243-4.243m-5.657-5.657l4.243-4.243a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-4.243 4.243"/></svg>;
const IconCarbo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12M12 12C12 6.5 16.5 2 22 2c0 5.5-4.5 10-10 10zM12 12C12 6.5 7.5 2 2 2c0 5.5 4.5 10 10 10z"/></svg>;
const IconGordura = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>;
const IconLaticinios = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4h10v12a4 4 0 01-8 0V4zM16 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2"/></svg>;
const IconFrutas = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M15.5 6A6.5 6.5 0 1112 21a6.5 6.5 0 013.5-15z"/></svg>;

export default function TelaDieta({ usuario, onVoltar, mostrarToast }) {
  const [refeicoes, setRefeicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalBusca, setModalBusca] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
  
  // NOVO ESTADO: Controla qual item vai ser excluído
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const [gramas, setGramas] = useState('');
  const [salvando, setSalvando] = useState(false);
  const inputBuscaRef = useRef(null);

  const [recentes, setRecentes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alimentos_recentes')) || []; } 
    catch { return []; }
  });

  const [abaAtiva, setAbaAtiva] = useState('recentes');
  const hoje = new Date().toISOString().slice(0, 10);

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
      { id: 'proteinas', nome: 'Proteínas', icone: <IconProteina/>, itens: buscar(['frango', 'ovo', 'patinho bovino', 'whey', 'peito de peru']) },
      { id: 'carbos', nome: 'Carboidratos', icone: <IconCarbo/>, itens: buscar(['arroz branco', 'tapioca', 'batata doce', 'pão francês', 'aveia']) },
      { id: 'gorduras', nome: 'Gorduras', icone: <IconGordura/>, itens: buscar(['azeite de oliva', 'abacate', 'castanha', 'amendoim', 'manteiga']) },
      { id: 'laticinios', nome: 'Laticínios', icone: <IconLaticinios/>, itens: buscar(['leite integral', 'mussarela', 'iogurte', 'requeijão', 'queijo prato']) },
      { id: 'frutas', nome: 'Frutas', icone: <IconFrutas/>, itens: buscar(['banana', 'maçã', 'mamão', 'melancia', 'laranja']) },
    ];
  }, []);

  useEffect(() => {
    if (modalBusca) {
      setAbaAtiva(recentes.length > 0 ? 'recentes' : 'proteinas');
    }
  }, [modalBusca, recentes.length]);

  useEffect(() => {
    apiFetch(`/api/dieta/registro?id_usuario=${usuario.id}&data=${hoje}`)
      .then(r => setRefeicoes(r.registros || []))
      .catch(() => mostrarToast('Erro ao carregar dieta', 'erro'))
      .finally(() => setLoading(false));
  }, [usuario.id, hoje, mostrarToast]);

  const metas = useMemo(() => {
    const peso   = parseFloat(usuario.peso_atual) || 70;
    const altura = parseFloat(usuario.altura) || 170;
    const idade  = parseInt(usuario.idade) || 25;
    const genero = usuario.genero === 'F' ? 'F' : 'M';
    const obj    = usuario.objetivo || 'Manutencao';

    let tmb = (10 * peso) + (6.25 * altura) - (5 * idade);
    tmb += (genero === 'M') ? 5 : -161;
    let metaKcal = tmb * 1.55;

    if (obj === 'Emagrecimento') metaKcal -= 500;
    if (obj === 'Hipertrofia') metaKcal += 500;

    return {
      kcal: Math.round(metaKcal),
      proteina: Math.round(peso * 2.0),
    };
  }, [usuario]);

  const consumido = useMemo(() => {
    return refeicoes.reduce((acc, ref) => ({
      kcal: acc.kcal + (parseInt(ref.Calorias || ref.calorias) || 0),
      proteina: acc.proteina + (parseFloat(ref.Proteinas_g || ref.proteinas_g) || 0),
    }), { kcal: 0, proteina: 0 });
  }, [refeicoes]);

  const progressoKcal = Math.min((consumido.kcal / metas.kcal) * 100, 100);
  const progressoProt = Math.min((consumido.proteina / metas.proteina) * 100, 100);

  const resultadosBusca = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (termo.length < 2) return [];
    return ALIMENTOS_DB.filter(a => a.nome.toLowerCase().includes(termo)).slice(0, 40);
  }, [termoBusca]);

  const salvarRefeicao = async () => {
    const g = parseFloat(gramas);
    if (!g || g <= 0) return mostrarToast('Digite uma quantidade válida.', 'erro');
    
    setSalvando(true);
    const mult = g / 100;
    const kcalCalculada = Math.round(alimentoSelecionado.kcal * mult);
    const protCalculada = Math.round(alimentoSelecionado.proteina * mult * 10) / 10;

    const novaRefeicao = {
      id_registro: `D${Date.now()}`,
      id_usuario: String(usuario.id),
      data: hoje,
      tipo_refeicao: `${alimentoSelecionado.nome} (${g}g)`,
      calorias: kcalCalculada,
      proteinas_g: protCalculada,
      carbos_g: Math.round(alimentoSelecionado.carbo * mult),
      gorduras_g: Math.round(alimentoSelecionado.gordura * mult),
      check_agua: '', check_whey: '', check_creatina: ''
    };

    try {
      await apiFetch('/api/dieta/registro', { method: 'POST', body: novaRefeicao });
      
      const novosRecentes = [alimentoSelecionado, ...recentes.filter(r => r.id !== alimentoSelecionado.id)].slice(0, 10);
      setRecentes(novosRecentes);
      localStorage.setItem('alimentos_recentes', JSON.stringify(novosRecentes));

      setRefeicoes(prev => [...prev, {
        ID_Registro: novaRefeicao.id_registro,
        Tipo_Refeicao: novaRefeicao.tipo_refeicao,
        Calorias: novaRefeicao.calorias,
        Proteinas_g: novaRefeicao.proteinas_g
      }]);
      
      mostrarToast('+ Refeição adicionada!', 'sucesso');
      fecharBusca();
    } catch {
      mostrarToast('Erro ao salvar. Verifique a conexão.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  // ─── NOVA LÓGICA DE EXCLUSÃO ────────────────────────────────────────────────
  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    const id = itemParaExcluir.ID_Registro || itemParaExcluir.id_registro;
    
    try {
      await apiFetch(`/api/dieta/registro?id_registro=${id}`, { method: 'DELETE' });
      setRefeicoes(prev => prev.filter(r => r.ID_Registro !== id && r.id_registro !== id));
      mostrarToast('Alimento removido.', 'sucesso');
    } catch {
      mostrarToast('Erro ao remover.', 'erro');
    } finally {
      setItemParaExcluir(null); // Fecha o modal
    }
  };

  const fecharBusca = () => {
    setModalBusca(false);
    setAlimentoSelecionado(null);
    setTermoBusca('');
    setGramas('');
  };

  const renderizarAlimento = (a) => (
    <button key={a.id} onClick={() => setAlimentoSelecionado(a)} 
      className="w-full text-left bg-zinc-900 border border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-2xl p-4 mb-3 transition-all flex flex-col gap-2 shadow-sm">
      <div className="flex justify-between items-start">
        <p className="text-white font-bold text-sm leading-tight pr-4">{a.nome}</p>
        <span className="text-zinc-600 flex-shrink-0 bg-zinc-800 rounded-full p-1"><IconPlus/></span>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span className="text-[#f97316] bg-[#f97316]/10 px-2 py-0.5 rounded-md">{a.kcal} kcal</span>
        <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">{a.proteina}g P</span>
        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">{a.carbo}g C</span>
        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">{a.gordura}g G</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      {/* ── HEADER TELA PRINCIPAL ── */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Dieta & Macros</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Alvo adaptado p/ {usuario.objetivo}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-10 flex flex-col gap-6">
        
        {/* ── CARD: CALORIAS ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
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
            <div className="text-right pb-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${consumido.kcal > metas.kcal ? 'bg-red-500/10 text-red-500' : 'bg-[#c8f542]/10 text-[#c8f542]'}`}>
                {consumido.kcal > metas.kcal ? 'Passou ' : 'Faltam '} 
                {Math.abs(metas.kcal - consumido.kcal)}
              </span>
            </div>
          </div>
          <div className="w-full h-3.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${consumido.kcal > metas.kcal ? 'bg-red-500' : 'bg-[#c8f542]'}`} style={{ width: `${progressoKcal}%` }}/>
          </div>
        </div>

        {/* ── CARD: PROTEÍNAS ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <IconProteina/>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Proteínas</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-white font-black text-3xl num tracking-tight">{Math.round(consumido.proteina)}</span>
                <span className="text-zinc-500 text-sm font-semibold">/ {metas.proteina} g</span>
              </div>
            </div>
          </div>
          <div className="w-full h-3.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progressoProt}%` }}/>
          </div>
        </div>

        {/* ── BOTÃO ADICIONAR REFEIÇÃO ── */}
        <button onClick={() => setModalBusca(true)} className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,245,66,0.1)]">
          <IconPlus /> Adicionar alimento
        </button>

        {/* ── LISTA DE HOJE COM BOTÃO DE EXCLUIR ATUALIZADO ── */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 mt-2">Consumido Hoje</h2>
          
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-zinc-800 border-t-[#c8f542] rounded-full animate-spin"/></div>
          ) : refeicoes.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl border-dashed">
              <p className="text-zinc-500 text-sm">Nenhum registro ainda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {refeicoes.map((ref, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <p className="text-white font-semibold text-sm leading-tight mb-1">{ref.Tipo_Refeicao || ref.tipo_refeicao}</p>
                    <p className="text-blue-400 text-xs font-bold">{ref.Proteinas_g || ref.proteinas_g}g proteína</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#c8f542] font-black text-xl num">{ref.Calorias || ref.calorias}</p>
                    <p className="text-zinc-600 text-xs font-semibold">kcal</p>
                  </div>
                  {/* AGORA ABRE O MODAL EM VEZ DO WINDOW.CONFIRM */}
                  <button onClick={() => setItemParaExcluir(ref)} className="ml-4 w-10 h-10 bg-red-500/10 active:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                    <IconTrash/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL CONFIRMAÇÃO EXCLUSÃO (Mobile Friendly) ── */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex flex-col justify-end slide-up" onClick={() => setItemParaExcluir(null)}>
          <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6"/>
            <h3 className="text-white font-black text-xl mb-2 text-center">Remover alimento?</h3>
            <p className="text-zinc-400 text-sm mb-8 text-center leading-relaxed">
              Tem certeza que deseja remover <br/>
              <strong className="text-white">{itemParaExcluir.Tipo_Refeicao || itemParaExcluir.tipo_refeicao}</strong><br/>
              do seu diário de hoje?
            </p>
            <div className="flex gap-3 pb-safe">
              <button onClick={() => setItemParaExcluir(null)} className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">Cancelar</button>
              <button onClick={confirmarExclusao} className="btn flex-1 py-4 bg-red-500/10 text-red-500 active:bg-red-500/20 font-bold rounded-2xl">Sim, remover</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BUSCAR / SELECIONAR ALIMENTO (TELA CHEIA) ── */}
      {modalBusca && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col slide-up" style={{paddingTop:'env(safe-area-inset-top)'}}>
          
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 bg-[#0a0a0a] z-10">
            <button onClick={fecharBusca} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
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
                <button onClick={() => setTermoBusca('')} className="text-zinc-500 active:text-white p-2 -mr-2">
                  <IconX/>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {termoBusca.trim().length > 0 ? (
              <div className="px-4 py-4">
                {termoBusca.trim().length === 1 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">Digite pelo menos 2 letras...</div>
                ) : resultadosBusca.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm">Alimento não encontrado.</div>
                ) : (
                  <>
                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Resultados da Busca</h3>
                    {resultadosBusca.map(renderizarAlimento)}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto sticky top-0 bg-[#0a0a0a] z-10 border-b border-zinc-900 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex flex-nowrap w-max gap-2 px-4 py-3">
                    {recentes.length > 0 && (
                      <button onClick={() => setAbaAtiva('recentes')} className={`flex-none inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${abaAtiva === 'recentes' ? 'bg-[#c8f542] text-black border-[#c8f542]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                        <span className={`flex-shrink-0 ${abaAtiva === 'recentes' ? 'text-black' : 'text-zinc-500'}`}><IconClock/></span> Recentes
                      </button>
                    )}
                    {categoriasPopulares.map(cat => (
                      <button key={cat.id} onClick={() => setAbaAtiva(cat.id)} className={`flex-none inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${abaAtiva === cat.id ? 'bg-[#c8f542] text-black border-[#c8f542]' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                        <span className={`flex-shrink-0 ${abaAtiva === cat.id ? 'text-black' : 'text-zinc-500'}`}>{cat.icone}</span> {cat.nome}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-4 flex-1">
                  {abaAtiva === 'recentes' && (
                    <>
                      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">Adicionados Recentemente</h3>
                      {recentes.map(renderizarAlimento)}
                    </>
                  )}
                  {abaAtiva !== 'recentes' && (
                    <>
                      {categoriasPopulares.find(c => c.id === abaAtiva)?.itens.map(renderizarAlimento)}
                    </>
                  )}
                  
                  <div className="mt-4 mb-8 bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600 mb-3">
                      <IconSearch/>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">Explore a base completa</h4>
                    <p className="text-zinc-500 text-xs mb-5 max-w-[240px]">
                      Temos diversas opções cadastradas. Use a pesquisa para encontrar a opção exata.
                    </p>
                    <button onClick={() => inputBuscaRef.current?.focus()} className="btn px-6 py-3 bg-zinc-800 active:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                      Pesquisar alimento
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

          {alimentoSelecionado && (
            <div className="absolute inset-0 bg-black/80 flex flex-col justify-end z-[60]" onClick={() => setAlimentoSelecionado(null)}>
              <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6"/>
                
                <h3 className="text-white font-black text-xl mb-1 pr-4 leading-tight">{alimentoSelecionado.nome}</h3>
                <p className="text-zinc-500 text-sm mb-6">Qual a quantidade consumida?</p>
                
                <div className="flex items-center gap-3 bg-black border border-zinc-800 focus-within:border-[#c8f542] rounded-2xl px-5 py-4 mb-6 transition-colors">
                  <input 
                    type="number" inputMode="decimal" autoFocus 
                    value={gramas} onChange={e => setGramas(e.target.value)}
                    className="flex-1 bg-transparent text-[#c8f542] font-black text-4xl outline-none" placeholder="0"
                  />
                  <span className="text-zinc-500 font-bold text-lg">gramas</span>
                </div>

                <div className="bg-zinc-800/40 border border-zinc-800/80 rounded-2xl p-4 mb-6">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Total a adicionar</p>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-white font-black text-lg">{gramas ? Math.round(alimentoSelecionado.kcal * (gramas/100)) : 0}</p>
                      <p className="text-zinc-500 text-xs">kcal</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-800"/>
                    <div className="text-center">
                      <p className="text-blue-400 font-black text-lg">{gramas ? Math.round(alimentoSelecionado.proteina * (gramas/100) * 10)/10 : 0}g</p>
                      <p className="text-zinc-500 text-xs">Prot</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-800"/>
                    <div className="text-center">
                      <p className="text-emerald-400 font-black text-lg">{gramas ? Math.round(alimentoSelecionado.carbo * (gramas/100) * 10)/10 : 0}g</p>
                      <p className="text-zinc-500 text-xs">Carbo</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-800"/>
                    <div className="text-center">
                      <p className="text-amber-400 font-black text-lg">{gramas ? Math.round(alimentoSelecionado.gordura * (gramas/100) * 10)/10 : 0}g</p>
                      <p className="text-zinc-500 text-xs">Gord</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pb-safe">
                  <button onClick={() => setAlimentoSelecionado(null)} className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">Cancelar</button>
                  <button onClick={salvarRefeicao} disabled={salvando} className="btn flex-[2] py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {salvando ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/> : <IconPlus/>}
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