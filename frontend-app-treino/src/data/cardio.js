import { CardCorrida, CardBike, CardEliptico, CardEsteira, CardCorda,
         CardNatacao, CardRemo, CardHIIT, CardEscada, CardCaminhada } from '../components/icons';

export const ATIVIDADES_CARDIO = [
  { id: 'corrida',     label: 'Corrida',   cor: '#ef4444', Svg: CardCorrida,   met: { leve: 7.0, moderado: 9.8,  intenso: 14.5 } },
  { id: 'bike',        label: 'Bicicleta', cor: '#3b82f6', Svg: CardBike,      met: { leve: 5.8, moderado: 8.0,  intenso: 11.0 } },
  { id: 'eliptico',    label: 'Elíptico',  cor: '#a855f7', Svg: CardEliptico,  met: { leve: 4.6, moderado: 7.0,  intenso: 9.5  } },
  { id: 'esteira',     label: 'Esteira',   cor: '#06b6d4', Svg: CardEsteira,   met: { leve: 3.5, moderado: 5.0,  intenso: 6.5  } },
  { id: 'pular_corda', label: 'Corda',     cor: '#f59e0b', Svg: CardCorda,     met: { leve: 8.8, moderado: 11.8, intenso: 14.0 } },
  { id: 'natacao',     label: 'Natação',   cor: '#0ea5e9', Svg: CardNatacao,   met: { leve: 5.8, moderado: 8.3,  intenso: 10.0 } },
  { id: 'remo',        label: 'Remo',      cor: '#14b8a6', Svg: CardRemo,      met: { leve: 4.5, moderado: 7.0,  intenso: 10.5 } },
  { id: 'hiit',        label: 'HIIT',      cor: '#f97316', Svg: CardHIIT,      met: { leve: 7.0, moderado: 10.0, intenso: 14.0 } },
  { id: 'escada',      label: 'Escada',    cor: '#84cc16', Svg: CardEscada,    met: { leve: 4.0, moderado: 6.0,  intenso: 9.0  } },
  { id: 'caminhada',   label: 'Caminhada', cor: '#10b981', Svg: CardCaminhada, met: { leve: 2.5, moderado: 3.5,  intenso: 4.5  } },
];

export const INTENSIDADE = [
  { id: 'leve',     label: 'Leve',     desc: 'Respira normal, conversa fácil',    cor: '#60a5fa' },
  { id: 'moderado', label: 'Moderado', desc: 'Leve falta de ar, ainda conversa',  cor: '#c8f542' },
  { id: 'intenso',  label: 'Intenso',  desc: 'Difícil conversar, muito suado',    cor: '#f97316' },
];

export function calcularKcal(met, pesoKg, minutos) {
  return Math.round(met * pesoKg * (minutos / 60));
}

export const PESO_KEY = 'fitapp_peso_corporal';