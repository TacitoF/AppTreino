import { MuscPeito, MuscCostas, MuscOmbro, MuscBiceps, MuscTriceps,
         MuscAbdomen, MuscQuad, MuscPost, MuscGluteo, MuscPanturr } from '../components/icons';

// ─── BANCO DE EXERCÍCIOS ─────────────────────────────────────────────────────
export const EXERCICIOS_DB = {
  superior: {
    label: 'Superior',
    musculos: {
      peito:       { label: 'Peito',      cor: '#ef4444', Svg: MuscPeito,   exercicios: ['Supino reto','Supino inclinado','Supino declinado','Crucifixo','Crossover','Flexão de braço','Peck deck','Pull-over'] },
      costas:      { label: 'Costas',     cor: '#3b82f6', Svg: MuscCostas,  exercicios: ['Puxada frontal','Puxada posterior','Remada curvada','Remada unilateral','Serrote','Levantamento terra','Pulldown','Remada cavalinho'] },
      ombro:       { label: 'Ombro',      cor: '#a855f7', Svg: MuscOmbro,   exercicios: ['Desenvolvimento militar','Elevação lateral','Elevação frontal','Crucifixo invertido','Desenvolvimento','Arnold press','Remada alta','Face pull','Encolhimento'] },
      biceps:      { label: 'Bíceps',     cor: '#f59e0b', Svg: MuscBiceps,  exercicios: ['Rosca direta','Rosca alternada','Rosca martelo','Rosca concentrada','Rosca scott','Rosca 21','Rosca cabo','Rosca inversa'] },
      triceps:     { label: 'Tríceps',    cor: '#ec4899', Svg: MuscTriceps, exercicios: ['Tríceps pulley','Tríceps testa','Tríceps francês','Mergulho','Tríceps coice','Tríceps corda','Tríceps banco','Fechado'] },
      abdomen:     { label: 'Abdômen',    cor: '#6366f1', Svg: MuscAbdomen, exercicios: ['Abdominal crunch','Prancha','Abdominal bicicleta','Elevação de pernas','Abdominal oblíquo','Rollout','Dragon flag','Abdominal infra'] },
    },
  },
  inferior: {
    label: 'Inferior',
    musculos: {
      quadriceps:  { label: 'Quadríceps', cor: '#10b981', Svg: MuscQuad,    exercicios: ['Agachamento livre','Leg press','Extensora','Hack squat','Agachamento búlgaro','Avanço','Afundo','Agachamento sumô'] },
      posterior:   { label: 'Posterior',  cor: '#06b6d4', Svg: MuscPost,    exercicios: ['Mesa flexora','Cadeira flexora','Stiff','Levantamento terra romeno','Bom dia','Leg curl','Flexão nórdica','Ponte'] },
      gluteo:      { label: 'Glúteo',     cor: '#f97316', Svg: MuscGluteo,  exercicios: ['Agachamento','Hip thrust','Elevação pélvica','Glúteo no cabo','Abdução','Passada','Agachamento sumô','Extensão quadril'] },
      panturrilha: { label: 'Panturrilha',cor: '#84cc16', Svg: MuscPanturr, exercicios: ['Elevação de calcanhar em pé','Elevação de calcanhar sentado','Leg press panturrilha','Donkey calf raise','Panturrilha unilateral'] },
    },
  },
};