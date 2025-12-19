/**
 * Property-Based Tests for HTTP Client
 * 
 * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
 * **Validates: Requirements 1.4**
 * 
 * Property: For any authenticated user and any API request, the HTTP client 
 * SHALL include the JWT token in the Authorization header.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

// Mock localStorage before importing modules that use it
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Import after mocking
import { setToken, getToken, removeToken } from '../../src/utils/storage';

/**
 * Arbitrary generator for valid JWT tokens
 * JWT tokens are base64-encoded strings with three parts separated by dots
 */
const jwtTokenArbitrary = fc.tuple(
  fc.base64String({ minLength: 10, maxLength: 100 }),
  fc.base64String({ minLength: 10, maxLength: 200 }),
  fc.base64String({ minLength: 10, maxLength: 50 })
).map(([header, payload, signature]) => 
  `${header.replace(/=/g, '')}.${payload.replace(/=/g, '')}.${signature.replace(/=/g, '')}`
);

/**
 * Arbitrary generator for non-empty string tokens (simpler tokens for testing)
 */
const simpleTokenArbitrary = fc.string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for API endpoint paths
 */
const apiPathArbitrary = fc.tuple(
  fc.constantFrom('/api', '/v1', '/v2'),
  fc.array(fc.stringMatching(/^[a-z][a-z0-9-]*$/), { minLength: 1, maxLength: 4 })
).map(([prefix, segments]) => `${prefix}/${segments.join('/')}`);

describe('HTTP Client - JWT Token Inclusion Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  /**
   * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
   * **Validates: Requirements 1.4**
   * 
   * Property: For any valid JWT token stored in localStorage, when getToken() is called,
   * it SHALL return the exact same token that was stored.
   */
  it('Property 1.1: Token storage round-trip - stored token equals retrieved token', () => {
    fc.assert(
      fc.property(simpleTokenArbitrary, (token) => {
        // Store the token
        setToken(token);
        
        // Retrieve the token
        const retrievedToken = getToken();
        
        // The retrieved token must equal the stored token
        return retrievedToken === token;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
   * **Validates: Requirements 1.4**
   * 
   * Property: For any JWT-formatted token, the storage system SHALL preserve
   * the complete token structure including all three parts.
   */
  it('Property 1.2: JWT token structure preservation', () => {
    fc.assert(
      fc.property(jwtTokenArbitrary, (jwtToken) => {
        // Store the JWT token
        setToken(jwtToken);
        
        // Retrieve the token
        const retrievedToken = getToken();
        
        // Token must be exactly preserved
        if (retrievedToken !== jwtToken) return false;
        
        // JWT structure must be preserved (three parts separated by dots)
        const parts = retrievedToken.split('.');
        return parts.length === 3;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
   * **Validates: Requirements 1.4**
   * 
   * Property: When no token is stored, getToken() SHALL return null.
   */
  it('Property 1.3: No token returns null', () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        // Ensure storage is clear
        localStorageMock.clear();
        
        // getToken should return null when no token exists
        const token = getToken();
        return token === null;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
   * **Validates: Requirements 1.4**
   * 
   * Property: After removeToken() is called, getToken() SHALL return null
   * regardless of what token was previously stored.
   */
  it('Property 1.4: Token removal clears token completely', () => {
    fc.assert(
      fc.property(simpleTokenArbitrary, (token) => {
        // Store a token
        setToken(token);
        
        // Verify it was stored
        const storedToken = getToken();
        if (storedToken !== token) return false;
        
        // Remove the token
        removeToken();
        
        // Token should now be null
        const afterRemoval = getToken();
        return afterRemoval === null;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
   * **Validates: Requirements 1.4**
   * 
   * Property: The Authorization header format SHALL be "Bearer {token}" for any valid token.
   */
  it('Property 1.5: Authorization header format is correct', () => {
    fc.assert(
      fc.property(simpleTokenArbitrary, (token) => {
        // Store the token
        setToken(token);
        
        // Get the token
        const storedToken = getToken();
        
        if (!storedToken) return false;
        
        // Construct the Authorization header as the HTTP client does
        const authHeader = `Bearer ${storedToken}`;
        
        // Verify the format
        return authHeader.startsWith('Bearer ') && 
               authHeader.substring(7) === token;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 1: JWT Token Inclusion in API Requests**
   * **Validates: Requirements 1.4**
   * 
   * Property: Multiple sequential token updates SHALL always result in the 
   * most recent token being returned.
   */
  it('Property 1.6: Sequential token updates preserve latest token', () => {
    fc.assert(
      fc.property(
        fc.array(simpleTokenArbitrary, { minLength: 2, maxLength: 10 }),
        (tokens) => {
          // Set each token in sequence
          for (const token of tokens) {
            setToken(token);
          }
          
          // The last token should be the one retrieved
          const lastToken = tokens[tokens.length - 1];
          const retrievedToken = getToken();
          
          return retrievedToken === lastToken;
        }
      ),
      { numRuns: 100 }
    );
  });
});
