/**
 * Tests for Environmental Agent (integration tests)
 */

const EnvironmentalAgent = require('../src/agent');

describe('EnvironmentalAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new EnvironmentalAgent('US-CA');
  });

  describe('processTextInput', () => {
    test('should process plastic bottle successfully', async () => {
      const result = await agent.processTextInput('plastic bottle');
      expect(result.success).toBe(true);
      expect(result.item).toBe('plastic bottle');
      expect(result.materialInfo.type).toBe('plastic');
      expect(result.disposal.method).toBe('curbside-recycling');
      expect(result.timing).toBeDefined();
      expect(result.tips).toBeDefined();
    });

    test('should process battery with facilities', async () => {
      const result = await agent.processTextInput('battery');
      expect(result.success).toBe(true);
      expect(result.disposal.method).toBe('special-disposal');
      expect(result.facilities).toBeDefined();
      expect(result.facilities.length).toBeGreaterThan(0);
    });

    test('should handle unknown items gracefully', async () => {
      const result = await agent.processTextInput('unknown item xyz');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should respect regional settings', async () => {
      const result = await agent.processTextInput('plastic bottle', { region: 'US-NY' });
      expect(result.success).toBe(true);
      expect(result.disposal.region).toBe('New York');
    });

    test('should include user location in facility search', async () => {
      const userLocation = { lat: 37.7749, lng: -122.4194 };
      const result = await agent.processTextInput('battery', { userLocation });
      expect(result.success).toBe(true);
      if (result.facilities && result.facilities.length > 0) {
        expect(result.facilities[0].distance).toBeDefined();
      }
    });
  });

  describe('processImageInput', () => {
    test('should process image input successfully', async () => {
      const result = await agent.processImageInput('mock_image_data');
      expect(result.success).toBe(true);
      expect(result.source).toBe('image');
      expect(result.confidence).toBeDefined();
      expect(result.item).toBeDefined();
    });
  });

  describe('searchFacilities', () => {
    test('should find recycling facilities', () => {
      const facilities = agent.searchFacilities('recycling');
      expect(Array.isArray(facilities)).toBe(true);
      expect(facilities.length).toBeGreaterThan(0);
      expect(facilities[0].type).toBe('recycling');
    });

    test('should find all facilities when type not specified', () => {
      const facilities = agent.searchFacilities(null);
      expect(Array.isArray(facilities)).toBe(true);
      expect(facilities.length).toBeGreaterThan(0);
    });

    test('should calculate distances when user location provided', () => {
      const userLocation = { lat: 37.7749, lng: -122.4194 };
      const facilities = agent.searchFacilities('recycling', { userLocation });
      expect(facilities[0].distance).toBeDefined();
      expect(typeof facilities[0].distance).toBe('number');
    });
  });

  describe('getCollectionSchedule', () => {
    test('should return schedule for current region', () => {
      const schedule = agent.getCollectionSchedule();
      expect(schedule).toBeDefined();
      expect(schedule.trash).toBeDefined();
      expect(schedule.recycling).toBeDefined();
    });

    test('should return schedule for specific region', () => {
      const schedule = agent.getCollectionSchedule('US-NY');
      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule.trash)).toBe(true);
    });
  });

  describe('getRegionalPolicy', () => {
    test('should return policy for current region', () => {
      const policy = agent.getRegionalPolicy();
      expect(policy).toBeDefined();
      expect(policy.name).toBe('California');
    });

    test('should return policy for specific region', () => {
      const policy = agent.getRegionalPolicy('US-TX');
      expect(policy.name).toBe('Texas');
    });
  });

  describe('setRegion', () => {
    test('should change agent region', () => {
      agent.setRegion('US-NY');
      const policy = agent.getRegionalPolicy();
      expect(policy.name).toBe('New York');
    });
  });

  describe('comprehensive workflow', () => {
    test('should handle complete disposal workflow for food waste', async () => {
      const result = await agent.processTextInput('food waste');
      expect(result.success).toBe(true);
      expect(result.materialInfo.compostable).toBe(true);
      expect(result.disposal.method).toBe('composting');
      expect(result.timing.recommendation).toBeDefined();
      expect(result.tips.length).toBeGreaterThan(0);
    });

    test('should handle complete disposal workflow for electronics', async () => {
      const result = await agent.processTextInput('phone');
      expect(result.success).toBe(true);
      expect(result.materialInfo.specialDisposal).toBe(true);
      expect(result.disposal.method).toBe('special-disposal');
      expect(result.facilities).toBeDefined();
      expect(result.timing.urgency).toBeDefined();
    });
  });
});
