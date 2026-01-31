/**
 * Tests for Disposal Policy Service
 */

const DisposalPolicyService = require('../src/services/disposalPolicyService');

describe('DisposalPolicyService', () => {
  let service;

  beforeEach(() => {
    service = new DisposalPolicyService();
  });

  describe('getRegionalPolicy', () => {
    test('should return California policy', () => {
      const policy = service.getRegionalPolicy('US-CA');
      expect(policy.name).toBe('California');
      expect(policy.country).toBe('United States');
      expect(policy.curbsideRecycling.plastic).toContain(1);
      expect(policy.organics.compostingAvailable).toBe(true);
    });

    test('should return New York policy', () => {
      const policy = service.getRegionalPolicy('US-NY');
      expect(policy.name).toBe('New York');
      expect(policy.curbsideRecycling.plastic).toContain(4);
    });

    test('should return default policy for unknown region', () => {
      const policy = service.getRegionalPolicy('UNKNOWN');
      expect(policy.name).toBe('General Guidelines');
    });

    test('should handle case-insensitive region codes', () => {
      const policy = service.getRegionalPolicy('us-ca');
      expect(policy.name).toBe('California');
    });
  });

  describe('getDisposalRecommendation', () => {
    test('should recommend curbside recycling for PET plastic in California', () => {
      const materialInfo = {
        type: 'plastic',
        recyclable: true,
        resinCode: 1
      };
      const recommendation = service.getDisposalRecommendation(materialInfo, 'US-CA');
      expect(recommendation.method).toBe('curbside-recycling');
      expect(recommendation.curbsideAccepted).toBe(true);
    });

    test('should recommend drop-off for non-accepted plastic types', () => {
      const materialInfo = {
        type: 'plastic',
        recyclable: true,
        resinCode: 6 // Styrofoam
      };
      const recommendation = service.getDisposalRecommendation(materialInfo, 'US-CA');
      expect(recommendation.method).toBe('drop-off-recycling');
      expect(recommendation.curbsideAccepted).toBe(false);
    });

    test('should recommend special disposal for electronics', () => {
      const materialInfo = {
        type: 'electronics',
        specialDisposal: true
      };
      const recommendation = service.getDisposalRecommendation(materialInfo, 'US-CA');
      expect(recommendation.method).toBe('special-disposal');
      expect(recommendation.curbsideAccepted).toBe(false);
    });

    test('should recommend composting for organic waste in California', () => {
      const materialInfo = {
        type: 'organic',
        compostable: true
      };
      const recommendation = service.getDisposalRecommendation(materialInfo, 'US-CA');
      expect(recommendation.method).toBe('composting');
      expect(recommendation.curbsideAccepted).toBe(true);
    });

    test('should recommend landfill for non-recyclable items', () => {
      const materialInfo = {
        type: 'plastic',
        recyclable: false
      };
      const recommendation = service.getDisposalRecommendation(materialInfo, 'US-CA');
      expect(recommendation.method).toBe('landfill');
    });

    test('should handle hazardous materials', () => {
      const materialInfo = {
        type: 'hazardous',
        specialDisposal: true
      };
      const recommendation = service.getDisposalRecommendation(materialInfo, 'US-NY');
      expect(recommendation.method).toBe('special-disposal');
      expect(recommendation.required).toBe(true);
    });
  });

  describe('getAvailableRegions', () => {
    test('should return list of available regions', () => {
      const regions = service.getAvailableRegions();
      expect(Array.isArray(regions)).toBe(true);
      expect(regions).toContain('US-CA');
      expect(regions).toContain('US-NY');
      expect(regions).toContain('US-TX');
      expect(regions).not.toContain('default');
    });
  });
});
