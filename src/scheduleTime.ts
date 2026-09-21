import type {Plan} from './types';

export const DAY_MINUTES = 24 * 60;
export const WEEK_MINUTES = 7 * DAY_MINUTES;

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function planStartMinutes(plan: Plan): number {
  return timeToMinutes(plan.start_time);
}

export function planEndMinutes(plan: Plan): number {
  return planStartMinutes(plan) + plan.duration_minutes;
}

export function intervalsOverlap(startA: number, durationA: number, startB: number, durationB: number): boolean {
  return startA < startB + durationB && startB < startA + durationA;
}
