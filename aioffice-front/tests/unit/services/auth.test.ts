/**
 * Authentication Service Unit Tests
 * Requirements: 1.1, 1.2, 1.3 - User authentication, token expiry, logout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as storage from '@/utils/storage'
import * as http from '@/services/http'

// Mock the http module
vi.mock('@/services/http', () => ({
  post: vi.fn()
}))

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    mockLocation.href = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('should store token and user info on successful login', async () => {
      // Import auth module fresh for each test
      const auth = await import('@/services/auth')
      
      const mockResponse = {
        code: 0,
        data: {
          id: 'user-123',
          name: 'testuser',
          token: 'jwt-token-abc',
          accessExpire: 3600
        },
        msg: 'success'
      }
      
      vi.mocked(http.post).mockResolvedValue(mockResponse)
      
      const result = await auth.login('testuser', 'password123')
      
      // Verify API was called correctly
      expect(http.post).toHaveBeenCalledWith('/api/user/login', {
        name: 'testuser',
        password: 'password123'
      })
      
      // Verify token was stored
      expect(storage.getToken()).toBe('jwt-token-abc')
      
      // Verify user info was stored
      const user = storage.getUser()
      expect(user).toEqual({ id: 'user-123', name: 'testuser' })
      
      // Verify return value
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on failed login', async () => {
      const auth = await import('@/services/auth')
      
      const mockResponse = {
        code: 1,
        data: null,
        msg: 'Invalid credentials'
      }
      
      vi.mocked(http.post).mockResolvedValue(mockResponse)
      
      await expect(auth.login('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })

    it('should store token expiry time', async () => {
      const auth = await import('@/services/auth')
      
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
      
      const mockResponse = {
        code: 0,
        data: {
          id: 'user-123',
          name: 'testuser',
          token: 'jwt-token-abc',
          accessExpire: 3600 // 1 hour
        },
        msg: 'success'
      }
      
      vi.mocked(http.post).mockResolvedValue(mockResponse)
      
      await auth.login('testuser', 'password123')
      
      // Verify expiry time was stored (current time + accessExpire * 1000)
      const expireTime = auth.getTokenExpiry()
      const expectedExpire = Date.now() + 3600 * 1000
      expect(expireTime).toBe(expectedExpire)
      
      vi.useRealTimers()
    })
  })

  describe('logout', () => {
    it('should clear token and user info on logout', async () => {
      const auth = await import('@/services/auth')
      
      // Setup: store some auth data first
      storage.setToken('test-token')
      storage.setUser({ id: 'user-123', name: 'testuser' })
      localStorage.setItem('aioffice_token_expire', '1705320000000')
      
      // Verify data exists before logout
      expect(storage.getToken()).toBe('test-token')
      expect(storage.getUser()).not.toBeNull()
      
      // Perform logout
      auth.logout()
      
      // Verify all auth data was cleared
      expect(storage.getToken()).toBeNull()
      expect(storage.getUser()).toBeNull()
      expect(localStorage.getItem('aioffice_token_expire')).toBeNull()
    })

    it('should redirect to login page on logout', async () => {
      const auth = await import('@/services/auth')
      
      auth.logout()
      
      expect(mockLocation.href).toBe('/login')
    })
  })

  describe('getToken', () => {
    it('should return stored token', async () => {
      const auth = await import('@/services/auth')
      
      storage.setToken('my-jwt-token')
      
      expect(auth.getToken()).toBe('my-jwt-token')
    })

    it('should return null when no token exists', async () => {
      const auth = await import('@/services/auth')
      
      expect(auth.getToken()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', async () => {
      const auth = await import('@/services/auth')
      
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
      
      storage.setToken('valid-token')
      // Set expiry 1 hour in the future
      const futureExpiry = Date.now() + 3600 * 1000
      localStorage.setItem('aioffice_token_expire', futureExpiry.toString())
      
      expect(auth.isAuthenticated()).toBe(true)
      
      vi.useRealTimers()
    })

    it('should return false when no token exists', async () => {
      const auth = await import('@/services/auth')
      
      expect(auth.isAuthenticated()).toBe(false)
    })

    it('should return false and clear auth when token is expired', async () => {
      const auth = await import('@/services/auth')
      
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
      
      storage.setToken('expired-token')
      // Set expiry 1 hour in the past
      const pastExpiry = Date.now() - 3600 * 1000
      localStorage.setItem('aioffice_token_expire', pastExpiry.toString())
      
      expect(auth.isAuthenticated()).toBe(false)
      
      // Verify auth was cleared
      expect(storage.getToken()).toBeNull()
      expect(localStorage.getItem('aioffice_token_expire')).toBeNull()
      
      vi.useRealTimers()
    })
  })

  describe('checkTokenExpiry', () => {
    it('should redirect to login when not authenticated', async () => {
      const auth = await import('@/services/auth')
      
      // No token set
      auth.checkTokenExpiry()
      
      expect(mockLocation.href).toBe('/login')
    })

    it('should not redirect when authenticated', async () => {
      const auth = await import('@/services/auth')
      
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
      
      storage.setToken('valid-token')
      const futureExpiry = Date.now() + 3600 * 1000
      localStorage.setItem('aioffice_token_expire', futureExpiry.toString())
      
      auth.checkTokenExpiry()
      
      expect(mockLocation.href).toBe('')
      
      vi.useRealTimers()
    })
  })

  describe('getTokenRemainingTime', () => {
    it('should return remaining time in milliseconds', async () => {
      const auth = await import('@/services/auth')
      
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
      
      // Set expiry 1 hour in the future
      const futureExpiry = Date.now() + 3600 * 1000
      localStorage.setItem('aioffice_token_expire', futureExpiry.toString())
      
      const remaining = auth.getTokenRemainingTime()
      expect(remaining).toBe(3600 * 1000)
      
      vi.useRealTimers()
    })

    it('should return 0 when token is expired', async () => {
      const auth = await import('@/services/auth')
      
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
      
      // Set expiry 1 hour in the past
      const pastExpiry = Date.now() - 3600 * 1000
      localStorage.setItem('aioffice_token_expire', pastExpiry.toString())
      
      const remaining = auth.getTokenRemainingTime()
      expect(remaining).toBe(0)
      
      vi.useRealTimers()
    })

    it('should return 0 when no expiry is set', async () => {
      const auth = await import('@/services/auth')
      
      const remaining = auth.getTokenRemainingTime()
      expect(remaining).toBe(0)
    })
  })
})
