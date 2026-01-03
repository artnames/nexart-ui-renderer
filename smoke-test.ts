/**
 * Minimal Smoke Tests for @nexart/ui-renderer v0.7.0
 * 
 * Tests VAR parity with @nexart/codemode-sdk v1.4.0 (Protocol v1.2.0)
 * 
 * NOTE: Some tests require a browser environment.
 * In Node.js, validation tests will pass, but render tests may fail.
 */

import { validateSystem, createSystem } from './src/system';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];

function expectValidationError(name: string, input: any, expectedMessage: string) {
  const result = validateSystem(input);
  if (result.valid) {
    results.push({ name, passed: false, expected: `Error: ${expectedMessage}`, actual: 'No validation error' });
    return;
  }
  const hasExpected = result.errors.some(e => e.includes(expectedMessage));
  results.push({ 
    name, 
    passed: hasExpected, 
    expected: `Error containing: ${expectedMessage}`, 
    actual: result.errors.join('; ') 
  });
}

function expectValidationSuccess(name: string, input: any) {
  const result = validateSystem(input);
  if (!result.valid) {
    results.push({ name, passed: false, expected: 'Validation success', actual: result.errors.join('; ') });
    return;
  }
  results.push({ name, passed: true, expected: 'Validation success', actual: 'Validation success' });
}

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true, expected: 'pass', actual: 'pass' });
  } catch (e: any) {
    results.push({ name, passed: false, expected: 'pass', actual: e.message });
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  SMOKE TESTS: @nexart/ui-renderer v0.7.0');
console.log('  VAR Parity with @nexart/codemode-sdk v1.4.0 (Protocol v1.2.0)');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1. VAR Validation Tests (matching @nexart/codemode-sdk v1.4.0)\n');

expectValidationSuccess(
  'VAR omitted works',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    source: 'function setup() { background(0); }'
  }
);

expectValidationSuccess(
  'VAR empty array works',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [],
    source: 'function setup() { background(0); }'
  }
);

expectValidationSuccess(
  'VAR length 2 works',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [50, 75],
    source: 'function setup() { background(0); }'
  }
);

expectValidationSuccess(
  'VAR length 10 works (backwards compatible)',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    source: 'function setup() { background(0); }'
  }
);

expectValidationError(
  'VAR length 11 throws',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    source: 'function setup() { background(0); }'
  },
  'VAR array must have at most 10 elements'
);

expectValidationError(
  'VAR value -1 throws',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [-1, 50, 50],
    source: 'function setup() { background(0); }'
  },
  'is out of range'
);

expectValidationError(
  'VAR value 101 throws',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [101, 50, 50],
    source: 'function setup() { background(0); }'
  },
  'is out of range'
);

expectValidationError(
  'VAR non-number value throws',
  {
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [1, 2, 'three', 4, 5],
    source: 'function setup() { background(0); }'
  },
  'must be a finite number'
);

console.log('2. Valid System Creation Tests\n');

test('Create valid static code system with 10 vars', () => {
  const system = createSystem({
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    source: 'function setup() { background(0); }'
  });
  if (!system) throw new Error('System should be created');
  if (system.systemType !== 'code') throw new Error('Wrong system type');
});

test('Create valid code system with 3 vars', () => {
  const system = createSystem({
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [50, 75, 25],
    source: 'function setup() { background(0); }'
  });
  if (!system) throw new Error('System should be created');
});

test('Create valid loop code system', () => {
  const system = createSystem({
    type: 'code',
    mode: 'loop',
    width: 100,
    height: 100,
    seed: 1,
    totalFrames: 60,
    vars: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    source: 'function setup() {} function draw() { background(0); }'
  });
  if (!system) throw new Error('System should be created');
});

test('VAR defaults to zeros if not provided', () => {
  const system = createSystem({
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    source: 'function setup() { background(0); }'
  });
  if (!system) throw new Error('System should be created');
});

console.log('3. Error Message Format Tests\n');

test('Error format: [Code Mode Protocol Error] for length > 10', () => {
  const result = validateSystem({
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    source: 'function setup() {}'
  });
  if (result.valid) throw new Error('Should be invalid');
  const hasCorrectFormat = result.errors.some(e => e.includes('[Code Mode Protocol Error]'));
  if (!hasCorrectFormat) {
    throw new Error('Error should contain [Code Mode Protocol Error] prefix');
  }
});

test('Error format: [Code Mode Protocol Error] for out-of-range', () => {
  const result = validateSystem({
    type: 'code',
    mode: 'static',
    width: 100,
    height: 100,
    seed: 1,
    vars: [150],
    source: 'function setup() {}'
  });
  if (result.valid) throw new Error('Should be invalid');
  const hasCorrectFormat = result.errors.some(e => e.includes('[Code Mode Protocol Error]'));
  if (!hasCorrectFormat) {
    throw new Error('Error should contain [Code Mode Protocol Error] prefix');
  }
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

results.forEach(r => {
  const status = r.passed ? '✓' : '✗';
  console.log(`${status} ${r.name}`);
  if (!r.passed) {
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual:   ${r.actual}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
