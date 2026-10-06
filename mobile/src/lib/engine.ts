/**
 * The bridge to the shared knowledge base in `../lib`.
 *
 * Those files are plain JavaScript shared with the web app and the Node tests, so there is exactly one copy of every
 * verdict and every lesson answer. This module gives them types and is the only place the app imports them from.
 * Metro is pointed at `../lib` by `metro.config.js`.
 */

export type OutcomeId = 'recycle' | 'compost' | 'trash' | 'dropoff' | 'reuse';

export type Outcome = { id: OutcomeId; label: string; blurb: string };

export type Stream = {
  id: string;
  code: string;
  short: string;
  label: string;
  family: string;
  note: string;
  acceptance: { id: 'widely' | 'varies' | 'rarely'; label: string };
};

export type QuestionOption = { value: string; label: string };
export type Question = { id: string; text: string; help: string; options: QuestionOption[] };

export type CatalogComponent = {
  label: string;
  material: string;
  outcome: OutcomeId;
  stream?: string | null;
  why: string;
  questions?: string[];
};

export type CatalogObject = {
  id: string;
  label: string;
  match: string[];
  section: string;
  components: CatalogComponent[];
  tip?: string;
  hazard?: boolean;
};

export type Section = { id: string; label: string; objects: string[] };

export type ResolvedComponent = {
  label: string;
  material: string;
  outcome: Outcome;
  stream: Stream | null;
  why: string;
};

export type Verdict = {
  object: { id: string; label: string };
  components: ResolvedComponent[];
  headline: Outcome;
  streams: Stream[];
  split: boolean;
  tip: string | null;
  hazard: boolean;
};

export type Answers = Record<string, string>;

type RulesApi = {
  OUTCOMES: Record<OutcomeId, Outcome>;
  STREAMS: Record<string, Omit<Stream, 'acceptance'> & { acceptance: string }>;
  OBJECTS: CatalogObject[];
  SECTIONS: Section[];
  findObject: (id: string) => CatalogObject | null;
  matchObject: (text: string) => CatalogObject | null;
  search: (query: string, limit?: number) => CatalogObject[];
  questionsFor: (obj: CatalogObject) => Question[];
  resolve: (obj: CatalogObject, answers?: Answers) => Verdict;
};

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export type ExerciseType = 'bin' | 'parts' | 'truefalse' | 'code' | 'stream' | 'pick';

export type ExerciseItem = {
  objectId: string;
  label: string;
  part: string | null;
  material: string | null;
  scenario: string[];
};

export type ExerciseChoice = {
  id: string;
  label: string;
  sublabel?: string;
  outcome?: OutcomeId;
  objectId?: string;
};

export type Exercise = {
  id: string;
  type: ExerciseType;
  prompt: string;
  item: ExerciseItem | null;
  statement?: string;
  claim?: OutcomeId;
  target?: OutcomeId;
  choices: ExerciseChoice[];
  answer: string[];
  multi: boolean;
  explain: {
    text: string;
    outcome: OutcomeId | null;
    stream: { code: string; label: string; acceptance: string } | null;
  };
  objects: string[];
};

export type Lesson = { id: string; unit: string; title: string; objects: string[]; review: boolean };
export type Unit = { id: string; index: number; title: string; blurb: string; shelf: string; lessons: Lesson[] };

export type BuiltLesson = {
  lesson: { id: string; title: string; unit: string; unitTitle: string; review: boolean };
  exercises: Exercise[];
};

type LessonsApi = {
  UNITS: Unit[];
  LESSONS: Lesson[];
  findLesson: (id: string) => Lesson | null;
  findUnit: (id: string) => Unit | null;
  buildLesson: (lessonId: string, seed: string | number) => BuiltLesson;
  isCorrect: (exercise: Exercise, selected: string[]) => boolean;
};

// ---------------------------------------------------------------------------
// Recognition
// ---------------------------------------------------------------------------

export type MaterialReading = { id: string; probability: number; family: string | null };

export type Interpretation = {
  candidates: { object: CatalogObject; score: number }[];
  ranked: { object: CatalogObject; score: number }[];
  recognized: boolean;
  saw: { label: string; probability: number };
  material: MaterialReading | null;
  looksLikeWaste: boolean;
};

type RecognizerApi = {
  interpret: (probabilities: ArrayLike<number>, options?: { limit?: number; material?: Record<string, number> | null }) => Interpretation;
  byMaterial: (
    material: Record<string, number>,
    options?: { ranked?: Interpretation['ranked']; limit?: number },
  ) => { material: MaterialReading; objects: CatalogObject[] } | null;
};

/* eslint-disable @typescript-eslint/no-require-imports */
export const rules: RulesApi = require('../../../lib/rules');
export const lessons: LessonsApi = require('../../../lib/lessons');
export const recognizer: RecognizerApi = require('../../../lib/recognizer');
/* eslint-enable @typescript-eslint/no-require-imports */

export const OUTCOME_ORDER: OutcomeId[] = ['recycle', 'compost', 'trash', 'dropoff', 'reuse'];

export const sectionOf = (objectId: string) => rules.findObject(objectId)?.section ?? 'house';
