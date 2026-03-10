import React, { useState } from 'react';
import { apiFetch, setAuthToken } from '../auth';
import { R } from '../config';

// ─── Ícone back ───────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
);

// ─── Constante de estilo ──────────────────────────────────────────────────────
const inp = "w-full bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-base placeholder-zinc-600";

// ─── Botões de seleção (substituem <select> — muito mais fácil de tocar) ──────
function OpcoesBotoes({ opcoes, valor, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {opcoes.map(({ id, label, desc }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`btn w-full rounded-2xl px-4 py-4 text-left flex items-center gap-3 border transition-all ${
            valor === id
              ? 'bg-[#c8f542]/10 border-[#c8f542]/40'
              : 'bg-zinc-900 border-zinc-800 active:bg-zinc-800'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
            valor === id ? 'border-[#c8f542] bg-[#c8f542]' : 'border-zinc-600'
          }`}>
            {valor === id && <div className="w-2 h-2 rounded-full bg-black"/>}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`font-semibold text-sm ${valor === id ? 'text-[#c8f542]' : 'text-white'}`}>
              {label}
            </span>
            {desc && (
              <p className={`text-xs mt-0.5 ${valor === id ? 'text-[#c8f542]/70' : 'text-zinc-500'}`}>{desc}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Barra de progresso ───────────────────────────────────────────────────────
function BarraEtapas({ etapa, total }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full flex-1 transition-all duration-300 ${
            i < etapa ? 'bg-[#c8f542]' : i === etapa ? 'bg-[#c8f542]/40' : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function TelaAuth({ onLogin, mostrarToast }) {
  const [modo, setModo]       = useState('login');
  const [resetAberto, setReset] = useState(false);
  const [loading, setLoading] = useState(false);

  // campos login
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [senhaNova, setSenhaNova] = useState('');

  // cadastro — etapas
  const [etapa, setEtapa]             = useState(0);
  const [nome, setNome]               = useState('');
  const [emailCad, setEmailCad]       = useState('');
  const [senhaCad, setSenhaCad]       = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [peso, setPeso]               = useState('');
  const [altura, setAltura]           = useState('');
  const [idade, setIdade]             = useState('');
  const [genero, setGenero]           = useState('');
  const [obj, setObj]                 = useState('');
  const [atividade, setAtividade]     = useState('');

  const limpar = () => {
    setEmail(''); setSenha(''); setSenhaNova('');
    setNome(''); setEmailCad(''); setSenhaCad(''); setSenhaConfirm('');
    setPeso(''); setAltura(''); setIdade('');
    setGenero(''); setObj(''); setAtividade('');
    setEtapa(0);
  };

  // ─── Requisitos senha ─────────────────────────────────────────────────────
  const req = {
    maiuscula: /[A-Z]/.test(senhaCad),
    minuscula: /[a-z]/.test(senhaCad),
    numero:    /[0-9]/.test(senhaCad),
    especial:  /[^A-Za-z0-9]/.test(senhaCad),
    minimo:    senhaCad.length >= 8,
  };
  const senhaValida = Object.values(req).every(Boolean);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (e) => {
    e.preventDefault();
    if (!email || !senha) { mostrarToast('Preencha e-mail e senha.', 'erro'); return; }
    setLoading(true);
    try {
      const r = await apiFetch(R.login, { method: 'POST', body: { email, senha } });
      if (r.token) setAuthToken(r.token);
      onLogin(r.usuario);
      limpar();
    } catch (err) {
      if (err.status === 401)      mostrarToast('Senha incorreta.', 'erro');
      else if (err.status === 404) mostrarToast('Usuário não encontrado.', 'erro');
      else                         mostrarToast('Não foi possível conectar.', 'erro');
    } finally { setLoading(false); }
  };

  // ─── Reset senha ──────────────────────────────────────────────────────────
  const resetSenha = async (e) => {
    e.preventDefault();
    if (!email || !senhaNova) { mostrarToast('Preencha e-mail e nova senha.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch(R.resetSenha, { method: 'POST', body: { email, senha_nova: senhaNova } });
      mostrarToast('Senha redefinida! Faça login.', 'sucesso');
      setReset(false); setSenhaNova('');
    } catch (err) {
      if (err.status === 404) mostrarToast('E-mail não encontrado.', 'erro');
      else                    mostrarToast('Erro ao redefinir senha.', 'erro');
    } finally { setLoading(false); }
  };

  // ─── Avançar etapa ────────────────────────────────────────────────────────
  const avancarEtapa = () => {
    if (etapa === 0) {
      if (!nome.trim())             { mostrarToast('Digite seu nome de usuário.', 'erro'); return; }
      if (!emailCad.trim())         { mostrarToast('Digite seu e-mail.', 'erro'); return; }
      if (!senhaValida)             { mostrarToast('A senha não atende aos requisitos.', 'erro'); return; }
      if (senhaCad !== senhaConfirm){ mostrarToast('As senhas não coincidem.', 'erro'); return; }
    }
    if (etapa === 1) {
      if (!peso || !altura || !idade) { mostrarToast('Preencha peso, altura e idade.', 'erro'); return; }
      if (!genero)                    { mostrarToast('Selecione seu gênero biológico.', 'erro'); return; }
    }
    setEtapa(e => e + 1);
  };

  // ─── Cadastro final ───────────────────────────────────────────────────────
  const cadastro = async () => {
    if (!obj)       { mostrarToast('Selecione seu objetivo.', 'erro'); return; }
    if (!atividade) { mostrarToast('Selecione seu nível de atividade.', 'erro'); return; }
    setLoading(true);
    try {
      await apiFetch(R.registro, {
        method: 'POST',
        body: { nome, email: emailCad, senha: senhaCad, peso_atual: peso, objetivo: obj, altura, idade, genero, atividade },
      });
      mostrarToast('Conta criada! Faça login.', 'sucesso');
      setModo('login'); limpar();
    } catch (err) {
      if (err.status === 400) mostrarToast('E-mail já cadastrado.', 'erro');
      else                    mostrarToast('Erro ao criar conta.', 'erro');
    } finally { setLoading(false); }
  };

  // ─── Opções ───────────────────────────────────────────────────────────────
  const opcoesGenero = [
    { id: 'M', label: 'Masculino' },
    { id: 'F', label: 'Feminino'  },
  ];
  const opcoesObjetivo = [
    { id: 'Hipertrofia',   label: 'Hipertrofia',   desc: 'Ganho de massa muscular' },
    { id: 'Emagrecimento', label: 'Emagrecimento', desc: 'Perda de gordura corporal' },
    { id: 'Manutencao',    label: 'Manutenção',    desc: 'Manter peso e condicionamento' },
  ];
  const opcoesAtividade = [
    { id: 'sedentario',  label: 'Sedentário',  desc: 'Trabalho de escritório, sem exercício' },
    { id: 'leve',        label: 'Leve',        desc: '1-2x por semana' },
    { id: 'moderado',    label: 'Moderado',    desc: '3-4x por semana — mais comum' },
    { id: 'ativo',       label: 'Ativo',       desc: '5-6x por semana' },
    { id: 'muito_ativo', label: 'Muito ativo', desc: 'Atleta ou 2x por dia' },
  ];

  return (
    <div
      className="fixed inset-0 bg-[#0a0a0a] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 pb-16">

          {/* ── Logo ── */}
          <div className="text-center pt-16 pb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c8f542]/10 border border-[#c8f542]/20 rounded-2xl mb-4 text-[#c8f542]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-black text-white">Volt</h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Seu diário de treino</p>
          </div>

          {/* ── Tabs ── */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 mb-6">
            {[['login','Entrar'],['cadastro','Criar conta']].map(([t, l]) => (
              <button
                key={t}
                onClick={() => { setModo(t); setReset(false); limpar(); }}
                className={`btn flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${modo === t ? 'bg-[#c8f542] text-black' : 'text-zinc-500'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* ════════════ LOGIN ════════════ */}
          {modo === 'login' && !resetAberto && (
            <form onSubmit={login} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="E-mail ou nome de usuário"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inp}
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className={inp}
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-1 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                onClick={() => setReset(true)}
                className="text-zinc-500 text-sm text-center py-2 active:text-zinc-300 transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          )}

          {/* ════════════ RESET SENHA ════════════ */}
          {modo === 'login' && resetAberto && (
            <div className="flex flex-col gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2} className="w-5 h-5 flex-shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <div>
                  <p className="text-white text-sm font-semibold">Redefinir senha</p>
                  <p className="text-zinc-500 text-xs">Informe seu e-mail e a nova senha.</p>
                </div>
              </div>
              <input
                type="email"
                placeholder="E-mail da conta"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inp}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Nova senha"
                value={senhaNova}
                onChange={e => setSenhaNova(e.target.value)}
                className={inp}
              />
              <button
                onClick={resetSenha}
                disabled={loading}
                className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
              <button
                type="button"
                onClick={() => { setReset(false); setSenhaNova(''); }}
                className="text-zinc-500 text-sm text-center py-2 active:text-zinc-300 transition-colors"
              >
                ← Voltar ao login
              </button>
            </div>
          )}

          {/* ════════════ CADASTRO ════════════ */}
          {modo === 'cadastro' && (
            <div>
              <BarraEtapas etapa={etapa} total={3}/>

              {/* ── Etapa 0: dados de acesso ── */}
              {etapa === 0 && (
                <div className="flex flex-col gap-3">
                  <div className="mb-1">
                    <p className="text-white font-black text-xl">Criar sua conta</p>
                    <p className="text-zinc-500 text-sm mt-1">Dados de acesso</p>
                  </div>

                  <input
                    type="text"
                    placeholder="Nome de usuário"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className={inp}
                    autoComplete="username"
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={emailCad}
                    onChange={e => setEmailCad(e.target.value)}
                    className={inp}
                    autoComplete="email"
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={senhaCad}
                    onChange={e => setSenhaCad(e.target.value)}
                    className={inp}
                    autoComplete="new-password"
                  />

                  {senhaCad.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex flex-col gap-2">
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Requisitos da senha</p>
                      {[
                        [req.minimo,    'Mínimo 8 caracteres'],
                        [req.maiuscula, '1 letra maiúscula'],
                        [req.minuscula, '1 letra minúscula'],
                        [req.numero,    '1 número'],
                        [req.especial,  '1 caractere especial (!@#$...)'],
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
                    <input
                      type="password"
                      placeholder="Confirmar senha"
                      value={senhaConfirm}
                      onChange={e => setSenhaConfirm(e.target.value)}
                      className={`${inp} ${
                        senhaConfirm && senhaCad !== senhaConfirm ? 'border-red-500 focus:border-red-500'
                        : senhaConfirm && senhaCad === senhaConfirm ? 'border-[#c8f542]' : ''
                      }`}
                      autoComplete="new-password"
                    />
                    {senhaConfirm && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {senhaCad === senhaConfirm
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="#c8f542" strokeWidth={2.5} className="w-4 h-4"><path d="M20 6L9 17l-5-5"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        }
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={avancarEtapa}
                    className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-1"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* ── Etapa 1: dados físicos ── */}
              {etapa === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-1">
                    <button
                      onClick={() => setEtapa(0)}
                      className="btn w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0"
                    >
                      <IconBack/>
                    </button>
                    <div>
                      <p className="text-white font-black text-xl">Sobre você</p>
                      <p className="text-zinc-500 text-sm">Dados físicos para calcular suas metas</p>
                    </div>
                  </div>

                  {[
                    { label: 'Peso atual', placeholder: 'Ex: 75',  unit: 'kg',   val: peso,   set: setPeso   },
                    { label: 'Altura',     placeholder: 'Ex: 175', unit: 'cm',   val: altura, set: setAltura },
                    { label: 'Idade',      placeholder: 'Ex: 24',  unit: 'anos', val: idade,  set: setIdade  },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider ml-1 mb-1.5 block">{f.label}</label>
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 focus-within:border-[#c8f542] transition-colors">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder={f.placeholder}
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          className="flex-1 bg-transparent text-white py-4 outline-none text-base placeholder-zinc-600"
                        />
                        <span className="text-zinc-500 text-sm font-medium ml-2 flex-shrink-0">{f.unit}</span>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider ml-1 mb-2 block">Gênero biológico</label>
                    <div className="grid grid-cols-2 gap-2">
                      {opcoesGenero.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setGenero(id)}
                          className={`btn py-4 rounded-2xl font-semibold text-sm border transition-all ${
                            genero === id
                              ? 'bg-[#c8f542]/10 border-[#c8f542]/40 text-[#c8f542]'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 active:bg-zinc-800'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={avancarEtapa}
                    className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl mt-1"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* ── Etapa 2: objetivo + atividade ── */}
              {etapa === 2 && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 mb-1">
                    <button
                      onClick={() => setEtapa(1)}
                      className="btn w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0"
                    >
                      <IconBack/>
                    </button>
                    <div>
                      <p className="text-white font-black text-xl">Seu objetivo</p>
                      <p className="text-zinc-500 text-sm">Personaliza suas metas de macros</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider ml-1 mb-2 block">Objetivo principal</label>
                    <OpcoesBotoes opcoes={opcoesObjetivo} valor={obj} onChange={setObj}/>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider ml-1 mb-2 block">Nível de atividade física</label>
                    <OpcoesBotoes opcoes={opcoesAtividade} valor={atividade} onChange={setAtividade}/>
                  </div>

                  <button
                    type="button"
                    onClick={cadastro}
                    disabled={loading}
                    className="btn w-full py-4 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/>}
                    {loading ? 'Criando conta...' : 'Criar conta'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TelaAuth;