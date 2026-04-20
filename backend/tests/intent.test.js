const intentParser = require('../services/intentParser');

describe('Intent Parser (V2)', () => {
  test('should identify navigation intent', async () => {
    const result = await intentParser.parse('Take me to block M', 'gate_1');
    expect(result.intent).toBe('navigate');
    expect(result.destination).toBe('block_M');
  });

  test('should identify crowd query intent', async () => {
    const result = await intentParser.parse('is gate 2 crowded?', 'gate_1');
    expect(result.intent).toBe('query');
    expect(result.queryType).toBe('crowd');
    expect(result.zone).toBe('gate_2');
  });

  test('should handle greetings', async () => {
    const result = await intentParser.parse('hello', 'gate_1');
    expect(result.intent).toBe('greeting');
    expect(result.response).toContain('PitchPath AI');
  });

  test('should identify "nearest" facility intent', async () => {
    const result = await intentParser.parse('where is the nearest washroom', 'block_A');
    expect(result.intent).toBe('navigate');
    expect(result.action).toBe('find_nearest');
    expect(result.facilityType).toBe('washroom');
  });

  test('should handle unknown queries gracefully', async () => {
    const result = await intentParser.parse('what is the meaning of life', 'gate_1');
    expect(result.intent).toBe('unknown');
    expect(result.response).toContain('Try:');
  });
});
