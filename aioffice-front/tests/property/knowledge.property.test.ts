/**
 * Property-Based Tests for Knowledge Base Module
 * 
 * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
 * **Validates: Requirements 7.2**
 * 
 * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
 * **Validates: Requirements 7.1, 7.3**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { 
  validateKnowledgeFileType, 
  getFileExtension,
  parseKnowledgeResponse,
  ALLOWED_FILE_EXTENSIONS 
} from '../../src/services/api/knowledge';
import type { AIChatResponse, KnowledgeQueryResult, KnowledgeSource } from '../../src/types/chat';

/**
 * Arbitrary generators for file names
 */

// Generator for allowed file extensions
const allowedExtensionArbitrary = fc.constantFrom(...ALLOWED_FILE_EXTENSIONS);

// Generator for disallowed file extensions
const disallowedExtensionArbitrary = fc.constantFrom(
  '.exe', '.bat', '.sh', '.js', '.ts', '.html', '.css', 
  '.jpg', '.png', '.gif', '.mp3', '.mp4', '.zip', '.rar',
  '.dll', '.so', '.bin', '.iso', '.dmg', '.app'
);

// Generator for valid base filenames (alphanumeric with underscores/hyphens)
const baseFilenameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s));

// Generator for filenames with allowed extensions
const allowedFilenameArbitrary = fc.tuple(baseFilenameArbitrary, allowedExtensionArbitrary)
  .map(([base, ext]) => base + ext);

// Generator for filenames with disallowed extensions
const disallowedFilenameArbitrary = fc.tuple(baseFilenameArbitrary, disallowedExtensionArbitrary)
  .map(([base, ext]) => base + ext);

// Generator for filenames without any extension
const noExtensionFilenameArbitrary = baseFilenameArbitrary;

// Generator for empty or whitespace-only strings
const emptyOrWhitespaceArbitrary = fc.constantFrom('', ' ', '  ', '\t', '\n');

/**
 * Property-Based Tests for Knowledge Base File Type Validation
 * 
 * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
 * **Validates: Requirements 7.2**
 */
describe('Knowledge Base File Type Validation Property Tests', () => {
  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: For any file with an allowed extension (.md, .pdf, .docx, .txt),
   * the validation function SHALL return true.
   */
  it('Property 18.1: Files with allowed extensions are accepted', () => {
    fc.assert(
      fc.property(allowedFilenameArbitrary, (filename) => {
        const result = validateKnowledgeFileType(filename);
        return result === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: For any file with a disallowed extension,
   * the validation function SHALL return false.
   */
  it('Property 18.2: Files with disallowed extensions are rejected', () => {
    fc.assert(
      fc.property(disallowedFilenameArbitrary, (filename) => {
        const result = validateKnowledgeFileType(filename);
        return result === false;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: For any file without an extension,
   * the validation function SHALL return false.
   */
  it('Property 18.3: Files without extensions are rejected', () => {
    fc.assert(
      fc.property(noExtensionFilenameArbitrary, (filename) => {
        const result = validateKnowledgeFileType(filename);
        return result === false;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: For empty or whitespace-only filenames,
   * the validation function SHALL return false.
   */
  it('Property 18.4: Empty or whitespace filenames are rejected', () => {
    fc.assert(
      fc.property(emptyOrWhitespaceArbitrary, (filename) => {
        const result = validateKnowledgeFileType(filename);
        return result === false;
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: File extension validation is case-insensitive.
   * For any allowed extension in any case combination, validation SHALL return true.
   */
  it('Property 18.5: File extension validation is case-insensitive', () => {
    // Generate case variations of allowed extensions
    const caseVariationArbitrary = fc.tuple(
      baseFilenameArbitrary,
      fc.constantFrom('.MD', '.Md', '.mD', '.PDF', '.Pdf', '.pDf', '.DOCX', '.Docx', '.TXT', '.Txt')
    ).map(([base, ext]) => base + ext);

    fc.assert(
      fc.property(caseVariationArbitrary, (filename) => {
        const result = validateKnowledgeFileType(filename);
        return result === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: The set of allowed extensions is exactly {.md, .pdf, .docx, .txt}.
   */
  it('Property 18.6: ALLOWED_FILE_EXTENSIONS contains exactly the required extensions', () => {
    const requiredExtensions = ['.md', '.pdf', '.docx', '.txt'];
    
    // Check that all required extensions are present
    const hasAllRequired = requiredExtensions.every(ext => 
      ALLOWED_FILE_EXTENSIONS.includes(ext)
    );
    
    // Check that no extra extensions are present
    const hasNoExtras = ALLOWED_FILE_EXTENSIONS.every(ext => 
      requiredExtensions.includes(ext)
    );
    
    expect(hasAllRequired).toBe(true);
    expect(hasNoExtras).toBe(true);
    expect(ALLOWED_FILE_EXTENSIONS.length).toBe(4);
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: getFileExtension correctly extracts the extension from any filename.
   */
  it('Property 18.7: getFileExtension correctly extracts extensions', () => {
    fc.assert(
      fc.property(
        fc.tuple(baseFilenameArbitrary, allowedExtensionArbitrary),
        ([base, ext]) => {
          const filename = base + ext;
          const extracted = getFileExtension(filename);
          return extracted === ext;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: getFileExtension returns empty string for files without extensions.
   */
  it('Property 18.8: getFileExtension returns empty for files without extensions', () => {
    fc.assert(
      fc.property(noExtensionFilenameArbitrary, (filename) => {
        const extracted = getFileExtension(filename);
        return extracted === '';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 18: Knowledge Base File Type Validation**
   * **Validates: Requirements 7.2**
   * 
   * Property: Files with multiple dots have only the last extension considered.
   */
  it('Property 18.9: Only the last extension is considered for files with multiple dots', () => {
    const multiDotFilenameArbitrary = fc.tuple(
      baseFilenameArbitrary,
      fc.constantFrom('.backup', '.old', '.v1'),
      allowedExtensionArbitrary
    ).map(([base, middle, ext]) => base + middle + ext);

    fc.assert(
      fc.property(multiDotFilenameArbitrary, (filename) => {
        const result = validateKnowledgeFileType(filename);
        return result === true;
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * Arbitrary generators for Knowledge Query Results
 */

// Generator for non-empty answer strings
const answerArbitrary = fc.string({ minLength: 1, maxLength: 500 });

// Generator for knowledge source
const knowledgeSourceArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 1, maxLength: 300 }),
  filename: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

// Generator for array of knowledge sources
const sourcesArrayArbitrary = fc.array(knowledgeSourceArbitrary, { minLength: 1, maxLength: 5 });

// Generator for AIChatResponse with string data (simple answer)
const stringResponseArbitrary = fc.record({
  chatType: fc.constant(3),
  data: answerArbitrary,
});

// Generator for AIChatResponse with object data containing answer and sources
const objectResponseWithSourcesArbitrary = fc.record({
  chatType: fc.constant(3),
  data: fc.record({
    answer: answerArbitrary,
    sources: sourcesArrayArbitrary,
  }),
});

// Generator for AIChatResponse with object data containing content field
const objectResponseWithContentArbitrary = fc.record({
  chatType: fc.constant(3),
  data: fc.record({
    content: answerArbitrary,
  }),
});

/**
 * Property-Based Tests for Knowledge Query Result Display
 * 
 * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
 * **Validates: Requirements 7.1, 7.3**
 */
describe('Knowledge Query Result Display Property Tests', () => {
  /**
   * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
   * **Validates: Requirements 7.1, 7.3**
   * 
   * Property: For any knowledge base query result with a string response,
   * the parsed result SHALL include the answer content.
   */
  it('Property 19.1: String responses are parsed as answer content', () => {
    fc.assert(
      fc.property(stringResponseArbitrary, (response) => {
        const result = parseKnowledgeResponse(response as AIChatResponse);
        // The answer should equal the string data
        return result.answer === response.data;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
   * **Validates: Requirements 7.1, 7.3**
   * 
   * Property: For any knowledge base query result with object response containing answer and sources,
   * the parsed result SHALL include both the answer content and source references.
   */
  it('Property 19.2: Object responses with answer and sources are fully parsed', () => {
    fc.assert(
      fc.property(objectResponseWithSourcesArbitrary, (response) => {
        const result = parseKnowledgeResponse(response as AIChatResponse);
        const data = response.data as { answer: string; sources: Array<{ title: string; content: string; filename?: string }> };
        
        // Answer should be extracted
        const hasAnswer = result.answer === data.answer;
        
        // Sources should be extracted with correct length
        const hasCorrectSourceCount = result.sources !== undefined && 
          result.sources.length === data.sources.length;
        
        return hasAnswer && hasCorrectSourceCount;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
   * **Validates: Requirements 7.1, 7.3**
   * 
   * Property: For any knowledge base query result with object response containing content field,
   * the parsed result SHALL include the content as the answer.
   */
  it('Property 19.3: Object responses with content field are parsed as answer', () => {
    fc.assert(
      fc.property(objectResponseWithContentArbitrary, (response) => {
        const result = parseKnowledgeResponse(response as AIChatResponse);
        const data = response.data as { content: string };
        
        // Content should be extracted as answer
        return result.answer === data.content;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
   * **Validates: Requirements 7.1, 7.3**
   * 
   * Property: For any parsed knowledge result with sources,
   * each source SHALL contain title and content fields.
   */
  it('Property 19.4: Parsed sources contain required fields', () => {
    fc.assert(
      fc.property(objectResponseWithSourcesArbitrary, (response) => {
        const result = parseKnowledgeResponse(response as AIChatResponse);
        
        if (!result.sources || result.sources.length === 0) {
          return false;
        }
        
        // Every source should have title and content
        return result.sources.every(source => 
          typeof source.title === 'string' && 
          typeof source.content === 'string'
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
   * **Validates: Requirements 7.1, 7.3**
   * 
   * Property: The parsed result always has an answer field (may be empty string).
   */
  it('Property 19.5: Parsed result always has answer field', () => {
    const anyResponseArbitrary = fc.oneof(
      stringResponseArbitrary,
      objectResponseWithSourcesArbitrary,
      objectResponseWithContentArbitrary
    );

    fc.assert(
      fc.property(anyResponseArbitrary, (response) => {
        const result = parseKnowledgeResponse(response as AIChatResponse);
        return typeof result.answer === 'string';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 19: Knowledge Query Result Display**
   * **Validates: Requirements 7.1, 7.3**
   * 
   * Property: Source references preserve the original source data.
   */
  it('Property 19.6: Source references preserve original data', () => {
    fc.assert(
      fc.property(objectResponseWithSourcesArbitrary, (response) => {
        const result = parseKnowledgeResponse(response as AIChatResponse);
        const data = response.data as { answer: string; sources: Array<{ title: string; content: string; filename?: string }> };
        
        if (!result.sources) return false;
        
        // Each source should preserve title and content from original
        return result.sources.every((source, index) => {
          const original = data.sources[index];
          return source.title === original.title && 
                 source.content === original.content;
        });
      }),
      { numRuns: 100 }
    );
  });
});
