/**
 * Date formatting utilities
 * Requirements: 4.6 - Todo deadline warning
 */

/**
 * Format a Unix timestamp to a readable date string
 * @param timestamp Unix timestamp in seconds
 * @param format Format string (default: 'YYYY-MM-DD HH:mm:ss')
 */
export function formatDate(timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp * 1000);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Format a Unix timestamp to date only string
 * @param timestamp Unix timestamp in seconds
 */
export function formatDateOnly(timestamp: number): string {
  return formatDate(timestamp, 'YYYY-MM-DD');
}

/**
 * Format a Unix timestamp to time only string
 * @param timestamp Unix timestamp in seconds
 */
export function formatTimeOnly(timestamp: number): string {
  return formatDate(timestamp, 'HH:mm:ss');
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if a deadline is within the warning threshold (24 hours)
 * Requirements: 4.6 - Todo deadline warning
 * @param deadlineTimestamp Unix timestamp in seconds
 * @param warningHours Hours before deadline to trigger warning (default: 24)
 */
export function isDeadlineApproaching(deadlineTimestamp: number, warningHours: number = 24): boolean {
  if (!deadlineTimestamp) return false;
  
  const now = getCurrentTimestamp();
  const warningThreshold = warningHours * 60 * 60; // Convert hours to seconds
  
  // Deadline is approaching if it's in the future and within the warning threshold
  return deadlineTimestamp > now && (deadlineTimestamp - now) <= warningThreshold;
}

/**
 * Check if a deadline has passed
 * @param deadlineTimestamp Unix timestamp in seconds
 */
export function isDeadlinePassed(deadlineTimestamp: number): boolean {
  if (!deadlineTimestamp) return false;
  return deadlineTimestamp < getCurrentTimestamp();
}

/**
 * Calculate duration between two timestamps in hours
 * @param startTimestamp Unix timestamp in seconds
 * @param endTimestamp Unix timestamp in seconds
 */
export function calculateDurationHours(startTimestamp: number, endTimestamp: number): number {
  if (!startTimestamp || !endTimestamp) return 0;
  return Math.max(0, (endTimestamp - startTimestamp) / 3600);
}

/**
 * Calculate duration between two timestamps in days
 * @param startTimestamp Unix timestamp in seconds
 * @param endTimestamp Unix timestamp in seconds
 */
export function calculateDurationDays(startTimestamp: number, endTimestamp: number): number {
  return calculateDurationHours(startTimestamp, endTimestamp) / 24;
}

/**
 * Convert Date object to Unix timestamp in seconds
 * @param date Date object
 */
export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert Unix timestamp to Date object
 * @param timestamp Unix timestamp in seconds
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param timestamp Unix timestamp in seconds
 */
export function getRelativeTime(timestamp: number): string {
  const now = getCurrentTimestamp();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  const minutes = Math.floor(absDiff / 60);
  const hours = Math.floor(absDiff / 3600);
  const days = Math.floor(absDiff / 86400);
  
  const isFuture = diff > 0;
  
  if (absDiff < 60) {
    return isFuture ? '即将' : '刚刚';
  } else if (minutes < 60) {
    return isFuture ? `${minutes}分钟后` : `${minutes}分钟前`;
  } else if (hours < 24) {
    return isFuture ? `${hours}小时后` : `${hours}小时前`;
  } else {
    return isFuture ? `${days}天后` : `${days}天前`;
  }
}
