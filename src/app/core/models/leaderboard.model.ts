export interface LeaderboardEntry {
  readonly position: number;
  readonly username: string;
  readonly displayName: string;
  readonly studySeconds: number;
  readonly medalCount: number;
  readonly isCurrentUser: boolean;
}
