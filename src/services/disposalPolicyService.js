/**
 * Disposal Policy Service
 * Provides region-specific disposal policies and guidelines
 */

class DisposalPolicyService {
  constructor() {
    // Region-specific disposal policies
    this.regionalPolicies = {
      'US-CA': {
        name: 'California',
        country: 'United States',
        curbsideRecycling: {
          plastic: [1, 2, 5], // PET, HDPE, PP
          paper: true,
          cardboard: true,
          metal: true,
          glass: true
        },
        organics: {
          compostingAvailable: true,
          curbsidePickup: true,
          acceptedItems: ['food waste', 'yard waste', 'paper products']
        },
        specialDisposal: {
          electronics: { required: true, method: 'drop-off', notes: 'E-waste recycling centers' },
          hazardous: { required: true, method: 'drop-off', notes: 'Household hazardous waste facilities' },
          batteries: { required: true, method: 'drop-off', notes: 'Battery recycling programs' }
        },
        notes: 'California has strict recycling requirements. Many items banned from landfills.'
      },
      'US-NY': {
        name: 'New York',
        country: 'United States',
        curbsideRecycling: {
          plastic: [1, 2, 4, 5],
          paper: true,
          cardboard: true,
          metal: true,
          glass: true
        },
        organics: {
          compostingAvailable: true,
          curbsidePickup: false,
          acceptedItems: ['food waste', 'yard waste']
        },
        specialDisposal: {
          electronics: { required: true, method: 'drop-off', notes: 'Electronics recycling centers' },
          hazardous: { required: true, method: 'drop-off', notes: 'SAFE disposal events' },
          batteries: { required: true, method: 'drop-off', notes: 'Call2Recycle locations' }
        },
        notes: 'NYC requires separate bins for recyclables. Check local guidelines.'
      },
      'US-TX': {
        name: 'Texas',
        country: 'United States',
        curbsideRecycling: {
          plastic: [1, 2],
          paper: true,
          cardboard: true,
          metal: true,
          glass: true
        },
        organics: {
          compostingAvailable: false,
          curbsidePickup: false,
          acceptedItems: []
        },
        specialDisposal: {
          electronics: { required: false, method: 'drop-off', notes: 'Optional recycling centers available' },
          hazardous: { required: true, method: 'drop-off', notes: 'Environmental service centers' },
          batteries: { required: false, method: 'drop-off', notes: 'Retail take-back programs' }
        },
        notes: 'Recycling varies by city. Check with local waste management.'
      },
      'default': {
        name: 'General Guidelines',
        country: 'Various',
        curbsideRecycling: {
          plastic: [1, 2],
          paper: true,
          cardboard: true,
          metal: true,
          glass: true
        },
        organics: {
          compostingAvailable: false,
          curbsidePickup: false,
          acceptedItems: []
        },
        specialDisposal: {
          electronics: { required: true, method: 'drop-off', notes: 'Check local e-waste programs' },
          hazardous: { required: true, method: 'drop-off', notes: 'Contact local waste management' },
          batteries: { required: true, method: 'drop-off', notes: 'Retail or municipal collection' }
        },
        notes: 'These are general guidelines. Please check with your local waste management authority.'
      }
    };
  }

  /**
   * Get disposal policy for a region
   * @param {string} region - Region code (e.g., 'US-CA', 'US-NY')
   * @returns {Object} Regional policy information
   */
  getRegionalPolicy(region) {
    const normalizedRegion = region ? region.toUpperCase() : 'default';
    return this.regionalPolicies[normalizedRegion] || this.regionalPolicies['default'];
  }

  /**
   * Determine disposal method for an item in a specific region
   * @param {Object} materialInfo - Material information from identifier
   * @param {string} region - Region code
   * @returns {Object} Disposal recommendation
   */
  getDisposalRecommendation(materialInfo, region = 'default') {
    const policy = this.getRegionalPolicy(region);
    const { type, recyclable, specialDisposal, compostable, resinCode } = materialInfo;

    // Special disposal items
    if (specialDisposal) {
      const specialType = type === 'electronics' ? 'electronics' : 
                         type === 'hazardous' ? 'hazardous' : 
                         'hazardous';
      const specialInfo = policy.specialDisposal[specialType];
      return {
        method: 'special-disposal',
        curbsideAccepted: false,
        required: specialInfo.required,
        dropOffMethod: specialInfo.method,
        notes: specialInfo.notes,
        region: policy.name
      };
    }

    // Compostable items
    if (compostable && policy.organics.compostingAvailable) {
      return {
        method: 'composting',
        curbsideAccepted: policy.organics.curbsidePickup,
        acceptedItems: policy.organics.acceptedItems,
        notes: policy.organics.curbsidePickup ? 
          'Place in green/organic waste bin' : 
          'Take to composting facility or use home composting',
        region: policy.name
      };
    }

    // Recyclable items
    if (recyclable === true) {
      // Check if specific plastic type is accepted
      if (type === 'plastic' && resinCode) {
        const accepted = policy.curbsideRecycling.plastic.includes(resinCode);
        return {
          method: accepted ? 'curbside-recycling' : 'drop-off-recycling',
          curbsideAccepted: accepted,
          notes: accepted ? 
            `Resin code #${resinCode} accepted in recycling bin` : 
            `Resin code #${resinCode} not accepted curbside. Find drop-off location.`,
          region: policy.name
        };
      }

      // Other recyclable materials
      const curbsideAccepted = policy.curbsideRecycling[type] === true;
      return {
        method: 'curbside-recycling',
        curbsideAccepted,
        notes: curbsideAccepted ? 
          'Place in recycling bin' : 
          'Check with local recycling center',
        region: policy.name
      };
    }

    // Default to landfill
    return {
      method: 'landfill',
      curbsideAccepted: true,
      notes: 'Place in regular trash bin',
      region: policy.name,
      recommendation: 'Consider reducing use of this item type'
    };
  }

  /**
   * Get all available regions
   * @returns {Array} List of region codes
   */
  getAvailableRegions() {
    return Object.keys(this.regionalPolicies).filter(r => r !== 'default');
  }
}

module.exports = DisposalPolicyService;
