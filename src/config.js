// Chaves de localStorage
export const REST_TIME_KEY = 'fitapp_rest_time';
export const PESO_KEY      = 'fitapp_peso_corporal';

// Rotas da API centralizadas — não altere sem atualizar o backend
export const R = {
  login:          '/api/login',
  registro:       '/api/registro',
  resetSenha:     '/api/reset-senha',
  splits:         '/api/splits',
  serie:          '/api/treino/serie',
  serieNome:      '/api/treino/serie/nome',
  historico:      '/api/treino/historico',
  historicoTodos: '/api/treino/historico/todos',
  editarUsuario:  '/api/usuario/editar',
  cardio:         '/api/cardio',
  relatorio:      '/api/treino/relatorio',
};