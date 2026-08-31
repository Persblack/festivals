import { parseLocalDate } from "@/lib/dates";
import { hasCoordinates } from "@/lib/guards";
import type { Festival } from "@/types/festival";

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
const TWO_WEEKS_MS = 14 * MILLIS_PER_DAY;
const MAX_DISTANCE_KM = 50;

/** Haversine distance between two lat/lng points in kilometers. */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sharedGenreCount(a: Festival, b: Festival): number {
  return a.genres.filter((g) => b.genres.includes(g)).length;
}

function withinTwoWeeks(a: Festival, b: Festival): boolean {
  const aStart = parseLocalDate(a.start_date);
  const bStart = parseLocalDate(b.start_date);
  if (!aStart || !bStart) return false;
  return Math.abs(aStart.getTime() - bStart.getTime()) <= TWO_WEEKS_MS;
}

/**
 * An unknown coordinate cannot disqualify a pair — it is not evidence that the
 * two are far apart. Such pairs stay eligible and simply earn no proximity
 * points in `scorePair`.
 */
function withinMaxDistance(a: Festival, b: Festival): boolean {
  if (!hasCoordinates(a) || !hasCoordinates(b)) return true;
  return (
    haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude) <=
    MAX_DISTANCE_KM
  );
}

function scorePair(source: Festival, candidate: Festival): number {
  let score = 0;
  // +2 per shared genre
  score += sharedGenreCount(source, candidate) * 2;
  // +3 if same country
  if (source.country_code === candidate.country_code) score += 3;
  // proximity bonus within the 50km cap, only when both sides are locatable
  if (hasCoordinates(source) && hasCoordinates(candidate)) {
    const dist = haversineDistance(
      source.latitude,
      source.longitude,
      candidate.latitude,
      candidate.longitude,
    );
    score += Math.max(0, 3 - (dist / MAX_DISTANCE_KM) * 3);
  }
  return score;
}

/**
 * Get recommended festivals similar to a given festival.
 * Candidates must share at least one genre and start within 2 weeks.
 */
export function getRecommendedFestivals(
  festival: Festival,
  allFestivals: Festival[],
  maxResults = 6,
): Festival[] {
  return allFestivals
    .filter(
      (f) =>
        f.id !== festival.id &&
        sharedGenreCount(festival, f) > 0 &&
        withinTwoWeeks(festival, f) &&
        withinMaxDistance(festival, f),
    )
    .map((f) => ({ festival: f, score: scorePair(festival, f) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((r) => r.festival);
}

/**
 * Get recommendations based on a set of selected festivals (planner).
 * Candidates must share a genre with AND be within 2 weeks of at least one selected festival.
 */
export function getRecommendedForPlanner(
  selectedFestivals: Festival[],
  allFestivals: Festival[],
  maxResults = 8,
): Festival[] {
  const selectedIds = new Set(selectedFestivals.map((f) => f.id));

  return allFestivals
    .filter((candidate) => {
      if (selectedIds.has(candidate.id)) return false;
      return selectedFestivals.some(
        (sel) =>
          sharedGenreCount(sel, candidate) > 0 &&
          withinTwoWeeks(sel, candidate) &&
          withinMaxDistance(sel, candidate),
      );
    })
    .map((candidate) => {
      const totalScore = selectedFestivals.reduce(
        (sum, sel) => sum + scorePair(sel, candidate),
        0,
      );
      return { festival: candidate, score: totalScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((r) => r.festival);
}
