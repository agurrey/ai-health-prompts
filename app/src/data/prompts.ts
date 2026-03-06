export interface PromptModule {
  slug: string;
  title: string;
  title_es: string;
  tagline: string;
  tagline_es: string;
  description: string;
  description_es: string;
  icon: string;
  promptFile: string;
  promptFile_es: string;
  tags: string[];
}

export const prompts: PromptModule[] = [
  {
    slug: 'back-pain',
    title: 'Desk Worker Back Pain',
    title_es: 'Dolor de Espalda (Sedentarios)',
    tagline: 'AI protocol for desk workers with back pain',
    tagline_es: 'Protocolo IA para trabajadores de escritorio con dolor de espalda',
    description: 'Back pain & mobility protocol for desk workers. McGill Big 3, movement snacks, ergonomics, pain education. Phase 0-3 progression with gates. Includes injury decision trees and red flag screening.',
    description_es: 'Protocolo de dolor de espalda y movilidad para trabajadores de escritorio. McGill Big 3, snacks de movimiento, ergonomía, educación del dolor. Progresión Fase 0-3 con puertas. Incluye árboles de decisión de lesiones y cribado de banderas rojas.',
    icon: '🦴',
    promptFile: 'sedentary_spinal_health.md',
    promptFile_es: 'sedentary_spinal_health_es.md',
    tags: ['back pain', 'desk worker', 'mobility', 'rehab'],
  },
  {
    slug: 'dumbbell',
    title: 'Home Training',
    title_es: 'Entrenamiento en Casa',
    tagline: 'Full-body training with 2 pairs of dumbbells',
    tagline_es: 'Entrenamiento de cuerpo completo con 2 pares de mancuernas',
    description: 'Complete home training system using only 2 pairs of dumbbells. 50+ exercises across 5 movement patterns (squat, hinge, push, pull, carry). 7-step progression ladder for limited equipment. Phase 1-4 with maintenance mode.',
    description_es: 'Sistema completo de entrenamiento en casa con solo 2 pares de mancuernas. 50+ ejercicios en 5 patrones de movimiento (sentadilla, bisagra, empuje, tirón, acarreo). Escalera de progresión de 7 pasos para equipamiento limitado. Fase 1-4 con modo mantenimiento.',
    icon: '💪',
    promptFile: 'dumbbell_home_training.md',
    promptFile_es: 'dumbbell_home_training_es.md',
    tags: ['home training', 'dumbbells', 'strength', 'minimal equipment'],
  },
  {
    slug: 'nutrition',
    title: 'Whole Food Nutrition',
    title_es: 'Nutrición Real',
    tagline: 'Eat real food. No calorie counting.',
    tagline_es: 'Come comida real. Sin contar calorías.',
    description: 'Zero ultra-processed eating framework based on NOVA classification. Visual plate model, hand-based portions, 8-week transition system. Budget strategies, batch cooking templates, and decision trees by goal.',
    description_es: 'Marco de alimentación sin ultraprocesados basado en clasificación NOVA. Modelo visual de plato, porciones con la mano, sistema de transición de 8 semanas. Estrategias de presupuesto, plantillas de batch cooking y árboles de decisión por objetivo.',
    icon: '🥗',
    promptFile: 'whole_food_nutrition.md',
    promptFile_es: 'whole_food_nutrition_es.md',
    tags: ['nutrition', 'whole food', 'meal planning', 'NOVA'],
  },
  {
    slug: 'sleep',
    title: 'Sleep Optimization',
    title_es: 'Optimización del Sueño',
    tagline: 'Fix your sleep with behavior, not supplements',
    tagline_es: 'Arregla tu sueño con hábitos, no suplementos',
    description: 'Evidence-based sleep protocol. Circadian rhythm management, 3-tier sleep hygiene (14 rules), breathing techniques, Phase 1-4 implementation. Decision trees by problem type and lifestyle.',
    description_es: 'Protocolo de sueño basado en evidencia. Gestión del ritmo circadiano, higiene del sueño de 3 niveles (14 reglas), técnicas de respiración, implementación Fase 1-4. Árboles de decisión por tipo de problema y estilo de vida.',
    icon: '😴',
    promptFile: 'sleep_optimization.md',
    promptFile_es: 'sleep_optimization_es.md',
    tags: ['sleep', 'circadian rhythm', 'recovery', 'habits'],
  },
  {
    slug: 'crossfit',
    title: 'CrossFit Programming',
    title_es: 'Programación CrossFit',
    tagline: 'Periodized Oly + Strength + Conditioning cycles',
    tagline_es: 'Ciclos periodizados de Oly + Fuerza + Acondicionamiento',
    description: 'Hybrid Olympic lifting + Strength + Conditioning programming. Triple block system with 4-7 week cycles, autoregulation, competition peaking, and injury decision trees for athletes.',
    description_es: 'Programación híbrida de halterofilia + Fuerza + Acondicionamiento. Sistema de triple bloque con ciclos de 4-7 semanas, autorregulación, pico de competición y árboles de decisión de lesiones para atletas.',
    icon: '🏋️',
    promptFile: 'crossfit_triple_block.md',
    promptFile_es: 'crossfit_triple_block_es.md',
    tags: ['crossfit', 'olympic lifting', 'conditioning', 'programming'],
  },
  {
    slug: 'pelvic-floor',
    title: 'Pelvic Floor Health',
    title_es: 'Salud del Suelo Pelvico',
    tagline: 'Breathing, strength & recovery for all genders',
    tagline_es: 'Respiracion, fuerza y recuperacion para todos',
    description: 'Pelvic floor protocol for all genders. Hypertonic vs hypotonic screening, diaphragm-PF piston breathing, Kegels + reverse Kegels, functional integration. Covers postpartum, desk workers, athletes, men\'s health, and red flag referral.',
    description_es: 'Protocolo de suelo pelvico para todos. Cribado hipertonico vs hipotonico, respiracion piston diafragma-SP, Kegels + Kegels inversos, integracion funcional. Cubre postparto, sedentarios, atletas, salud masculina y derivacion por banderas rojas.',
    icon: '\u{1FAC0}',
    promptFile: 'pelvic_floor_health.md',
    promptFile_es: 'pelvic_floor_health_es.md',
    tags: ['pelvic floor', 'breathing', 'postpartum', 'men\'s health', 'incontinence'],
  },
];
