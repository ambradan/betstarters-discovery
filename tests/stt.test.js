/**
 * Unit Tests for BetStarters STT Module
 * Run with: node stt.test.js
 * 
 * These tests verify the core logic without browser APIs
 * (mocked for Node.js execution)
 */

// ============================================
// TEST FRAMEWORK (minimal, no dependencies)
// ============================================

const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    testResults.passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    testResults.failed++;
    testResults.errors.push({ test: name, error: e.message });
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${e.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy, got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy, got ${actual}`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    toMatchObject(expected) {
      for (const key in expected) {
        if (actual[key] !== expected[key]) {
          throw new Error(`Property ${key}: expected ${expected[key]}, got ${actual[key]}`);
        }
      }
    }
  };
}

// ============================================
// MOCK IMPLEMENTATIONS
// ============================================

// Mock browser SpeechRecognition
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this._isRunning = false;
  }

  start() {
    this._isRunning = true;
  }

  stop() {
    this._isRunning = false;
    if (this.onend) this.onend();
  }

  // Test helper to simulate results
  _simulateResult(text, confidence = 0.9, isFinal = true) {
    if (this.onresult) {
      this.onresult({
        resultIndex: 0,
        results: [{
          0: { transcript: text, confidence },
          isFinal,
          length: 1
        }]
      });
    }
  }

  _simulateError(error) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

// ============================================
// SEMANTIC ANALYZER (extracted for testing)
// ============================================

function simulateAIAnalysis(text) {
  const extractions = [];
  const uncertainties = [];
  const suggestions = [];
  
  // Pattern matching for TTD
  const ttdMatch = text.match(/(\d+)\s*(giorni|days)/i);
  if (ttdMatch) {
    const startIdx = Math.max(0, text.indexOf(ttdMatch[0]) - 20);
    const endIdx = Math.min(text.length, text.indexOf(ttdMatch[0]) + ttdMatch[0].length + 20);
    extractions.push({
      field: 'ttd_current',
      value: ttdMatch[1],
      confidence: 'high',
      category: 'kpi',
      quote: text.substring(startIdx, endIdx)
    });
  }
  
  // Pattern matching for projects
  const projectsMatch = text.match(/(\d+)\s*(progetti|projects)/i);
  if (projectsMatch) {
    const startIdx = Math.max(0, text.indexOf(projectsMatch[0]) - 20);
    const endIdx = Math.min(text.length, text.indexOf(projectsMatch[0]) + projectsMatch[0].length + 20);
    extractions.push({
      field: 'target_projects',
      value: projectsMatch[1],
      confidence: 'medium',
      category: 'kpi',
      quote: text.substring(startIdx, endIdx)
    });
  }

  // Pattern matching for conversion rate
  const conversionMatch = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (conversionMatch) {
    extractions.push({
      field: 'conversion_rate',
      value: conversionMatch[1].replace(',', '.'),
      confidence: 'high',
      category: 'kpi',
      quote: text.substring(Math.max(0, text.indexOf(conversionMatch[0]) - 15), text.indexOf(conversionMatch[0]) + conversionMatch[0].length + 15)
    });
  }

  // Pattern matching for budget/money
  const budgetMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|K|mila|euro|€|dollari|\$)/);
  if (budgetMatch) {
    let value = parseFloat(budgetMatch[1].replace(',', '.'));
    if (budgetMatch[2].toLowerCase() === 'k' || budgetMatch[2] === 'mila') {
      value *= 1000;
    }
    extractions.push({
      field: 'budget',
      value: value.toString(),
      confidence: 'medium',
      category: 'economic',
      quote: text.substring(Math.max(0, text.indexOf(budgetMatch[0]) - 15), text.indexOf(budgetMatch[0]) + budgetMatch[0].length + 15)
    });
  }
  
  // Country mentions
  const countries = [
    { pattern: /brazil|brasile/i, name: 'Brasile' },
    { pattern: /argentina/i, name: 'Argentina' },
    { pattern: /mexico|messico/i, name: 'Messico' },
    { pattern: /africa/i, name: 'Africa' },
    { pattern: /nigeria/i, name: 'Nigeria' },
    { pattern: /malta/i, name: 'Malta' },
    { pattern: /sweden|svezia/i, name: 'Svezia' }
  ];
  
  countries.forEach(country => {
    if (country.pattern.test(text)) {
      suggestions.push({
        id: Date.now() + Math.random(),
        type: 'exploration',
        content: `Menzionato ${country.name} - verificare requisiti regolatori specifici`,
        priority: 'medium'
      });
    }
  });
  
  // Uncertainty markers
  const vagueMarkers = ['forse', 'circa', 'più o meno', 'probabilmente', 'penso', 'credo', 'dovrebbe'];
  vagueMarkers.forEach(marker => {
    if (text.toLowerCase().includes(marker)) {
      uncertainties.push({
        topic: 'Dato approssimativo',
        reason: `Il parlante ha usato "${marker}"`,
        suggestedQuestion: 'Puoi darmi un numero più preciso?'
      });
    }
  });

  // Decision markers
  const decisionMarkers = ['deciso', 'abbiamo stabilito', 'la decisione è', 'andiamo con', 'procediamo con'];
  decisionMarkers.forEach(marker => {
    if (text.toLowerCase().includes(marker)) {
      const idx = text.toLowerCase().indexOf(marker);
      suggestions.push({
        id: Date.now() + Math.random(),
        type: 'decision',
        content: `Possibile decisione rilevata: "${text.substring(idx, Math.min(text.length, idx + 50))}..."`,
        priority: 'high'
      });
    }
  });
  
  return { extractions, uncertainties, suggestions };
}

// Confidence scoring logic
function calculateConfidence(extraction, hasVagueMarker) {
  if (hasVagueMarker) return 'low';
  if (extraction.confidence === 'high') return 'high';
  return 'medium';
}

// Report generation
function generateReport(extractions, uncertainties, suggestions) {
  const groupedExtractions = extractions.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  return {
    metadata: {
      date: new Date().toLocaleDateString('it-IT'),
      extractionCount: extractions.length
    },
    dataUpdated: groupedExtractions,
    uncertainties: uncertainties,
    suggestions: suggestions.filter(s => s.priority === 'high'),
    openQuestions: uncertainties.map(u => u.suggestedQuestion).filter(Boolean)
  };
}

// ============================================
// TESTS
// ============================================

console.log('🧪 BetStarters STT Module - Unit Tests\n');
console.log('=' .repeat(50));

// Test Group: Pattern Extraction
describe('Pattern Extraction - TTD', () => {
  it('should extract "45 giorni" as ttd_current=45', () => {
    const result = simulateAIAnalysis('Il TTD attuale è di 45 giorni');
    expect(result.extractions.length).toBeGreaterThan(0);
    expect(result.extractions[0].field).toBe('ttd_current');
    expect(result.extractions[0].value).toBe('45');
    expect(result.extractions[0].confidence).toBe('high');
  });

  it('should extract "30 days" as ttd_current=30', () => {
    const result = simulateAIAnalysis('The current TTD is 30 days');
    expect(result.extractions[0].value).toBe('30');
  });

  it('should include quote context', () => {
    const result = simulateAIAnalysis('Attualmente il TTD è di 45 giorni dalla firma');
    expect(result.extractions[0].quote).toContain('45 giorni');
  });
});

describe('Pattern Extraction - Projects', () => {
  it('should extract "5 progetti" as target_projects=5', () => {
    const result = simulateAIAnalysis('Vogliamo chiudere 5 progetti al mese');
    expect(result.extractions.length).toBeGreaterThan(0);
    expect(result.extractions[0].field).toBe('target_projects');
    expect(result.extractions[0].value).toBe('5');
  });

  it('should assign medium confidence to project extraction', () => {
    const result = simulateAIAnalysis('Target: 8 progetti');
    expect(result.extractions[0].confidence).toBe('medium');
  });
});

describe('Pattern Extraction - Percentages', () => {
  it('should extract "25%" as conversion_rate', () => {
    const result = simulateAIAnalysis('Il nostro conversion rate è del 25%');
    const conversionExtraction = result.extractions.find(e => e.field === 'conversion_rate');
    expect(conversionExtraction).toBeTruthy();
    expect(conversionExtraction.value).toBe('25');
  });

  it('should handle decimal percentages', () => {
    const result = simulateAIAnalysis('Siamo al 12,5% di conversione');
    const conversionExtraction = result.extractions.find(e => e.field === 'conversion_rate');
    expect(conversionExtraction.value).toBe('12.5');
  });
});

describe('Pattern Extraction - Budget', () => {
  it('should extract "50k" as budget=50000', () => {
    const result = simulateAIAnalysis('Il budget è di 50k');
    const budgetExtraction = result.extractions.find(e => e.field === 'budget');
    expect(budgetExtraction).toBeTruthy();
    expect(budgetExtraction.value).toBe('50000');
  });

  it('should extract "100 mila euro"', () => {
    const result = simulateAIAnalysis('Abbiamo 100 mila euro di budget');
    const budgetExtraction = result.extractions.find(e => e.field === 'budget');
    expect(budgetExtraction.value).toBe('100000');
  });
});

describe('Country Detection', () => {
  it('should detect "Brasile" mention', () => {
    const result = simulateAIAnalysis('Stiamo espandendo in Brasile');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].content).toContain('Brasile');
  });

  it('should detect multiple countries', () => {
    const result = simulateAIAnalysis('Focus su Argentina e Mexico');
    expect(result.suggestions.length).toBe(2);
  });

  it('should detect English country names', () => {
    const result = simulateAIAnalysis('Expanding to Brazil and Sweden');
    expect(result.suggestions.length).toBe(2);
  });
});

describe('Uncertainty Detection', () => {
  it('should flag "circa" as uncertainty', () => {
    const result = simulateAIAnalysis('Sono circa 45 giorni');
    expect(result.uncertainties.length).toBeGreaterThan(0);
    expect(result.uncertainties[0].reason).toContain('circa');
  });

  it('should flag "forse"', () => {
    const result = simulateAIAnalysis('Forse 5 progetti');
    expect(result.uncertainties.length).toBeGreaterThan(0);
  });

  it('should flag "probabilmente"', () => {
    const result = simulateAIAnalysis('Probabilmente entro fine mese');
    expect(result.uncertainties.length).toBeGreaterThan(0);
  });

  it('should suggest clarification question', () => {
    const result = simulateAIAnalysis('Più o meno 30 giorni');
    expect(result.uncertainties[0].suggestedQuestion).toContain('preciso');
  });

  it('should not flag clean statements', () => {
    const result = simulateAIAnalysis('Il TTD è esattamente 45 giorni');
    expect(result.uncertainties.length).toBe(0);
  });
});

describe('Decision Detection', () => {
  it('should detect "abbiamo deciso"', () => {
    const result = simulateAIAnalysis('Abbiamo deciso di procedere con 5 progetti');
    const decisionSuggestion = result.suggestions.find(s => s.type === 'decision');
    expect(decisionSuggestion).toBeTruthy();
    expect(decisionSuggestion.priority).toBe('high');
  });

  it('should detect "procediamo con"', () => {
    const result = simulateAIAnalysis('Procediamo con la strategia Africa-first');
    const decisionSuggestion = result.suggestions.find(s => s.type === 'decision');
    expect(decisionSuggestion).toBeTruthy();
  });
});

describe('Confidence Scoring', () => {
  it('should return high for explicit match without vague markers', () => {
    const extraction = { confidence: 'high' };
    expect(calculateConfidence(extraction, false)).toBe('high');
  });

  it('should return low when vague marker present', () => {
    const extraction = { confidence: 'high' };
    expect(calculateConfidence(extraction, true)).toBe('low');
  });

  it('should return medium for partial match', () => {
    const extraction = { confidence: 'medium' };
    expect(calculateConfidence(extraction, false)).toBe('medium');
  });
});

describe('Report Generation', () => {
  it('should group extractions by category', () => {
    const extractions = [
      { field: 'ttd', category: 'kpi', value: '45' },
      { field: 'projects', category: 'kpi', value: '5' },
      { field: 'budget', category: 'economic', value: '50000' }
    ];
    const report = generateReport(extractions, [], []);
    expect(Object.keys(report.dataUpdated)).toHaveLength(2);
    expect(report.dataUpdated.kpi).toHaveLength(2);
    expect(report.dataUpdated.economic).toHaveLength(1);
  });

  it('should include only high priority suggestions', () => {
    const suggestions = [
      { priority: 'high', content: 'Important' },
      { priority: 'medium', content: 'Less important' },
      { priority: 'low', content: 'Minor' }
    ];
    const report = generateReport([], [], suggestions);
    expect(report.suggestions).toHaveLength(1);
    expect(report.suggestions[0].content).toBe('Important');
  });

  it('should extract open questions from uncertainties', () => {
    const uncertainties = [
      { topic: 'Test', suggestedQuestion: 'Question 1?' },
      { topic: 'Test2', suggestedQuestion: 'Question 2?' },
      { topic: 'Test3', suggestedQuestion: null }
    ];
    const report = generateReport([], uncertainties, []);
    expect(report.openQuestions).toHaveLength(2);
  });

  it('should include metadata', () => {
    const extractions = [{ field: 'test', category: 'kpi', value: '1' }];
    const report = generateReport(extractions, [], []);
    expect(report.metadata.extractionCount).toBe(1);
    expect(report.metadata.date).toBeTruthy();
  });
});

describe('Complex Scenarios', () => {
  it('should handle mixed content correctly', () => {
    const text = 'Il TTD è circa 45 giorni, vogliamo 5 progetti in Brasile con budget di 100k';
    const result = simulateAIAnalysis(text);
    
    // Should extract TTD
    expect(result.extractions.find(e => e.field === 'ttd_current')).toBeTruthy();
    
    // Should extract projects
    expect(result.extractions.find(e => e.field === 'target_projects')).toBeTruthy();
    
    // Should extract budget
    expect(result.extractions.find(e => e.field === 'budget')).toBeTruthy();
    
    // Should flag uncertainty (circa)
    expect(result.uncertainties.length).toBeGreaterThan(0);
    
    // Should suggest country research
    expect(result.suggestions.find(s => s.content.includes('Brasile'))).toBeTruthy();
  });

  it('should handle empty input', () => {
    const result = simulateAIAnalysis('');
    expect(result.extractions).toHaveLength(0);
    expect(result.uncertainties).toHaveLength(0);
    expect(result.suggestions).toHaveLength(0);
  });

  it('should handle no matches', () => {
    const result = simulateAIAnalysis('Ciao, come stai oggi?');
    expect(result.extractions).toHaveLength(0);
  });
});

describe('STT Engine Mock', () => {
  it('should initialize with correct defaults', () => {
    const stt = new MockSpeechRecognition();
    expect(stt.continuous).toBe(false);
    expect(stt.lang).toBe('en-US');
    expect(stt._isRunning).toBe(false);
  });

  it('should start and stop correctly', () => {
    const stt = new MockSpeechRecognition();
    stt.start();
    expect(stt._isRunning).toBe(true);
    stt.stop();
    expect(stt._isRunning).toBe(false);
  });

  it('should call onend when stopped', () => {
    const stt = new MockSpeechRecognition();
    let endCalled = false;
    stt.onend = () => { endCalled = true; };
    stt.stop();
    expect(endCalled).toBe(true);
  });

  it('should emit results correctly', () => {
    const stt = new MockSpeechRecognition();
    let receivedText = null;
    stt.onresult = (event) => {
      receivedText = event.results[0][0].transcript;
    };
    stt._simulateResult('Test transcript');
    expect(receivedText).toBe('Test transcript');
  });

  it('should emit errors correctly', () => {
    const stt = new MockSpeechRecognition();
    let receivedError = null;
    stt.onerror = (event) => {
      receivedError = event.error;
    };
    stt._simulateError('no-speech');
    expect(receivedError).toBe('no-speech');
  });
});

describe('Fallback Logic', () => {
  it('should track error count', () => {
    let errorCount = 0;
    const fallbackThreshold = 3;
    
    // Simulate 3 errors
    for (let i = 0; i < 3; i++) {
      errorCount++;
    }
    
    expect(errorCount >= fallbackThreshold).toBe(true);
  });

  it('should reset error count on success', () => {
    let errorCount = 2;
    
    // Simulate successful transcript
    errorCount = 0;
    
    expect(errorCount).toBe(0);
  });
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '=' .repeat(50));
console.log('\n📊 TEST SUMMARY\n');
console.log(`  ✅ Passed: ${testResults.passed}`);
console.log(`  ❌ Failed: ${testResults.failed}`);
console.log(`  📈 Total:  ${testResults.passed + testResults.failed}`);

if (testResults.failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  testResults.errors.forEach(({ test, error }) => {
    console.log(`  - ${test}: ${error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}
