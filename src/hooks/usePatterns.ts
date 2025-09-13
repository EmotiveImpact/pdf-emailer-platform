import { useState, useEffect } from 'react';

interface PatternSet {
  accountPatterns: string[];
  namePatterns: string[];
}

const DEFAULT_PATTERNS: PatternSet = {
  accountPatterns: [
    'account\\s*nbr[:\\s]+(FBNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(DNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(WNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(SMNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(SENWSTX\\d+)',
    'account\\s*nbr[:\\s]+(SVNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(PPNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(OHNWSTX\\d+)',
    'account\\s*nbr[:\\s]+(SUNWSTX\\d+)',
    'account\\s*nbr[:\\s]+([A-Z]{2,}\\d+)'
  ],
  namePatterns: [
    // Married couple patterns (priority - check first)
    'customer\\s*name[:\\s]+([A-Za-z]+\\s*&\\s*[A-Za-z]+\\s+[A-Za-z]+\'?s?)', // Celia & Felipe Ramirez's
    'customer\\s*name[:\\s]+([A-Za-z]+\\s*&\\s*[A-Za-z]+\\s+[A-Za-z]+)', // John & Mary Smith
    'customer\\s*name[:\\s]+([A-Za-z]+\\s+&\\s+[A-Za-z]+\\s+[A-Za-z]+\'?s?)', // Maria & Carlos Rodriguez's

    // Original patterns (clean names without "Account")
    'customer\\s*name[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*(?:Account)?',
    'customer\\s*name[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*(?:Account)?',

    // More flexible patterns for different formats
    'customer\\s*name[:\\s]+([A-Z][A-Z\\s]+)',  // ALL CAPS names
    'customer\\s*name[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)', // Mixed case
    'customer\\s*name[:\\s]+([A-Za-z\\s\\.\\-\']+)', // Names with dots, hyphens, apostrophes

    // Alternative label patterns
    'name[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)',
    'name[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)',
    'name[:\\s]+([A-Za-z\\s\\.\\-\']+)',

    // Account holder patterns
    'account\\s*holder[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)',
    'account\\s*holder[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)',
    'account\\s*holder[:\\s]+([A-Za-z\\s\\.\\-\']+)',

    // Bill to patterns
    'bill\\s*to[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)',
    'bill\\s*to[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)',
    'bill\\s*to[:\\s]+([A-Za-z\\s\\.\\-\']+)',

    // Generic patterns for any name-like text
    '([A-Z][a-z]+\\s+[A-Z][a-z]+)(?=\\s|$)', // Two capitalized words
    '([A-Z][A-Z\\s]+)(?=\\s|$)', // ALL CAPS words
  ]
};

export function usePatterns() {
  const [patterns, setPatterns] = useState<PatternSet>(DEFAULT_PATTERNS);

  useEffect(() => {
    const stored = localStorage.getItem('pdf-splitter-patterns');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPatterns(parsed);
      } catch (error) {
        console.error('Failed to parse stored patterns:', error);
      }
    }
  }, []);

  const savePatterns = (newPatterns: PatternSet) => {
    setPatterns(newPatterns);
    localStorage.setItem('pdf-splitter-patterns', JSON.stringify(newPatterns));
  };

  const addAccountPattern = (pattern: string) => {
    const newPatterns = {
      ...patterns,
      accountPatterns: [...patterns.accountPatterns, pattern]
    };
    savePatterns(newPatterns);
  };

  const addNamePattern = (pattern: string) => {
    const newPatterns = {
      ...patterns,
      namePatterns: [...patterns.namePatterns, pattern]
    };
    savePatterns(newPatterns);
  };

  const removeAccountPattern = (index: number) => {
    const newPatterns = {
      ...patterns,
      accountPatterns: patterns.accountPatterns.filter((_, i) => i !== index)
    };
    savePatterns(newPatterns);
  };

  const removeNamePattern = (index: number) => {
    const newPatterns = {
      ...patterns,
      namePatterns: patterns.namePatterns.filter((_, i) => i !== index)
    };
    savePatterns(newPatterns);
  };

  const resetToDefaults = () => {
    savePatterns(DEFAULT_PATTERNS);
  };

  return {
    patterns,
    addAccountPattern,
    addNamePattern,
    removeAccountPattern,
    removeNamePattern,
    resetToDefaults
  };
}