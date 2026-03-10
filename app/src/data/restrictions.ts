export type Restriction = 'shoulder_pain' | 'low_back' | 'knee_pain' | 'hip_pain' | 'foot_pain' | 'wrist_pain' | 'no_pullup_bar' | 'pelvic_floor';
export type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'carry';

export interface RestrictionConfig {
  id: Restriction;
  label: string;
  label_es: string;
}

export interface PatternSubstitution {
  reducePattern: Pattern;
  increasePattern: Pattern;
  volumeReduction: number;
}

export interface RestrictionMap {
  restriction: Restriction;
  recommendedExerciseIds: string[];
  patternSubstitutions: PatternSubstitution[];
}

export const RESTRICTIONS: RestrictionConfig[] = [
  { id: 'shoulder_pain', label: 'Shoulder pain', label_es: 'Dolor de hombro' },
  { id: 'low_back', label: 'Low back pain', label_es: 'Dolor lumbar' },
  { id: 'knee_pain', label: 'Knee pain', label_es: 'Dolor de rodilla' },
  { id: 'hip_pain', label: 'Hip pain', label_es: 'Dolor de cadera' },
  { id: 'foot_pain', label: "Can't bear weight on feet", label_es: 'Sin apoyo de pies' },
  { id: 'wrist_pain', label: 'Wrist pain', label_es: 'Dolor de muneca' },
  { id: 'no_pullup_bar', label: 'No pull-up bar', label_es: 'Sin barra de dominadas' },
  { id: 'pelvic_floor', label: 'Pelvic floor / Postpartum', label_es: 'Suelo pelvico / Postparto' },
];

export const RESTRICTION_MAPS: RestrictionMap[] = [
  {
    restriction: 'knee_pain',
    recommendedExerciseIds: [
      'step-up-low',
      'wall-sit',
      'box-squat',
      'isometric-split-squat',
      'db-wall-squat',
      'glute-bridge',
      'hip-thrust',
      'db-rdl',
      'b-stance-rdl',
      'isometric-bridge-hold',
    ],
    patternSubstitutions: [
      { reducePattern: 'squat', increasePattern: 'hinge', volumeReduction: 0.4 },
    ],
  },
  {
    restriction: 'low_back',
    recommendedExerciseIds: [
      'mcgill-curl-up',
      'bird-dog-pause',
      'side-plank',
      'dead-bug',
      'db-pallof-press',
      'chest-supported-row',
      'db-seal-row',
      'glute-bridge',
      'single-leg-glute-bridge',
      'hip-thrust',
    ],
    patternSubstitutions: [],
  },
  {
    restriction: 'shoulder_pain',
    recommendedExerciseIds: [
      'db-floor-press',
      'db-squeeze-press',
      'prone-iytw',
      'db-face-pull',
      'db-reverse-fly',
      'chest-supported-row',
      'half-kneeling-press',
      'wall-pushup',
      'incline-pushup',
    ],
    patternSubstitutions: [],
  },
  {
    restriction: 'hip_pain',
    recommendedExerciseIds: [
      'box-squat',
      'step-up-low',
      'isometric-split-squat',
      'glute-bridge',
      'b-stance-rdl',
      'kickstand-deadlift',
      'bird-dog',
      'dead-bug',
      'db-pallof-press',
    ],
    patternSubstitutions: [
      { reducePattern: 'squat', increasePattern: 'hinge', volumeReduction: 0.3 },
    ],
  },
  {
    restriction: 'foot_pain',
    recommendedExerciseIds: [
      'db-floor-press',
      'chest-supported-row',
      'glute-bridge',
      'dead-bug',
      'bird-dog',
      'prone-iytw',
    ],
    patternSubstitutions: [],
  },
  {
    restriction: 'wrist_pain',
    recommendedExerciseIds: [
      'pushup-on-fists',
      'db-floor-press',
      'db-squeeze-press',
      'farmer-carry',
      'suitcase-carry',
    ],
    patternSubstitutions: [],
  },
  {
    restriction: 'no_pullup_bar',
    recommendedExerciseIds: [
      'db-bent-over-row',
      'db-single-arm-row',
      'inverted-row',
      'db-iso-row',
      'prone-iytw',
      'db-pullover',
    ],
    patternSubstitutions: [],
  },
  {
    restriction: 'pelvic_floor',
    recommendedExerciseIds: [
      'glute-bridge',
      'single-leg-glute-bridge',
      'bird-dog',
      'dead-bug',
      'db-rdl',
      'step-up-low',
      'goblet-squat',
      'db-floor-press',
      'incline-pushup',
      'db-pallof-press',
      'side-plank',
    ],
    patternSubstitutions: [],
  },
];

export function getRestrictionMap(restriction: Restriction): RestrictionMap | undefined {
  return RESTRICTION_MAPS.find(m => m.restriction === restriction);
}
