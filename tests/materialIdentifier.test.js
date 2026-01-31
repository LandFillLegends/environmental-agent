/**
 * Tests for Material Identifier Service
 */

const MaterialIdentifier = require('../src/services/materialIdentifier');

describe('MaterialIdentifier', () => {
  let identifier;

  beforeEach(() => {
    identifier = new MaterialIdentifier();
  });

  describe('identifyFromText', () => {
    test('should identify plastic bottle correctly', () => {
      const result = identifier.identifyFromText('plastic bottle');
      expect(result.identified).toBe(true);
      expect(result.item).toBe('plastic bottle');
      expect(result.material).toBe('PET plastic');
      expect(result.recyclable).toBe(true);
      expect(result.type).toBe('plastic');
    });

    test('should identify battery as hazardous', () => {
      const result = identifier.identifyFromText('battery');
      expect(result.identified).toBe(true);
      expect(result.type).toBe('hazardous');
      expect(result.specialDisposal).toBe(true);
    });

    test('should identify cardboard', () => {
      const result = identifier.identifyFromText('cardboard');
      expect(result.identified).toBe(true);
      expect(result.type).toBe('paper');
      expect(result.recyclable).toBe(true);
    });

    test('should handle case-insensitive input', () => {
      const result = identifier.identifyFromText('ALUMINUM CAN');
      expect(result.identified).toBe(true);
      expect(result.type).toBe('metal');
    });

    test('should handle fuzzy matching', () => {
      const result = identifier.identifyFromText('empty plastic bottle');
      expect(result.identified).toBe(true);
      expect(result.item).toBe('plastic bottle');
    });

    test('should classify by keywords when no exact match', () => {
      const result = identifier.identifyFromText('plastic container');
      expect(result.identified).toBe(true);
      expect(result.type).toBe('plastic');
    });

    test('should return unidentified for unknown items', () => {
      const result = identifier.identifyFromText('quantum flux capacitor');
      expect(result.identified).toBe(false);
      expect(result.material).toBe('unknown');
    });

    test('should throw error for invalid input', () => {
      expect(() => identifier.identifyFromText(null)).toThrow('Invalid description provided');
      expect(() => identifier.identifyFromText('')).toThrow('Invalid description provided');
    });
  });

  describe('identifyFromImage', () => {
    test('should simulate image identification', () => {
      const result = identifier.identifyFromImage('mock_image_data');
      expect(result.identified).toBe(true);
      expect(result.source).toBe('image');
      expect(result.confidence).toBe(0.85);
      expect(result.item).toBeDefined();
    });

    test('should throw error for invalid image data', () => {
      expect(() => identifier.identifyFromImage(null)).toThrow('Invalid image data provided');
    });
  });

  describe('getAllItems', () => {
    test('should return list of all items', () => {
      const items = identifier.getAllItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items).toContain('plastic bottle');
      expect(items).toContain('battery');
    });
  });
});
