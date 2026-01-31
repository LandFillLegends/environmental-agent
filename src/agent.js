/**
 * Environmental Agent
 * Main agent class that coordinates all services to provide waste disposal recommendations
 */

const MaterialIdentifier = require('./services/materialIdentifier');
const DisposalPolicyService = require('./services/disposalPolicyService');
const FacilityLocator = require('./services/facilityLocator');
const DisposalTimeService = require('./services/disposalTimeService');

class EnvironmentalAgent {
  constructor(region = 'default') {
    this.region = region;
    this.materialIdentifier = new MaterialIdentifier();
    this.disposalPolicyService = new DisposalPolicyService();
    this.facilityLocator = new FacilityLocator();
    this.disposalTimeService = new DisposalTimeService();
  }

  /**
   * Process waste item from text description
   * @param {string} itemDescription - Text description of the waste item
   * @param {Object} options - Additional options (region, userLocation)
   * @returns {Object} Complete disposal recommendation
   */
  async processTextInput(itemDescription, options = {}) {
    const region = options.region || this.region;
    
    try {
      // Step 1: Identify material
      const materialInfo = this.materialIdentifier.identifyFromText(itemDescription);
      
      if (!materialInfo.identified) {
        return {
          success: false,
          error: 'Item could not be identified',
          item: itemDescription,
          suggestion: 'Please provide more details or try uploading an image'
        };
      }

      // Step 2: Get disposal recommendation
      const disposalRecommendation = this.disposalPolicyService.getDisposalRecommendation(
        materialInfo,
        region
      );

      // Step 3: Find nearby facilities if needed
      let facilities = [];
      if (!disposalRecommendation.curbsideAccepted || 
          disposalRecommendation.method === 'special-disposal') {
        facilities = this.facilityLocator.findNearbyFacilities(
          region,
          materialInfo,
          options.userLocation
        );
      }

      // Step 4: Get disposal time recommendation
      const timeRecommendation = this.disposalTimeService.getDisposalTime(
        disposalRecommendation,
        region
      );

      // Step 5: Compile complete recommendation
      return {
        success: true,
        item: materialInfo.item,
        materialInfo: {
          material: materialInfo.material,
          type: materialInfo.type,
          recyclable: materialInfo.recyclable,
          compostable: materialInfo.compostable,
          specialDisposal: materialInfo.specialDisposal
        },
        disposal: {
          method: disposalRecommendation.method,
          curbsideAccepted: disposalRecommendation.curbsideAccepted,
          instructions: disposalRecommendation.notes,
          region: disposalRecommendation.region
        },
        timing: {
          recommendation: timeRecommendation.recommendation,
          urgency: timeRecommendation.urgency,
          estimatedTime: timeRecommendation.estimatedTime,
          nextCollection: timeRecommendation.nextCollection
        },
        facilities: facilities.length > 0 ? facilities.slice(0, 3) : null,
        tips: this._generateTips(materialInfo, disposalRecommendation)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        item: itemDescription
      };
    }
  }

  /**
   * Process waste item from image
   * @param {string} imageData - Base64 encoded image or image path
   * @param {Object} options - Additional options (region, userLocation)
   * @returns {Object} Complete disposal recommendation
   */
  async processImageInput(imageData, options = {}) {
    const region = options.region || this.region;
    
    try {
      // Step 1: Identify material from image
      const materialInfo = this.materialIdentifier.identifyFromImage(imageData);
      
      if (!materialInfo.identified) {
        return {
          success: false,
          error: 'Item could not be identified from image',
          suggestion: 'Please try a clearer image or enter a text description'
        };
      }

      // Step 2: Get disposal recommendation
      const disposalRecommendation = this.disposalPolicyService.getDisposalRecommendation(
        materialInfo,
        region
      );

      // Step 3: Find nearby facilities if needed
      let facilities = [];
      if (!disposalRecommendation.curbsideAccepted || 
          disposalRecommendation.method === 'special-disposal') {
        facilities = this.facilityLocator.findNearbyFacilities(
          region,
          materialInfo,
          options.userLocation
        );
      }

      // Step 4: Get disposal time recommendation
      const timeRecommendation = this.disposalTimeService.getDisposalTime(
        disposalRecommendation,
        region
      );

      // Step 5: Compile complete recommendation
      return {
        success: true,
        item: materialInfo.item,
        confidence: materialInfo.confidence,
        source: 'image',
        materialInfo: {
          material: materialInfo.material,
          type: materialInfo.type,
          recyclable: materialInfo.recyclable,
          compostable: materialInfo.compostable,
          specialDisposal: materialInfo.specialDisposal
        },
        disposal: {
          method: disposalRecommendation.method,
          curbsideAccepted: disposalRecommendation.curbsideAccepted,
          instructions: disposalRecommendation.notes,
          region: disposalRecommendation.region
        },
        timing: {
          recommendation: timeRecommendation.recommendation,
          urgency: timeRecommendation.urgency,
          estimatedTime: timeRecommendation.estimatedTime,
          nextCollection: timeRecommendation.nextCollection
        },
        facilities: facilities.length > 0 ? facilities.slice(0, 3) : null,
        tips: this._generateTips(materialInfo, disposalRecommendation)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for facilities by type
   * @param {string} facilityType - Type of facility (recycling, hazardous-waste, electronics, composting)
   * @param {Object} options - Additional options (region, userLocation)
   * @returns {Array} List of facilities
   */
  searchFacilities(facilityType, options = {}) {
    const region = options.region || this.region;
    const allFacilities = this.facilityLocator.getAllFacilities(region);
    
    let filteredFacilities = facilityType 
      ? allFacilities.filter(f => f.type === facilityType)
      : allFacilities;

    // Calculate distances if user location provided
    if (options.userLocation && options.userLocation.lat && options.userLocation.lng) {
      filteredFacilities = filteredFacilities.map(facility => ({
        ...facility,
        distance: this._calculateDistance(
          options.userLocation.lat,
          options.userLocation.lng,
          facility.location.lat,
          facility.location.lng
        )
      })).sort((a, b) => a.distance - b.distance);
    }

    return filteredFacilities;
  }

  /**
   * Get collection schedule for region
   * @param {string} region - Region code (optional, uses agent's region)
   * @returns {Object} Collection schedule
   */
  getCollectionSchedule(region = null) {
    const targetRegion = region || this.region;
    return this.disposalTimeService.getSchedule(targetRegion);
  }

  /**
   * Get regional policy information
   * @param {string} region - Region code (optional, uses agent's region)
   * @returns {Object} Regional policy
   */
  getRegionalPolicy(region = null) {
    const targetRegion = region || this.region;
    return this.disposalPolicyService.getRegionalPolicy(targetRegion);
  }

  /**
   * Generate helpful tips based on material and disposal method
   * @private
   */
  _generateTips(materialInfo, disposalRecommendation) {
    const tips = [];

    // Recycling tips
    if (disposalRecommendation.method === 'curbside-recycling') {
      tips.push('Rinse containers before recycling to prevent contamination');
      tips.push('Remove caps and lids if they\'re a different material');
      
      if (materialInfo.type === 'paper') {
        tips.push('Keep paper dry and free from food waste');
      }
    }

    // Composting tips
    if (materialInfo.compostable) {
      tips.push('Remove any non-compostable materials like stickers or ties');
      tips.push('Smaller pieces compost faster');
    }

    // Special disposal tips
    if (materialInfo.specialDisposal) {
      tips.push('Do not throw in regular trash - can harm environment');
      if (materialInfo.type === 'electronics') {
        tips.push('Remove personal data before disposal');
        tips.push('Consider donating if still functional');
      }
      if (materialInfo.type === 'hazardous') {
        tips.push('Keep in original container when possible');
        tips.push('Never mix different chemicals');
      }
    }

    // General reduction tip
    tips.push('Consider reducing use of single-use items');

    return tips;
  }

  /**
   * Calculate distance helper
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Change agent's default region
   * @param {string} newRegion - New region code
   */
  setRegion(newRegion) {
    this.region = newRegion;
  }
}

module.exports = EnvironmentalAgent;
