export interface PatternMatch {
  value: string;
  position: number;
  confidence: number;
  context: string;
}

export interface PatternRule {
  name: string;
  regex: RegExp;
  description: string;
  type: 'account' | 'name' | 'address' | 'date' | 'currency' | 'phone' | 'email';
  priority: number;
  validator?: (match: string) => boolean;
}

// Comprehensive pattern detection rules
export const PATTERN_RULES: PatternRule[] = [
  // Account Number Patterns
  {
    name: 'labeled_account_numbers',
    regex: /(?:account\s*(?:number|nbr|#)|acct\s*(?:number|nbr|#))[:\s]+([A-Z0-9\-]+)/gi,
    description: 'Account numbers with labels',
    type: 'account',
    priority: 10,
    validator: (match) => match.length >= 4 && match.length <= 20
  },
  {
    name: 'alphanumeric_codes',
    regex: /\b[A-Z]{2,6}\d{4,12}\b/g,
    description: 'Alphanumeric account codes (e.g., FBNWSTX123456)',
    type: 'account',
    priority: 8,
    validator: (match) => /^[A-Z]{2,6}\d{4,12}$/.test(match)
  },
  {
    name: 'numeric_accounts',
    regex: /\b\d{6,15}\b/g,
    description: 'Long numeric sequences (potential account numbers)',
    type: 'account',
    priority: 6,
    validator: (match) => {
      const num = match.replace(/\D/g, '');
      return num.length >= 6 && num.length <= 15 && !isCommonNumber(num);
    }
  },

  // Name Patterns
  {
    name: 'labeled_customer_names',
    regex: /(?:customer\s*name|bill\s*to|account\s*holder)[:\s]+([A-Z][a-z]+(?:\s+[A-Z&][a-z]*)*(?:\s+[A-Z][a-z]+)*)/gi,
    description: 'Customer names with labels',
    type: 'name',
    priority: 10,
    validator: (match) => isValidName(match)
  },
  {
    name: 'couple_names',
    regex: /\b[A-Z][a-z]+\s*&\s*[A-Z][a-z]+\s+[A-Z][a-z]+(?:\'?s)?\b/g,
    description: 'Couple names (John & Mary Smith)',
    type: 'name',
    priority: 9,
    validator: (match) => isValidName(match)
  },
  {
    name: 'formal_names',
    regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
    description: 'Formal names (First Last or First Middle Last)',
    type: 'name',
    priority: 7,
    validator: (match) => isValidName(match) && !isCommonWord(match)
  },
  {
    name: 'all_caps_names',
    regex: /\b[A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?\b/g,
    description: 'ALL CAPS names',
    type: 'name',
    priority: 6,
    validator: (match) => isValidName(match) && !isCommonWord(match)
  },

  // Date Patterns
  {
    name: 'slash_dates',
    regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    description: 'MM/DD/YYYY format dates',
    type: 'date',
    priority: 8,
    validator: (match) => isValidDate(match)
  },
  {
    name: 'dash_dates',
    regex: /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    description: 'MM-DD-YYYY format dates',
    type: 'date',
    priority: 8,
    validator: (match) => isValidDate(match)
  },
  {
    name: 'written_dates',
    regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
    description: 'Written dates (January 15, 2024)',
    type: 'date',
    priority: 9
  },

  // Currency Patterns
  {
    name: 'dollar_amounts',
    regex: /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
    description: 'Dollar amounts with $ symbol',
    type: 'currency',
    priority: 9
  },
  {
    name: 'decimal_amounts',
    regex: /\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g,
    description: 'Decimal amounts (123.45)',
    type: 'currency',
    priority: 7,
    validator: (match) => {
      const num = parseFloat(match.replace(/,/g, ''));
      return num > 0 && num < 1000000; // Reasonable range
    }
  },

  // Address Patterns
  {
    name: 'street_addresses',
    regex: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Circle|Cir|Court|Ct)\b/gi,
    description: 'Street addresses',
    type: 'address',
    priority: 8
  },
  {
    name: 'zip_codes',
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    description: 'ZIP codes',
    type: 'address',
    priority: 7,
    validator: (match) => /^\d{5}(-\d{4})?$/.test(match)
  },

  // Contact Patterns
  {
    name: 'phone_numbers',
    regex: /\b(?:\(\d{3}\)\s*|\d{3}[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    description: 'Phone numbers',
    type: 'phone',
    priority: 8
  },
  {
    name: 'email_addresses',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: 'Email addresses',
    type: 'email',
    priority: 9
  }
];

// Helper functions
function isValidName(name: string): boolean {
  const cleaned = name.trim();
  
  // Must be at least 2 characters
  if (cleaned.length < 2) return false;
  
  // Should contain at least one letter
  if (!/[A-Za-z]/.test(cleaned)) return false;
  
  // Should not be all numbers
  if (/^\d+$/.test(cleaned)) return false;
  
  // Should not contain too many special characters
  const specialChars = cleaned.match(/[^A-Za-z\s&'.-]/g);
  if (specialChars && specialChars.length > 2) return false;
  
  return true;
}

function isCommonWord(text: string): boolean {
  const commonWords = [
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR',
    'HAD', 'BY', 'WORD', 'OIL', 'SIT', 'SET', 'RUN', 'EAT', 'FAR', 'SEA', 'EYE', 'OLD', 'SEE',
    'HIM', 'TWO', 'HOW', 'ITS', 'WHO', 'DID', 'YES', 'HIS', 'HAS', 'HAD', 'LET', 'PUT', 'TOO',
    'USE', 'HER', 'WAY', 'MAY', 'SAY', 'SHE', 'NEW', 'TRY', 'MAN', 'DAY', 'GET', 'USE', 'MAN',
    'NEW', 'NOW', 'WAY', 'MAY', 'SAY'
  ];
  
  return commonWords.includes(text.toUpperCase().replace(/\s+/g, ' ').trim());
}

function isCommonNumber(num: string): boolean {
  // Filter out common numbers like phone numbers, dates, etc.
  const commonPatterns = [
    /^(19|20)\d{2}$/, // Years
    /^(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/, // MMDD
    /^[01]\d{3}$/, // Time-like
    /^(555|800|888|877|866|855|844|833|822)\d{7}$/ // Common phone prefixes
  ];
  
  return commonPatterns.some(pattern => pattern.test(num));
}

function isValidDate(dateStr: string): boolean {
  const parts = dateStr.split(/[-\/]/);
  if (parts.length !== 3) return false;
  
  const [month, day, year] = parts.map(Number);
  
  // Basic validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  return true;
}

export function detectPatterns(text: string, rules: PatternRule[] = PATTERN_RULES): Map<string, PatternMatch[]> {
  const results = new Map<string, PatternMatch[]>();
  
  rules.forEach(rule => {
    const matches: PatternMatch[] = [];
    let match;
    
    // Reset regex lastIndex
    rule.regex.lastIndex = 0;
    
    while ((match = rule.regex.exec(text)) !== null) {
      const value = match[1] || match[0]; // Use capture group if available
      const position = match.index;
      
      // Apply validator if present
      if (rule.validator && !rule.validator(value)) {
        continue;
      }
      
      // Get context around the match
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(text.length, position + match[0].length + 50);
      const context = text.substring(contextStart, contextEnd);
      
      // Calculate confidence based on context and pattern characteristics
      const confidence = calculateConfidence(value, context, rule);
      
      matches.push({
        value,
        position,
        confidence,
        context: context.trim()
      });
      
      // Prevent infinite loops with global regex
      if (!rule.regex.global) break;
    }
    
    if (matches.length > 0) {
      // Sort by confidence and remove duplicates
      const uniqueMatches = removeDuplicates(matches);
      results.set(rule.name, uniqueMatches.sort((a, b) => b.confidence - a.confidence));
    }
  });
  
  return results;
}

function calculateConfidence(value: string, context: string, rule: PatternRule): number {
  let confidence = 0.5; // Base confidence
  
  // Boost confidence based on rule priority
  confidence += (rule.priority / 10) * 0.3;
  
  // Boost confidence if value appears in a labeled context
  const labelWords = ['name', 'account', 'number', 'customer', 'bill', 'to', 'holder'];
  const hasLabel = labelWords.some(word => 
    context.toLowerCase().includes(word.toLowerCase())
  );
  if (hasLabel) confidence += 0.2;
  
  // Boost confidence for consistent formatting
  if (rule.type === 'account' && /^[A-Z]+\d+$/.test(value)) {
    confidence += 0.1;
  }
  
  // Reduce confidence for very short or very long values
  if (value.length < 3 || value.length > 50) {
    confidence -= 0.2;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

function removeDuplicates(matches: PatternMatch[]): PatternMatch[] {
  const seen = new Set<string>();
  return matches.filter(match => {
    const key = match.value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generateRegexPattern(examples: string[], type: string): string {
  if (examples.length === 0) return '';
  
  switch (type) {
    case 'account':
      return generateAccountPattern(examples);
    case 'name':
      return generateNamePattern(examples);
    default:
      return generateGenericPattern(examples);
  }
}

function generateAccountPattern(examples: string[]): string {
  // Analyze the structure of account numbers
  const hasLetters = examples.some(ex => /[A-Za-z]/.test(ex));
  const hasNumbers = examples.some(ex => /\d/.test(ex));
  
  if (hasLetters && hasNumbers) {
    // Mixed alphanumeric
    const letterCount = Math.max(...examples.map(ex => (ex.match(/[A-Za-z]/g) || []).length));
    const numberCount = Math.max(...examples.map(ex => (ex.match(/\d/g) || []).length));
    return `[A-Z]{${Math.max(1, letterCount-1)},${letterCount+1}}\\d{${Math.max(1, numberCount-1)},${numberCount+1}}`;
  } else if (hasNumbers) {
    // Numeric only
    const minLength = Math.min(...examples.map(ex => ex.length));
    const maxLength = Math.max(...examples.map(ex => ex.length));
    return `\\d{${minLength},${maxLength}}`;
  }
  
  return '[A-Z0-9]+';
}

function generateNamePattern(examples: string[]): string {
  const hasAmpersand = examples.some(ex => ex.includes('&'));
  
  if (hasAmpersand) {
    return '[A-Z][a-z]+\\s*&\\s*[A-Z][a-z]+\\s+[A-Z][a-z]+';
  }
  
  const wordCounts = examples.map(ex => ex.split(/\s+/).length);
  const maxWords = Math.max(...wordCounts);
  
  if (maxWords >= 3) {
    return '[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}';
  }
  
  return '[A-Z][a-z]+\\s+[A-Z][a-z]+';
}

function generateGenericPattern(examples: string[]): string {
  // Simple pattern generation based on character types
  const sample = examples[0];
  return sample.replace(/[A-Za-z]/g, '[A-Za-z]')
              .replace(/\d/g, '\\d')
              .replace(/\s/g, '\\s*');
}
