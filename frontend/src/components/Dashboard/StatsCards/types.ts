/**
 * Statistics data received from the API.
 */
export interface StatsData {
  /** Total number of assets tracked across all markets */
  totalAssets: number;
  /** Total count of social media mentions (e.g. Reddit) */
  totalMentions: number;
  /** Normalized sentiment score (-1.0 to 1.0) */
  averageSentiment: number;
}

/**
 * Result of the useStats hook.
 */
export interface UseStatsResult {
  /** The statistics data, or null if not yet loaded or on error */
  stats: StatsData | null;
  /** Loading state flag */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}
