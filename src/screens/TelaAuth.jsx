import React, { useState } from 'react';
import { apiFetch, setAuthToken } from '../auth';
import { R } from '../config';

function TelaAuth({ onLogin, mostrarToast }) {
  const [modo, setModo]           = useState('login'); 
  const [resetAberto, setReset]   = useState(false);
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [nome, setNome]           = useState('');
  const [peso, setPeso]           = useState('');
  const [obj, setObj]             = useState('');
  
  const [altura, setAltura]       = useState('');
  const [idade, setIdade]         = useState('');
  const [genero, setGenero]       = useState('');
  const [atividade, setAtividade] = useState('');
  
  const [loading, setLoading]     = useState(false);

  const limpar = () => { 
    setEmail(''); setSenha(''); setNome(''); setPeso(''); setObj(''); 
    setSenhaNova(''); setSenhaConfirm(''); setAltura(''); setIdade(''); setGenero(''); setAtividade(''); 
  };
  
  const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

  const login = async e => {
    e.preventDefault();
    if (!email || !senha) { mostrarToast('Preencha e-mail ou nome de usuário e senha.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch(R.login, { method: 'POST', body: { email, senha } });
      if (r.token) setAuthToken(r.token);
      onLogin(r.usuario);
      limpar();
    } catch (err) {
      if (err.status === 401) mostrarToast('Senha incorreta.', 'erro');
      else if (err.status === 404) mostrarToast('Usuário não encontrado.', 'erro');
      else mostrarToast('Não foi possível conectar.', 'erro');
    } finally { setLoading(false); }
  };

  const resetSenha = async e => {
    e.preventDefault();
    if (!email || !senhaNova) { mostrarToast('Preencha e-mail e nova senha.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch(R.resetSenha, { method: 'POST', body: { email, senha_nova: senhaNova } });
      mostrarToast('Senha redefinida! Faça login.', 'sucesso');
      setReset(false); setSenhaNova('');
    } catch (err) {
      if (err.status === 404) mostrarToast('E-mail não encontrado.', 'erro');
      else mostrarToast('Erro ao redefinir senha.', 'erro');
    } finally { setLoading(false); }
  };

  const senhaRequisitos = {
    maiuscula:  /[A-Z]/.test(senha),
    minuscula:  /[a-z]/.test(senha),
    numero:     /[0-9]/.test(senha),
    especial:   /[^A-Za-z0-9]/.test(senha),
    minimo:     senha.length >= 8,
  };
  const senhaValida = Object.values(senhaRequisitos).every(Boolean);

  const cadastro = async e => {
    e.preventDefault();
    if (!nome || !email || !senha) { mostrarToast('Preencha nome, e-mail e senha.', 'erro'); return; }
    if (!senhaValida) { mostrarToast('A senha não atende aos requisitos.', 'erro'); return; }
    if (senha !== senhaConfirm) { mostrarToast('As senhas não coincidem.', 'erro'); return; }
    if (!peso || !altura || !idade) { mostrarToast('Informe seu peso, altura e idade.', 'erro'); return; }
    if (!genero) { mostrarToast('Selecione seu gênero biológico.', 'erro'); return; }
    if (!obj) { mostrarToast('Selecione seu objetivo.', 'erro'); return; }
    if (!atividade) { mostrarToast('Selecione seu nível de atividade física.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch(R.registro, { 
        method: 'POST', 
        body: { nome, email, senha, peso_atual: peso, objetivo: obj, altura, idade, genero, atividade } 
      });
      mostrarToast('Conta criada. Faça login.', 'sucesso');
      setModo('login'); limpar();
    } catch (err) {
      if (err.status === 400) mostrarToast('E-mail já cadastrado.', 'erro');
      else mostrarToast('Erro ao criar conta.', 'erro');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-sm slide-up max-h-screen overflow-y-auto pb-10 no-scrollbar">
        
        <div className="text-center mb-8 mt-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c8f542]/10 border border-[#c8f542]/20 rounded-2xl mb-4 text-[#c8f542]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white">Volt</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Seu diário de treino</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 mb-6">
          {[['login','Entrar'],['cadastro','Criar conta']].map(([t,l]) => (
            <button key={t} onClick={() => { setModo(t); setReset(false); limpar(); }}
              className={`btn flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${modo===t ? 'bg-[#c8f542] text-black' : 'text-zinc-500'}`}>
              {l}
            </button>
          ))}
        </div>

        {modo === 'login' && !resetAberto && (
          <form onSubmit={login} className="flex flex-col gap-3">
            <input type="text" placeholder="E-mail ou nome de usuário" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="username"/>
            <input type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} className={inp} autoComplete="current-password"/>
            <button type="submit" disabled={loading} className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-2 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setReset(true)}
              className="text-zinc-500 text-sm text-center mt-1 active:text-zinc-300 transition-colors">
              Esqueci minha senha
            </button>
          </form>
        )}

        {modo === 'login' && resetAberto && (
          <div className="flex flex-col gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <div>
                <p className="text-white text-sm font-semibold">Redefinir senha</p>
                <p className="text-zinc-500 text-xs">Insira seu e-mail e a nova senha desejada.</p>
              </div>
            </div>
            <input type="email" placeholder="E-mail da conta" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="email"/>
            <input type="password" placeholder="Nova senha" value={senhaNova} onChange={e=>setSenhaNova(e.target.value)} className={inp}/>
            <button onClick={resetSenha} disabled={loading}
              className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl disabled:opacity-50">
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
            <button type="button" onClick={() => { setReset(false); setSenhaNova(''); }}
              className="text-zinc-500 text-sm text-center active:text-zinc-300 transition-colors">
              ← Voltar ao login
            </button>
          </div>
        )}

        {modo === 'cadastro' && (
          <form onSubmit={cadastro} className="flex flex-col gap-3">
            <input type="text" placeholder="Nome de usuário" value={nome} onChange={e=>setNome(e.target.value)} className={inp}/>
            <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} className={inp} autoComplete="email"/>
            
            <input type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} className={inp}/>
            {senha.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex flex-col gap-2">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Requisitos da senha</p>
                {[
                  [senhaRequisitos.minimo,    'Mínimo 8 caracteres'],
                  [senhaRequisitos.maiuscula, '1 letra maiúscula'],
                  [senhaRequisitos.minuscula, '1 letra minúscula'],
                  [senhaRequisitos.numero,    '1 número'],
                  [senhaRequisitos.especial,  '1 caractere especial (!@#$...)'],
                ].map(([ok, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    {ok
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0"><circle cx="12" cy="12" r="9"/></svg>
                    }
                    <span className={`text-xs ${ok ? 'text-[#c8f542]' : 'text-zinc-500'}`}>{label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <input type="password" placeholder="Confirmar senha" value={senhaConfirm} onChange={e=>setSenhaConfirm(e.target.value)}
                className={`${inp} ${senhaConfirm && senha !== senhaConfirm ? 'border-red-500 focus:border-red-500' : senhaConfirm && senha === senhaConfirm ? 'border-[#c8f542]' : ''}`}/>
              {senhaConfirm && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {senha === senhaConfirm
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-4 h-4"><path d="M20 6L9 17l-5-5"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  }
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input type="number" placeholder="Peso (kg)" value={peso} onChange={e=>setPeso(e.target.value)} className={inp}/>
              <input type="number" placeholder="Alt (cm)" value={altura} onChange={e=>setAltura(e.target.value)} className={inp}/>
              <input type="number" placeholder="Idade" value={idade} onChange={e=>setIdade(e.target.value)} className={inp}/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={genero} onChange={e=>setGenero(e.target.value)} className={`${inp} cursor-pointer ${genero===''?'text-zinc-600':'text-white'}`}>
                <option value="" disabled className="bg-zinc-900">Gênero Bio</option>
                <option value="M" className="bg-zinc-900 text-white">Masculino</option>
                <option value="F" className="bg-zinc-900 text-white">Feminino</option>
              </select>
              
              <select value={obj} onChange={e=>setObj(e.target.value)} className={`${inp} cursor-pointer ${obj===''?'text-zinc-600':'text-white'}`}>
                <option value="" disabled className="bg-zinc-900">Objetivo</option>
                <option value="Hipertrofia" className="bg-zinc-900 text-white">Hipertrofia</option>
                <option value="Emagrecimento" className="bg-zinc-900 text-white">Emagrecer</option>
                <option value="Manutencao" className="bg-zinc-900 text-white">Manter</option>
              </select>
            </div>

            {/* Nível de atividade física */}
            <div className="flex flex-col gap-1.5">
              <select value={atividade} onChange={e=>setAtividade(e.target.value)}
                className={`${inp} cursor-pointer ${atividade===''?'text-zinc-600':'text-white'}`}>
                <option value="" disabled className="bg-zinc-900">Nível de atividade física</option>
                <option value="sedentario"   className="bg-zinc-900 text-white">Sedentário (sem exercício)</option>
                <option value="leve"         className="bg-zinc-900 text-white">Leve (1-2x por semana)</option>
                <option value="moderado"     className="bg-zinc-900 text-white">Moderado (3-4x por semana)</option>
                <option value="ativo"        className="bg-zinc-900 text-white">Ativo (5-6x por semana)</option>
                <option value="muito_ativo"  className="bg-zinc-900 text-white">Muito ativo (2x por dia)</option>
              </select>
              {atividade && (
                <p className="text-zinc-600 text-xs px-1">
                  {{
                    sedentario:  'Trabalho de escritório, sem atividade regular.',
                    leve:        'Caminhadas ou academia ocasional.',
                    moderado:    'Academia ou esporte 3-4x/semana — mais comum.',
                    ativo:       'Treino intenso quase todo dia.',
                    muito_ativo: 'Atleta ou trabalho físico pesado.',
                  }[atividade]}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-2 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default TelaAuth;