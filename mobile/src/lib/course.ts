import type { LessonRecord } from '@/stores/progress';
import { lessons, type Lesson, type Unit } from './engine';

export type NodeState = 'done' | 'current' | 'locked';

/**
 * The course is linear, like Duolingo's path: a lesson unlocks when the one before it is done. Completed lessons stay
 * open for practice.
 */
export function lessonState(lessonId: string, records: Record<string, LessonRecord>): NodeState {
  if (records[lessonId]) return 'done';
  const index = lessons.LESSONS.findIndex((l) => l.id === lessonId);
  if (index <= 0) return 'current';
  return records[lessons.LESSONS[index - 1]!.id] ? 'current' : 'locked';
}

/** The first lesson not yet done — where "Continue" goes. */
export function nextLesson(records: Record<string, LessonRecord>): Lesson | null {
  return lessons.LESSONS.find((l) => !records[l.id]) ?? null;
}

export function unitProgress(unit: Unit, records: Record<string, LessonRecord>) {
  const done = unit.lessons.filter((l) => records[l.id]).length;
  return { done, total: unit.lessons.length, complete: done === unit.lessons.length };
}

export function unitsCompleted(records: Record<string, LessonRecord>) {
  return lessons.UNITS.filter((u) => unitProgress(u, records).complete).map((u) => u.id);
}

/** Which unit a lesson belongs to and its position, for headings like "Unit 3 · Lesson 2". */
export function lessonPosition(lessonId: string) {
  const lesson = lessons.findLesson(lessonId);
  const unit = lesson ? lessons.findUnit(lesson.unit) : null;
  if (!lesson || !unit) return null;
  return { unit, lesson, index: unit.lessons.indexOf(lesson), unitNumber: unit.index + 1 };
}
