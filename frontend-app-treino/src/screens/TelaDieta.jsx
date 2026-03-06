import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../auth';
import { ALIMENTOS_DB } from '../data/alimentosDB';

// Ícones Inline para manter o padrão visual limpo (Volt)
const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const IconPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IconFlame = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#f97316]"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
const IconMeat = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M10.828 10.828L15.07 15.07m-9.9-9.9l4.243 4.243m.707 1.414l-4.243 4.243a2 2 0 000 2.828l2.828 2.828a2 2 0 002.828 0l4.243-4.243m-5.657-5.657l4.243-4.243a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-4.243 4.243"/></svg>;

export default function TelaDieta({ usuario, onVoltar, mostrarToast }) {
  const [refeicoes, setRefeicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalBusca, setModalBusca] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
  const [gramas, setGramas] = useState('');
  const [salvando, setSalvando] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);

  // ─── CARREGAR REFEIÇÕES DO DIA ──────────────────────────────────────────────
  useEffect(() => {
    apiFetch(`/api/dieta/registro?id_usuario=${usuario.id}&data=${hoje}`)
      .then(r => setRefeicoes(r.registros || []))
      .catch(() => mostrarToast('Erro ao carregar dieta', 'erro'))
      .finally(() => setLoading(false));
  }, [usuario.id, hoje, mostrarToast]);

  // ─── CÁLCULO INTELIGENTE (Taxa Metabólica Basal) ────────────────────────────
  const metas = useMemo(() => {
    // Fallbacks de segurança para contas antigas que não tinham esses dados
    const peso   = parseFloat(usuario.peso_atual) || 70;
    const altura = parseFloat(usuario.altura) || 170;
    const idade  = parseInt(usuario.idade) || 25;
    const genero = usuario.genero === 'F' ? 'F' : 'M';
    const obj    = usuario.objetivo || 'Manutencao';

    // Fórmula de Mifflin-St Jeor
    let tmb = (10 * peso) + (6.25 * altura) - (5 * idade);
    tmb += (genero === 'M') ? 5 : -161;

    // Fator de atividade física (consideramos 1.55 para quem treina regularmente)
    let gastoTotal = tmb * 1.55;

    // Ajuste pelo Objetivo
    let metaKcal = gastoTotal;
    if (obj === 'Emagrecimento') metaKcal -= 500;  // Défice Calórico
    if (obj === 'Hipertrofia') metaKcal += 500;    // Superávit Calórico

    return {
      kcal: Math.round(metaKcal),
      proteina: Math.round(peso * 2.0), // 2g de proteína por kg corporal (padrão ouro)
    };
  }, [usuario]);

  // ─── SOMA DO QUE JÁ FOI COMIDO ──────────────────────────────────────────────
  const consumido = useMemo(() => {
    return refeicoes.reduce((acc, ref) => ({
      // Garantimos compatibilidade com letras maiúsculas/minúsculas do Google Sheets
      kcal: acc.kcal + (parseInt(ref.Calorias || ref.calorias) || 0),
      proteina: acc.proteina + (parseFloat(ref.Proteinas_g || ref.proteinas_g) || 0),
    }), { kcal: 0, proteina: 0 });
  }, [refeicoes]);

  const progressoKcal = Math.min((consumido.kcal / metas.kcal) * 100, 100);
  const progressoProt = Math.min((consumido.proteina / metas.proteina) * 100, 100);

  // ─── SALVAR NOVA REFEIÇÃO ───────────────────────────────────────────────────
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
      
      // Atualiza a tela imediatamente (Optimistic UI)
      setRefeicoes(prev => [...prev, {
        ID_Registro: novaRefeicao.id_registro,
        Tipo_Refeicao: novaRefeicao.tipo_refeicao,
        Calorias: novaRefeicao.calorias,
        Proteinas_g: novaRefeicao.proteinas_g
      }]);
      
      mostrarToast('+ Refeição adicionada!', 'sucesso');
      setAlimentoSelecionado(null);
      setGramas('');
      setModalBusca(false);
    } catch {
      mostrarToast('Erro ao salvar. Verifique a conexão.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const alimentosFiltrados = ALIMENTOS_DB.filter(a => 
    a.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      {/* ── HEADER ── */}
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg">
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
                <IconMeat/>
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

        {/* ── LISTA DE HOJE ── */}
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
                  <div className="flex-1 pr-4">
                    <p className="text-white font-semibold text-sm leading-tight mb-1">{ref.Tipo_Refeicao || ref.tipo_refeicao}</p>
                    <p className="text-blue-400 text-xs font-bold">{ref.Proteinas_g || ref.proteinas_g}g proteína</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#c8f542] font-black text-xl num">{ref.Calorias || ref.calorias}</p>
                    <p className="text-zinc-600 text-xs font-semibold">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: BUSCAR ALIMENTO ── */}
      {modalBusca && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col slide-up" style={{paddingTop:'env(safe-area-inset-top)'}}>
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-900">
            <button onClick={() => { setModalBusca(false); setAlimentoSelecionado(null); setTermoBusca(''); }} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
              <IconBack/>
            </button>
            <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-1 focus-within:border-[#c8f542] transition-colors">
              <div className="text-zinc-500"><IconSearch/></div>
              <input 
                type="text" autoFocus placeholder="Ex: Arroz branco..." 
                value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                className="flex-1 bg-transparent text-white px-3 py-3 outline-none text-sm placeholder-zinc-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {alimentosFiltrados.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-sm">Alimento não encontrado.</div>
            ) : alimentosFiltrados.map(a => (
              <button key={a.id} onClick={() => setAlimentoSelecionado(a)} className="w-full text-left bg-zinc-900 border border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-2xl px-4 py-4 mb-2 flex justify-between items-center transition-all">
                <div>
                  <p className="text-white font-bold text-sm mb-1">{a.nome}</p>
                  <p className="text-zinc-500 text-xs">{a.kcal} kcal | <span className="text-blue-400">{a.proteina}g prot</span> (em 100g)</p>
                </div>
                <div className="text-zinc-600"><IconPlus/></div>
              </button>
            ))}
          </div>

          {/* ── MODAL (BOTTOM SHEET): QUANTIDADE ── */}
          {alimentoSelecionado && (
            <div className="absolute inset-0 bg-black/80 flex items-end z-[60]" onClick={() => setAlimentoSelecionado(null)}>
              <div className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 slide-up" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5"/>
                <h3 className="text-white font-black text-xl mb-1">{alimentoSelecionado.nome}</h3>
                <p className="text-zinc-500 text-sm mb-6">Qual a quantidade consumida em gramas?</p>
                
                <div className="flex items-center gap-3 bg-black border border-zinc-800 focus-within:border-[#c8f542] rounded-2xl px-5 py-4 mb-4 transition-colors">
                  <input 
                    type="number" inputMode="numeric" autoFocus 
                    value={gramas} onChange={e => setGramas(e.target.value)}
                    className="flex-1 bg-transparent text-[#c8f542] font-black text-4xl outline-none" placeholder="0"
                  />
                  <span className="text-zinc-500 font-bold text-lg">gramas</span>
                </div>

                {/* Preview em tempo real */}
                <div className="flex justify-between items-center bg-zinc-800/50 rounded-xl px-4 py-3 mb-6">
                  <span className="text-zinc-400 text-sm font-semibold">Adicionando:</span>
                  <div className="text-right">
                    <span className="text-white font-bold">{gramas ? Math.round(alimentoSelecionado.kcal * (gramas/100)) : 0} kcal</span>
                    <span className="text-zinc-500 mx-2">|</span>
                    <span className="text-blue-400 font-bold">{gramas ? Math.round(alimentoSelecionado.proteina * (gramas/100) * 10)/10 : 0}g prot</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setAlimentoSelecionado(null)} className="btn flex-1 py-4 bg-zinc-800 active:bg-zinc-700 text-white font-bold rounded-2xl">Cancelar</button>
                  <button onClick={salvarRefeicao} disabled={salvando} className="btn flex-[2] py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black rounded-2xl disabled:opacity-50">
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