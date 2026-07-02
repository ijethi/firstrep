import { useWorkoutSessionStore } from '../state/workoutSessionStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { useProgressStore } from '../state/progressStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { generateRecommendations } from './trainerEngine';
import { planDayId } from './planProgress';

/**
 * Conclude the live session (B-15 shared action). Used by the workout screen
 * (normal finish / end early) and the Today resume card ("End workout"), so the
 * behavior is identical everywhere:
 *   - stamp status + run trainer engine + save recs
 *   - save the session to progress history
 *   - ONLY a `completed` session registers completion + advances the plan;
 *     `abandoned` never advances plan progress.
 * Does not clear the live session (SessionSummary reads it; it's cleared on exit).
 */
export function concludeSession(status: 'completed' | 'abandoned'): void {
  const now = new Date().toISOString();
  const priorCompletedCount = useRecommendationStore.getState().completedCount;

  useWorkoutSessionStore.getState().finish(status, now);
  const finished = useWorkoutSessionStore.getState().session;

  const recs = generateRecommendations(finished, { nowISO: now, priorCompletedCount });
  useRecommendationStore.getState().setRecommendations(recs);

  if (finished) useProgressStore.getState().addSession(finished);

  if (status === 'completed') {
    useRecommendationStore.getState().registerCompletion();
    if (finished) {
      usePlanProgressStore
        .getState()
        .markDayCompleted(planDayId(finished.weekNumber, finished.dayNumber));
    }
  }
}
