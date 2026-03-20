import React, { useState, useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { apiFetch } from '../auth';
import { R } from '../config';

const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const IconMoon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const IconSun = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;

const getSafeAvatarUrl = (configStr) => {
  try {
    const parsed = JSON.parse(configStr);
    if (!parsed) return null;

    const safeConfig = {
      top: parsed.top || 'shortFlat',
      eyes: parsed.eyes || 'default',
      mouth: parsed.mouth || 'smile',
      clothes: parsed.clothes || parsed.clothing || 'hoodie',
      clotheColor: parsed.clotheColor || parsed.clothingColor || parsed.clothesColor || 'pastelGreen',
      skinColor: parsed.skinColor || 'light',
      hairColor: parsed.hairColor || 'black',
      accessories: parsed.accessories || 'none'
    };

    const isHex = (str) => /^[0-9A-Fa-f]{6}$/.test(str);
    if (isHex(safeConfig.clotheColor)) safeConfig.clotheColor = 'pastelGreen';
    if (isHex(safeConfig.skinColor)) safeConfig.skinColor = 'light';
    if (isHex(safeConfig.hairColor)) safeConfig.hairColor = 'black';

    const options = {
      seed: 'Volt',
      backgroundColor: ['transparent'],
    };
    
    if (safeConfig.top && safeConfig.top !== 'none') options.top = [safeConfig.top];
    if (safeConfig.eyes && safeConfig.eyes !== 'none') options.eyes = [safeConfig.eyes];
    if (safeConfig.mouth && safeConfig.mouth !== 'none') options.mouth = [safeConfig.mouth];
    if (safeConfig.clothes && safeConfig.clothes !== 'none') options.clothing = [safeConfig.clothes];
    if (safeConfig.clotheColor && safeConfig.clotheColor !== 'none') options.clothingColor = [safeConfig.clotheColor];
    if (safeConfig.skinColor && safeConfig.skinColor !== 'none') options.skinColor = [safeConfig.skinColor];
    if (safeConfig.hairColor && safeConfig.hairColor !== 'none') options.hairColor = [safeConfig.hairColor];
    if (safeConfig.accessories && safeConfig.accessories !== 'none') options.accessories = [safeConfig.accessories];

    const avatar = createAvatar(avataaars, options);
    return avatar.toDataUri();
  } catch (e) {
    return null;
  }
};

export default function TelaPerfil({ usuario, onSalvar, onVoltar, mostrarToast, tema, onToggleTema, onEditAvatar }) {
  const [nome, setNome]         = useState(usuario.nome || '');
  const [email, setEmail]       = useState(usuario.email || '');
  const [senha, setSenha]       = useState('');
  const [peso, setPeso]         = useState(usuario.peso_atual || '');
  const [altura, setAltura]     = useState(usuario.altura || '');
  const [idade, setIdade]       = useState(usuario.idade || '');
  const [genero, setGenero]     = useState(usuario.genero || '');
  const [obj, setObj]           = useState(usuario.objetivo || '');
  const [atividade, setAtividade] = useState(usuario.atividade || '');
  const [salvando, setSalvando] = useState(false);

  const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

  const avatarUrl = useMemo(() => {
    if (!usuario.avatar_config) return null;
    return getSafeAvatarUrl(usuario.avatar_config);
  }, [usuario.avatar_config]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        id_usuario: usuario.id,
        nome, email, senha, peso_atual: peso, altura, idade, genero, objetivo: obj, atividade,
        avatar_config: usuario.avatar_config
      };
      await apiFetch(R.editarUsuario || '/api/usuario/editar', { method: 'POST', body: payload });
      const usrAtualizado = { ...usuario, nome, email, peso_atual: peso, altura, idade, genero, objetivo: obj, atividade };
      onSalvar(usrAtualizado);
      mostrarToast('Perfil atualizado!', 'sucesso');
    } catch {
      mostrarToast('Erro ao salvar perfil.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-10">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between border-b border-zinc-900">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <h1 className="text-xl font-bold text-white">Editar Perfil</h1>
        <button onClick={onToggleTema} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 active:bg-zinc-800 flex-shrink-0" style={{ WebkitTapHighlightColor: 'transparent' }}>
          {tema === 'claro' ? <IconMoon/> : <IconSun/>}
        </button>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-4">
        
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-zinc-800 bg-zinc-900 overflow-hidden mb-3 relative flex items-center justify-center shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-[115%] h-[115%] object-contain mt-4" />
            ) : (
              <div className="text-zinc-600"><IconUser /></div>
            )}
          </div>
          <button 
            onClick={onEditAvatar} 
            className="btn px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-bold active:bg-zinc-800 transition-colors hover:border-[#c8f542] hover:text-[#c8f542]"
          >
            Personalizar Avatar
          </button>
        </div>

        <div>
          <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Nome</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} className={inp}/>
        </div>
        <div>
          <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp}/>
        </div>
        <div>
          <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Nova Senha (opcional)</label>
          <input type="password" placeholder="Mantenha em branco para não alterar" value={senha} onChange={e => setSenha(e.target.value)} className={inp}/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Peso (kg)</label>
            <input type="number" inputMode="decimal" value={peso} onChange={e => setPeso(e.target.value)} className={inp}/>
          </div>
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Altura (cm)</label>
            <input type="number" inputMode="numeric" value={altura} onChange={e => setAltura(e.target.value)} className={inp}/>
          </div>
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Idade</label>
            <input type="number" inputMode="numeric" value={idade} onChange={e => setIdade(e.target.value)} className={inp}/>
          </div>
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Gênero</label>
            <select value={genero} onChange={e => setGenero(e.target.value)} className={inp}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Objetivo</label>
          <select value={obj} onChange={e => setObj(e.target.value)} className={inp}>
            <option value="Hipertrofia">Hipertrofia</option>
            <option value="Emagrecimento">Emagrecimento</option>
            <option value="Manutencao">Manutenção</option>
          </select>
        </div>

        <div>
          <label className="text-zinc-500 text-xs font-bold uppercase ml-1 mb-1 block">Nível de Atividade Física</label>
          <select value={atividade} onChange={e => setAtividade(e.target.value)} className={`${inp} cursor-pointer`}>
            <option value="">Selecione...</option>
            <option value="sedentario">Sedentário (sem exercício)</option>
            <option value="leve">Leve (1-2x por semana)</option>
            <option value="moderado">Moderado (3-4x por semana)</option>
            <option value="ativo">Ativo (5-6x por semana)</option>
            <option value="muito_ativo">Muito ativo (2x por dia)</option>
          </select>
          {atividade && (
            <p className="text-zinc-600 text-xs mt-1.5 px-1">
              {({
                sedentario:  'Trabalho de escritório, sem atividade regular.',
                leve:        'Caminhadas ou academia ocasional.',
                moderado:    'Academia ou esporte 3-4x/semana — o mais comum.',
                ativo:       'Treino intenso quase todo dia.',
                muito_ativo: 'Atleta ou trabalho físico pesado.',
              })[atividade]}
            </p>
          )}
        </div>

        <button onClick={salvar} disabled={salvando}
          className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(200,245,66,0.1)]">
          {salvando ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/> : <IconSave/>}
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}