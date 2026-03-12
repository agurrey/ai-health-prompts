export interface PromptMeta {
  slug: string;
  icon: string;
  titleEn: string;
  titleEs: string;
  descEn: string;
  descEs: string;
  filename: string;
}

export const PROMPTS: PromptMeta[] = [
  {
    slug: 'spinal-health',
    icon: 'spine',
    titleEn: 'My back hurts',
    titleEs: 'Me duele la espalda',
    descEn: 'Evidence-based spinal health coach for desk workers and post-rehab. Intake, phases, exercise progressions.',
    descEs: 'Coach de salud espinal basado en evidencia para oficinistas y post-rehabilitación.',
    filename: 'sedentary_spinal_health.md',
  },
  {
    slug: 'crossfit',
    icon: 'barbell',
    titleEn: 'Program my CrossFit',
    titleEs: 'Programa mi CrossFit',
    descEn: 'Periodized CrossFit programming with triple-block structure. Competition and recreational tracks.',
    descEs: 'Programación periodizada de CrossFit con estructura de triple bloque. Pistas de competición y recreativas.',
    filename: 'crossfit_triple_block.md',
  },
  {
    slug: 'nutrition',
    icon: 'leaf-plate',
    titleEn: 'I want to eat better',
    titleEs: 'Quiero comer mejor',
    descEn: 'Whole-food nutrition coach. No diets, no supplements — real food, sustainable habits, NOVA framework.',
    descEs: 'Coach de nutrición con comida real. Sin dietas, sin suplementos — comida real, hábitos sostenibles, marco NOVA.',
    filename: 'whole_food_nutrition.md',
  },
  {
    slug: 'sleep',
    icon: 'moon-stars',
    titleEn: "I can't sleep",
    titleEs: 'No puedo dormir',
    descEn: 'Sleep optimization protocol. Circadian rhythm, sleep hygiene, CBT-I techniques, environment setup.',
    descEs: 'Protocolo de optimización del sueño. Ritmo circadiano, higiene del sueño, técnicas CBT-I, entorno.',
    filename: 'sleep_optimization.md',
  },
  {
    slug: 'pelvic-floor',
    icon: 'meditation',
    titleEn: 'Pelvic floor health',
    titleEs: 'Salud del suelo pélvico',
    descEn: 'Pelvic floor and deep core coach for all genders. Breathing, strength, recovery — not just Kegels.',
    descEs: 'Coach de suelo pélvico y core profundo para todos los géneros. Respiración, fuerza, recuperación.',
    filename: 'pelvic_floor_health.md',
  },
  {
    slug: 'walking-habit',
    icon: 'sunrise',
    titleEn: 'Start walking',
    titleEs: 'Empieza a caminar',
    descEn: 'Walking habit builder using Tiny Habits methodology. From 5 minutes to 60, with micro-habit stacking.',
    descEs: 'Constructor de hábito de caminar con metodología Tiny Habits. De 5 minutos a 60, con apilamiento de micro-hábitos.',
    filename: 'walking_habit.md',
  },
];
