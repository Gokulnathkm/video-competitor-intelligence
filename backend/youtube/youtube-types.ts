export interface YoutubeInputParseResult {
  type: "id" | "handle" | "query";
  value: string;
}

export interface MatchScoreResult {
  score: number;
  reason: string;
}
