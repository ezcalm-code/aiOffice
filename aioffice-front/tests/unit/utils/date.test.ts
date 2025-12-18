import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  getCurrentTimestamp,
  isDeadlineApproaching,
  isDeadlinePassed,
  calculateDurationHours,
  calculateDurationDays,
  dateToTimestamp,
  timestampToDate,
  getRelativeTime
} from '@/utils/date'

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format timestamp with default format', () => {
      // 2024-01-15 10:30:45 UTC
      const timestamp = 1705315845
      const result = formatDate(timestamp)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should format timestamp with custom format', () => {
      const timestamp = 1705315845
      const result = formatDate(timestamp, 'YYYY/MM/DD')
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
    })

    it('should return empty string for falsy timestamp', () => {
      expect(formatDate(0)).toBe('')
      expect(formatDate(undefined as any)).toBe('')
    })
  })

  describe('formatDateOnly', () => {
    it('should return date only format', () => {
      const timestamp = 1705315845
      const result = formatDateOnly(timestamp)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('formatTimeOnly', () => {
    it('should return time only format', () => {
      const timestamp = 1705315845
      const result = formatTimeOnly(timestamp)
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })
  })

  describe('getCurrentTimestamp', () => {
    it('should return current timestamp in seconds', () => {
      const before = Math.floor(Date.now() / 1000)
      const result = getCurrentTimestamp()
      const after = Math.floor(Date.now() / 1000)
      expect(result).toBeGreaterThanOrEqual(before)
      expect(result).toBeLessThanOrEqual(after)
    })
  })


  describe('isDeadlineApproaching', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true when deadline is within 24 hours', () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = now + 12 * 3600 // 12 hours from now
      expect(isDeadlineApproaching(deadline)).toBe(true)
    })

    it('should return false when deadline is more than 24 hours away', () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = now + 48 * 3600 // 48 hours from now
      expect(isDeadlineApproaching(deadline)).toBe(false)
    })

    it('should return false when deadline has passed', () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = now - 3600 // 1 hour ago
      expect(isDeadlineApproaching(deadline)).toBe(false)
    })

    it('should return false for falsy timestamp', () => {
      expect(isDeadlineApproaching(0)).toBe(false)
    })

    it('should respect custom warning hours', () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = now + 36 * 3600 // 36 hours from now
      expect(isDeadlineApproaching(deadline, 48)).toBe(true)
      expect(isDeadlineApproaching(deadline, 24)).toBe(false)
    })
  })

  describe('isDeadlinePassed', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true when deadline has passed', () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = now - 3600 // 1 hour ago
      expect(isDeadlinePassed(deadline)).toBe(true)
    })

    it('should return false when deadline is in the future', () => {
      const now = Math.floor(Date.now() / 1000)
      const deadline = now + 3600 // 1 hour from now
      expect(isDeadlinePassed(deadline)).toBe(false)
    })

    it('should return false for falsy timestamp', () => {
      expect(isDeadlinePassed(0)).toBe(false)
    })
  })

  describe('calculateDurationHours', () => {
    it('should calculate duration in hours', () => {
      const start = 1705315845
      const end = start + 7200 // 2 hours later
      expect(calculateDurationHours(start, end)).toBe(2)
    })

    it('should return 0 for invalid timestamps', () => {
      expect(calculateDurationHours(0, 1705315845)).toBe(0)
      expect(calculateDurationHours(1705315845, 0)).toBe(0)
    })

    it('should return 0 when end is before start', () => {
      const start = 1705315845
      const end = start - 3600
      expect(calculateDurationHours(start, end)).toBe(0)
    })
  })

  describe('calculateDurationDays', () => {
    it('should calculate duration in days', () => {
      const start = 1705315845
      const end = start + 86400 * 2 // 2 days later
      expect(calculateDurationDays(start, end)).toBe(2)
    })
  })

  describe('dateToTimestamp', () => {
    it('should convert Date to Unix timestamp', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const result = dateToTimestamp(date)
      expect(result).toBe(Math.floor(date.getTime() / 1000))
    })
  })

  describe('timestampToDate', () => {
    it('should convert Unix timestamp to Date', () => {
      const timestamp = 1705320000
      const result = timestampToDate(timestamp)
      expect(result).toBeInstanceOf(Date)
      expect(result.getTime()).toBe(timestamp * 1000)
    })
  })

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "刚刚" for recent past', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(getRelativeTime(now - 30)).toBe('刚刚')
    })

    it('should return "即将" for near future', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(getRelativeTime(now + 30)).toBe('即将')
    })

    it('should return minutes for times within an hour', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(getRelativeTime(now - 300)).toBe('5分钟前')
      expect(getRelativeTime(now + 300)).toBe('5分钟后')
    })

    it('should return hours for times within a day', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(getRelativeTime(now - 7200)).toBe('2小时前')
      expect(getRelativeTime(now + 7200)).toBe('2小时后')
    })

    it('should return days for times beyond a day', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(getRelativeTime(now - 172800)).toBe('2天前')
      expect(getRelativeTime(now + 172800)).toBe('2天后')
    })
  })
})
