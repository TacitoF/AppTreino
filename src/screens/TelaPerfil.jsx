import React, { useState } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';

const IconBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;

export default function TelaPerfil({ usuario, onSalvar, onVoltar, mostrarToast }) {
  const [nome, setNome]     = useState(usuario.nome || '');
  const [email, setEmail]   = useState(usuario.email || '');
  const [senha, setSenha]   = useState('');
  const [peso, setPeso]     = useState(usuario.peso_atual || '');
  const [altura, setAltura] = useState(usuario.altura || '');
  const [idade, setIdade]   = useState(usuario.idade || '');
  const [genero, setGenero] = useState(usuario.genero || '');
  const [obj, setObj]       = useState(usuario.objetivo || '');
  const [salvando, setSalvando] = useState(false);

  const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        id_usuario: usuario.id,
        nome, email, senha, peso_atual: peso, altura, idade, genero, objetivo: obj,
      };
      // usa R.editarUsuario em vez de endpoint hard-coded
      await apiFetch(R.editarUsuario || '/api/usuario/editar', { method: 'POST', body: payload });
      const usrAtualizado = { ...usuario, nome, email, peso_atual: peso, altura, idade, genero, objetivo: obj };
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
        <div className="w-12 h-12"/>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-4">
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

        <button onClick={salvar} disabled={salvando}
          className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(200,245,66,0.1)]">
          {salvando
            ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
            : <IconSave/>}
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}