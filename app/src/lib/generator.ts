import {
  Exercise,
  Pattern,
  Level,
  exercises,
  filterByLevel,
  filterByRestrictions,
  getExercisesByPattern,
} from '@/data/exercises';
import { createSeededRandom, seededShuffle, seededPick, getDayOfWeek } from './seed';

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'warrior';

export interface WarmupExercise {
  name: string;
  prescription: string;
  cue: string;
  cue_es: string;
  demoSearch?: string;
  demoChannel?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  load: string;
  rest: string;
  tempo?: string;
}

export interface WarriorWod {
  format: string;
  format_es: string;
  movements: { name: string; reps: string; load: string; demoSearch: string; demoChannel: string }[];
  timecap: string;
  note: string;
  note_es: string;
}

export interface Session {
  date: string;
  level: UserLevel;
  lightKg: number;
  heavyKg: number;
  restrictions: string[];
  sessionType: string;
  sessionType_es: string;
  warmup: WarmupExercise[];
  strength: WorkoutExercise[];
  finisher: WorkoutExercise[];
  warrior?: WarriorWod;
  strategy: string;
  strategy_es: string;
  duration: number;
}

interface SessionTemplate {
  type: string;
  type_es: string;
  patterns: Pattern[];
  strategy: string;
  strategy_es: string;
}

const SESSION_TEMPLATES: Record<number, SessionTemplate> = {
  1: { // Monday — Lower + Push
    type: 'Lower + Push',
    type_es: 'Tren inferior + Empuje',
    patterns: ['squat', 'hinge', 'push', 'carry'],
    strategy: 'Start the week strong. Focus on bracing before every squat and hinge rep. Control the weight down — tempo matters more than speed.',
    strategy_es: 'Empieza la semana fuerte. Enfócate en el bracing antes de cada rep de sentadilla y bisagra. Controla el peso en la bajada — el tempo importa más que la velocidad.',
  },
  2: { // Tuesday — Upper + Pull
    type: 'Upper + Pull',
    type_es: 'Tren superior + Tirón',
    patterns: ['push', 'pull', 'pull', 'carry'],
    strategy: 'Pull day: squeeze your shoulder blades on every row. On presses, elbows at 45 degrees, not 90. Finish with a carry for posture.',
    strategy_es: 'Día de tirón: aprieta las escápulas en cada remo. En los press, codos a 45 grados, no 90. Termina con un acarreo para la postura.',
  },
  3: { // Wednesday — Full body
    type: 'Full Body',
    type_es: 'Cuerpo Completo',
    patterns: ['squat', 'hinge', 'push', 'pull', 'carry'],
    strategy: 'Mid-week full body: one exercise per pattern. Keep it crisp. If anything feels off, lighten the load — save intensity for Thursday.',
    strategy_es: 'Cuerpo completo de mitad de semana: un ejercicio por patrón. Mantenlo limpio. Si algo no se siente bien, baja el peso — guarda intensidad para el jueves.',
  },
  4: { // Thursday — Lower + Push
    type: 'Lower + Push',
    type_es: 'Tren inferior + Empuje',
    patterns: ['squat', 'hinge', 'push', 'carry'],
    strategy: 'Second lower day this week. If your legs are still sore from Monday, use lighter variations or add tempo to reduce load. Soreness is not an excuse to skip.',
    strategy_es: 'Segundo día de pierna esta semana. Si tus piernas siguen doloridas del lunes, usa variaciones más ligeras o añade tempo para reducir carga. Las agujetas no son excusa para saltarse el día.',
  },
  5: { // Friday — Upper + Pull
    type: 'Upper + Pull',
    type_es: 'Tren superior + Tirón',
    patterns: ['push', 'pull', 'pull', 'carry'],
    strategy: 'End-of-week upper session. Push your rows hard today — back work can handle high volume. Keep presses strict, no arching.',
    strategy_es: 'Sesión de tren superior de fin de semana. Empuja fuerte en los remos hoy — la espalda tolera alto volumen. Mantén los press estrictos, sin arquear.',
  },
  6: { // Saturday — Conditioning
    type: 'Conditioning Circuit',
    type_es: 'Circuito de Acondicionamiento',
    patterns: ['squat', 'hinge', 'push', 'pull', 'carry'],
    strategy: 'Saturday circuit: keep moving, shorter rest. This is about work capacity, not max strength. Focus on breathing and keeping form clean when tired.',
    strategy_es: 'Circuito del sábado: sigue moviéndote, menos descanso. Esto va de capacidad de trabajo, no de fuerza máxima. Enfócate en respirar y mantener la forma limpia cuando te canses.',
  },
  0: { // Sunday — Active recovery
    type: 'Active Recovery',
    type_es: 'Recuperación Activa',
    patterns: ['carry', 'carry'],
    strategy: 'Recovery day: mobility and carries only. Walk after this. No heavy work — your body adapts during rest, not during training.',
    strategy_es: 'Día de recuperación: solo movilidad y acarreos. Camina después. Nada pesado — tu cuerpo se adapta durante el descanso, no durante el entrenamiento.',
  },
};

const WARMUP: WarmupExercise[] = [
  {
    name: 'Cat-Camel',
    prescription: '5 slow cycles',
    cue: 'Spine mobility, not a stretch — flow through each position',
    cue_es: 'Movilidad de columna, no estiramiento — fluye por cada posición',
    demoSearch: 'cat camel exercise McGill',
    demoChannel: 'Stuart McGill',
  },
  {
    name: "World's Greatest Stretch",
    prescription: '3 reps/side',
    cue: 'Hip + T-spine + hamstring in one movement',
    cue_es: 'Cadera + columna torácica + isquios en un movimiento',
    demoSearch: 'worlds greatest stretch',
    demoChannel: 'Squat University',
  },
];

function getLevelNumber(level: UserLevel): Level {
  switch (level) {
    case 'beginner': return 1;
    case 'intermediate': return 2;
    case 'advanced': return 3;
    case 'warrior': return 3;
  }
}

function getLevelTemplate(level: UserLevel) {
  switch (level) {
    case 'beginner':
      return { sets: 3, reps: '8-10', rest: '90s', tempo: undefined };
    case 'intermediate':
      return { sets: 3, reps: '8-12', rest: '60-90s', tempo: undefined };
    case 'advanced':
      return { sets: 4, reps: '6-10', rest: '60s', tempo: '3-1-2' };
    case 'warrior':
      return { sets: 4, reps: '6-10', rest: '60s', tempo: '3-1-2' };
  }
}

function getLoadLabel(exercise: Exercise, lightKg: number, heavyKg: number): string {
  switch (exercise.load) {
    case 'heavy': return `${heavyKg}kg`;
    case 'light': return `${lightKg}kg`;
    case 'bodyweight': return 'BW';
  }
}

// Get exercise IDs used on a given date (lightweight, no full session build)
function getUsedExerciseIds(date: string, level: UserLevel, restrictions: string[]): Set<string> {
  const dayOfWeek = getDayOfWeek(date);
  const template = SESSION_TEMPLATES[dayOfWeek];
  const random = createSeededRandom(`${date}-${level}`);
  const maxLevel = getLevelNumber(level);
  const ids = new Set<string>();

  for (const pattern of template.patterns) {
    let pool = getExercisesByPattern(pattern);
    pool = filterByLevel(pool, maxLevel);
    pool = filterByRestrictions(pool, restrictions);
    pool = pool.filter(e => !ids.has(e.id));
    if (pool.length === 0) continue;
    const shuffled = seededShuffle(pool, random);
    ids.add(shuffled[0].id);
  }
  // Finisher
  if (dayOfWeek !== 0) {
    let pool = getExercisesByPattern('carry');
    pool = filterByLevel(pool, maxLevel);
    pool = filterByRestrictions(pool, restrictions);
    pool = pool.filter(e => !ids.has(e.id));
    if (pool.length > 0) {
      const shuffled = seededShuffle(pool, random);
      ids.add(shuffled[0].id);
    }
  }
  return ids;
}

function getPreviousDate(date: string, daysBack: number): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().split('T')[0];
}

export function generateSession(
  date: string,
  level: UserLevel,
  lightKg: number,
  heavyKg: number,
  restrictions: string[]
): Session {
  const dayOfWeek = getDayOfWeek(date);
  const template = SESSION_TEMPLATES[dayOfWeek];
  const random = createSeededRandom(`${date}-${level}`);
  const maxLevel = getLevelNumber(level);
  const levelTemplate = getLevelTemplate(level);

  // Get exercises used in the last 2 days to avoid repeats
  const recentIds = new Set<string>();
  for (let d = 1; d <= 2; d++) {
    const prevDate = getPreviousDate(date, d);
    for (const id of getUsedExerciseIds(prevDate, level, restrictions)) {
      recentIds.add(id);
    }
  }

  // Track used exercises to avoid duplicates in same session
  const usedIds = new Set<string>();

  function pickExercise(pattern: Pattern): Exercise | null {
    let pool = getExercisesByPattern(pattern);
    pool = filterByLevel(pool, maxLevel);
    pool = filterByRestrictions(pool, restrictions);
    pool = pool.filter(e => !usedIds.has(e.id));

    // Try to avoid recent exercises, but fall back if pool would be empty
    const fresh = pool.filter(e => !recentIds.has(e.id));
    if (fresh.length > 0) pool = fresh;

    if (pool.length === 0) return null;

    const shuffled = seededShuffle(pool, random);
    const picked = shuffled[0];
    usedIds.add(picked.id);
    return picked;
  }

  // Build strength block
  const strength: WorkoutExercise[] = [];
  for (const pattern of template.patterns) {
    const exercise = pickExercise(pattern);
    if (!exercise) continue;

    // Conditioning day: less sets, more reps
    const isConditioning = dayOfWeek === 6;
    const sets = isConditioning ? 3 : levelTemplate.sets;
    const reps = isConditioning ? '12-15' : levelTemplate.reps;
    const rest = isConditioning ? '45s' : levelTemplate.rest;

    strength.push({
      exercise,
      sets,
      reps,
      load: getLoadLabel(exercise, lightKg, heavyKg),
      rest,
      tempo: isConditioning ? undefined : levelTemplate.tempo,
    });
  }

  // Build finisher (core or carry, alternating)
  const finisher: WorkoutExercise[] = [];
  if (dayOfWeek !== 0) { // No finisher on recovery day
    const finisherExercise = pickExercise('carry');
    if (finisherExercise) {
      const isCarry = finisherExercise.load !== 'bodyweight';
      finisher.push({
        exercise: finisherExercise,
        sets: 2,
        reps: isCarry ? '30s' : '8/side',
        load: getLoadLabel(finisherExercise, lightKg, heavyKg),
        rest: '60s',
      });
    }
  }

  // Movement prep warmup addition
  const movementPrepExercise = strength[0]?.exercise;
  const warmup = [
    ...WARMUP,
    ...(movementPrepExercise ? [{
      name: `${movementPrepExercise.name} (light)`,
      prescription: '10 reps',
      cue: 'Movement prep — easy pace, focus on form',
      cue_es: 'Preparación del movimiento — ritmo suave, foco en forma',
      demoSearch: movementPrepExercise.demoSearch,
      demoChannel: movementPrepExercise.demoChannel,
    }] : []),
  ];

  // Warrior WOD: for warrior level (always) or Saturday conditioning for all levels
  let warrior: WarriorWod | undefined;
  if (level === 'warrior') {
    warrior = generateWarriorWod(date, heavyKg, restrictions);
  } else if (dayOfWeek === 6) {
    // Saturday conditioning uses WOD format for all levels
    warrior = generateConditioningWod(date, heavyKg, level, restrictions);
  }

  // Duration estimate
  const strengthMinutes = strength.length * 4; // ~4 min per exercise
  const duration = level === 'warrior'
    ? (warrior ? parseInt(warrior.timecap) + 5 : 20)
    : 3 + strengthMinutes + (finisher.length > 0 ? 3 : 0) + (warrior ? 10 : 0);

  if (level === 'warrior') {
    return {
      date,
      level,
      lightKg,
      heavyKg,
      restrictions,
      sessionType: 'WARRIOR WOD',
      sessionType_es: 'WARRIOR WOD',
      warmup: [WARMUP[0]], // Just Cat-Camel as minimal warmup
      strength: [],
      finisher: [],
      warrior,
      strategy: 'This is pure conditioning. No pacing, no saving energy. Go as hard as you can sustain. Rest only when prescribed by the format.',
      strategy_es: 'Esto es acondicionamiento puro. Sin dosificar, sin guardar energía. Ve tan fuerte como puedas mantener. Descansa solo cuando lo indique el formato.',
      duration,
    };
  }

  return {
    date,
    level,
    lightKg,
    heavyKg,
    restrictions,
    sessionType: template.type,
    sessionType_es: template.type_es,
    warmup,
    strength,
    finisher,
    warrior,
    strategy: template.strategy,
    strategy_es: template.strategy_es,
    duration,
  };
}

interface WodMovement {
  name: string;
  reps: string;
  load: string;
  needs?: string[];
  demoSearch: string;
  demoChannel: string;
}

const WARRIOR_MOVEMENTS: WodMovement[] = [
  { name: 'DB Thrusters', reps: '15', load: 'heavy', needs: ['!knee_pain', '!hip_pain', '!foot_pain'], demoSearch: 'dumbbell thruster', demoChannel: 'Squat University' },
  { name: 'Burpee Over DB', reps: '15', load: 'BW', needs: ['!wrist_pain', '!low_back', '!foot_pain'], demoSearch: 'burpee over dumbbell', demoChannel: 'Squat University' },
  { name: 'DB Swing', reps: '20', load: 'heavy', needs: ['!low_back', '!foot_pain'], demoSearch: 'dumbbell swing two hand', demoChannel: 'Dan John' },
  { name: 'Burpees', reps: '20', load: 'BW', needs: ['!wrist_pain', '!low_back', '!foot_pain'], demoSearch: 'burpee form', demoChannel: 'Squat University' },
  { name: 'DB Snatch (alt.)', reps: '10/arm', load: 'heavy', needs: ['!shoulder_pain', '!low_back', '!foot_pain'], demoSearch: 'dumbbell snatch', demoChannel: 'Squat University' },
  { name: 'DB Devil Press', reps: '10', load: 'heavy', needs: ['!low_back', '!shoulder_pain', '!wrist_pain', '!foot_pain'], demoSearch: 'devil press dumbbell', demoChannel: 'Squat University' },
  { name: 'DB Goblet Squat', reps: '20', load: 'heavy', needs: ['!knee_pain', '!foot_pain'], demoSearch: 'goblet squat dumbbell', demoChannel: 'Squat University' },
  { name: 'DB Floor Press', reps: '20', load: 'heavy', demoSearch: 'dumbbell floor press', demoChannel: 'Squat University' },
  { name: 'DB Renegade Row', reps: '8/arm', load: 'heavy', needs: ['!wrist_pain'], demoSearch: 'renegade row dumbbell', demoChannel: 'Jeff Nippard' },
  { name: 'DB Sumo Deadlift High Pull', reps: '15', load: 'heavy', needs: ['!low_back', '!hip_pain', '!foot_pain'], demoSearch: 'dumbbell sumo deadlift high pull', demoChannel: 'Squat University' },
  { name: 'DB Man Makers', reps: '8', load: 'heavy', needs: ['!wrist_pain', '!shoulder_pain', '!low_back', '!foot_pain'], demoSearch: 'man maker dumbbell', demoChannel: 'Squat University' },
  { name: 'DB Hang Clean & Press', reps: '10', load: 'heavy', needs: ['!shoulder_pain', '!foot_pain'], demoSearch: 'dumbbell hang clean and press', demoChannel: 'Squat University' },
  { name: 'DB Walking Lunges', reps: '20', load: 'heavy', needs: ['!knee_pain', '!foot_pain', '!hip_pain'], demoSearch: 'dumbbell walking lunge', demoChannel: 'Squat University' },
  { name: 'Push-Up to Renegade Row', reps: '8/arm', load: 'heavy', needs: ['!wrist_pain', '!shoulder_pain'], demoSearch: 'push up renegade row', demoChannel: 'Jeff Nippard' },
  { name: 'DB Front Squat', reps: '15', load: 'heavy', needs: ['!knee_pain', '!foot_pain'], demoSearch: 'dumbbell front squat', demoChannel: 'Squat University' },
  { name: 'Sprawls', reps: '15', load: 'BW', needs: ['!low_back', '!wrist_pain', '!foot_pain'], demoSearch: 'sprawl exercise', demoChannel: 'Squat University' },
];

const WARRIOR_FORMATS = [
  { format: '5 Rounds For Time', format_es: '5 Rondas Por Tiempo', movements: 3, timecap: '15 min' },
  { format: '4 Rounds For Time', format_es: '4 Rondas Por Tiempo', movements: 4, timecap: '18 min' },
  { format: 'AMRAP 15 min', format_es: 'AMRAP 15 min', movements: 4, timecap: '15 min' },
  { format: 'EMOM 16 min (4 stations)', format_es: 'EMOM 16 min (4 estaciones)', movements: 4, timecap: '16 min' },
  { format: '3 Rounds For Time', format_es: '3 Rondas Por Tiempo', movements: 5, timecap: '20 min' },
  { format: '21-15-9 For Time', format_es: '21-15-9 Por Tiempo', movements: 2, timecap: '12 min' },
  { format: '10-9-8-7-6-5-4-3-2-1 For Time', format_es: '10-9-8-7-6-5-4-3-2-1 Por Tiempo', movements: 2, timecap: '15 min' },
];

function generateWarriorWod(date: string, heavyKg: number, restrictions: string[]): WarriorWod {
  const random = createSeededRandom(`warrior-${date}`);

  // Filter movements by restrictions
  const available = WARRIOR_MOVEMENTS.filter(m => {
    if (!m.needs) return true;
    return m.needs.every(n => {
      const restriction = n.replace('!', '');
      return !restrictions.includes(restriction);
    });
  });

  // Pick format
  const formatIdx = Math.floor(random() * WARRIOR_FORMATS.length);
  const wodFormat = WARRIOR_FORMATS[formatIdx];

  // Pick movements
  const shuffled = seededShuffle(available, random);
  const picked = shuffled.slice(0, wodFormat.movements);

  return {
    format: wodFormat.format,
    format_es: wodFormat.format_es,
    movements: picked.map(m => ({
      name: m.name,
      reps: m.reps,
      load: m.load === 'heavy' ? `${heavyKg}kg` : m.load,
      demoSearch: m.demoSearch,
      demoChannel: m.demoChannel,
    })),
    timecap: wodFormat.timecap,
    note: 'No rest between movements. Only rest between rounds. This should hurt. If it doesn\'t, go heavier or faster.',
    note_es: 'Sin descanso entre movimientos. Solo entre rondas. Esto tiene que doler. Si no duele, sube el peso o ve más rápido.',
  };
}

const CONDITIONING_MOVEMENTS: WodMovement[] = [
  { name: 'DB Goblet Squat', reps: '12', load: 'heavy', needs: ['!knee_pain', '!foot_pain'], demoSearch: 'goblet squat dumbbell', demoChannel: 'Squat University' },
  { name: 'Push-Ups', reps: '10', load: 'BW', needs: ['!wrist_pain'], demoSearch: 'push up form', demoChannel: 'Squat University' },
  { name: 'DB Bent-Over Row', reps: '10', load: 'heavy', needs: ['!low_back'], demoSearch: 'dumbbell bent over row', demoChannel: 'Squat University' },
  { name: 'DB RDL', reps: '10', load: 'heavy', needs: ['!low_back', '!foot_pain'], demoSearch: 'dumbbell romanian deadlift', demoChannel: 'Squat University' },
  { name: 'DB Floor Press', reps: '10', load: 'heavy', demoSearch: 'dumbbell floor press', demoChannel: 'Squat University' },
  { name: 'DB Swing', reps: '15', load: 'heavy', needs: ['!low_back', '!foot_pain'], demoSearch: 'dumbbell swing two hand', demoChannel: 'Dan John' },
  { name: 'Air Squats', reps: '15', load: 'BW', needs: ['!knee_pain', '!foot_pain'], demoSearch: 'air squat form', demoChannel: 'Squat University' },
  { name: 'DB Thrusters', reps: '10', load: 'heavy', needs: ['!knee_pain', '!shoulder_pain', '!foot_pain'], demoSearch: 'dumbbell thruster', demoChannel: 'Squat University' },
  { name: 'Farmer Carry', reps: '30s', load: 'heavy', needs: ['!foot_pain'], demoSearch: 'farmer carry dumbbell', demoChannel: 'Dan John' },
  { name: 'DB Reverse Fly', reps: '12', load: 'light', demoSearch: 'dumbbell reverse fly', demoChannel: 'Jeff Nippard' },
  { name: 'Glute Bridge', reps: '15', load: 'BW', demoSearch: 'glute bridge form', demoChannel: 'Bret Contreras' },
  { name: 'DB OHP', reps: '8', load: 'light', needs: ['!shoulder_pain'], demoSearch: 'dumbbell overhead press', demoChannel: 'Squat University' },
];

const CONDITIONING_FORMATS = [
  { format: '3 Rounds For Time', format_es: '3 Rondas Por Tiempo', movements: 3, timecap: '10 min' },
  { format: 'AMRAP 8 min', format_es: 'AMRAP 8 min', movements: 3, timecap: '8 min' },
  { format: 'AMRAP 10 min', format_es: 'AMRAP 10 min', movements: 3, timecap: '10 min' },
  { format: 'EMOM 10 min (alternating)', format_es: 'EMOM 10 min (alternando)', movements: 2, timecap: '10 min' },
  { format: '4 Rounds For Time', format_es: '4 Rondas Por Tiempo', movements: 3, timecap: '12 min' },
];

function generateConditioningWod(date: string, heavyKg: number, level: UserLevel, restrictions: string[]): WarriorWod {
  const random = createSeededRandom(`conditioning-${date}-${level}`);

  const available = CONDITIONING_MOVEMENTS.filter(m => {
    if (!m.needs) return true;
    return m.needs.every(n => {
      const restriction = n.replace('!', '');
      return !restrictions.includes(restriction);
    });
  });

  const formatIdx = Math.floor(random() * CONDITIONING_FORMATS.length);
  const wodFormat = CONDITIONING_FORMATS[formatIdx];

  const shuffled = seededShuffle(available, random);
  const picked = shuffled.slice(0, wodFormat.movements);

  return {
    format: wodFormat.format,
    format_es: wodFormat.format_es,
    movements: picked.map(m => ({
      name: m.name,
      reps: m.reps,
      load: m.load === 'heavy' ? `${heavyKg}kg` : m.load === 'light' ? 'light' : m.load,
      demoSearch: m.demoSearch,
      demoChannel: m.demoChannel,
    })),
    timecap: wodFormat.timecap,
    note: 'Saturday conditioning: keep moving, maintain form. Rest between rounds only.',
    note_es: 'Acondicionamiento del sábado: sigue moviéndote, mantén la forma. Descansa solo entre rondas.',
  };
}
