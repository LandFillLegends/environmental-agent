/**
 * Material Identifier Service
 * Identifies materials from text descriptions or image data
 */

class MaterialIdentifier {
  constructor() {
    // Material database with common waste items and their properties
    this.materialDatabase = {
      // Plastics
      'plastic bottle': { material: 'PET plastic', recyclable: true, type: 'plastic', resinCode: 1 },
      'milk jug': { material: 'HDPE plastic', recyclable: true, type: 'plastic', resinCode: 2 },
      'plastic bag': { material: 'LDPE plastic', recyclable: false, type: 'plastic', resinCode: 4 },
      'yogurt container': { material: 'PP plastic', recyclable: true, type: 'plastic', resinCode: 5 },
      'styrofoam': { material: 'PS plastic', recyclable: false, type: 'plastic', resinCode: 6 },
      
      // Paper
      'cardboard': { material: 'cardboard', recyclable: true, type: 'paper' },
      'newspaper': { material: 'newsprint', recyclable: true, type: 'paper' },
      'magazine': { material: 'glossy paper', recyclable: true, type: 'paper' },
      'pizza box': { material: 'cardboard', recyclable: 'conditional', type: 'paper', notes: 'Only if clean and grease-free' },
      
      // Metals
      'aluminum can': { material: 'aluminum', recyclable: true, type: 'metal' },
      'tin can': { material: 'steel', recyclable: true, type: 'metal' },
      'aerosol can': { material: 'aluminum/steel', recyclable: true, type: 'metal', notes: 'Must be empty' },
      
      // Glass
      'glass bottle': { material: 'glass', recyclable: true, type: 'glass' },
      'glass jar': { material: 'glass', recyclable: true, type: 'glass' },
      'window glass': { material: 'tempered glass', recyclable: false, type: 'glass', specialDisposal: true },
      
      // Electronics
      'battery': { material: 'various', recyclable: false, type: 'hazardous', specialDisposal: true },
      'phone': { material: 'electronics', recyclable: false, type: 'electronics', specialDisposal: true },
      'computer': { material: 'electronics', recyclable: false, type: 'electronics', specialDisposal: true },
      'light bulb': { material: 'glass/electronics', recyclable: false, type: 'electronics', specialDisposal: true },
      
      // Organics
      'food waste': { material: 'organic', recyclable: false, type: 'organic', compostable: true },
      'yard waste': { material: 'organic', recyclable: false, type: 'organic', compostable: true },
      
      // Hazardous
      'paint': { material: 'chemical', recyclable: false, type: 'hazardous', specialDisposal: true },
      'motor oil': { material: 'petroleum', recyclable: false, type: 'hazardous', specialDisposal: true },
      'cleaning product': { material: 'chemical', recyclable: false, type: 'hazardous', specialDisposal: true }
    };
  }

  /**
   * Identify material from text description
   * @param {string} description - Text description of the item
   * @returns {Object} Material information
   */
  identifyFromText(description) {
    if (!description || typeof description !== 'string') {
      throw new Error('Invalid description provided');
    }

    const normalizedDesc = description.toLowerCase().trim();
    
    // Direct match
    if (this.materialDatabase[normalizedDesc]) {
      return {
        identified: true,
        item: normalizedDesc,
        ...this.materialDatabase[normalizedDesc]
      };
    }

    // Fuzzy matching - check if description contains any known items
    for (const [item, info] of Object.entries(this.materialDatabase)) {
      if (normalizedDesc.includes(item) || item.includes(normalizedDesc.split(' ')[0])) {
        return {
          identified: true,
          item: item,
          confidence: 0.8,
          ...info
        };
      }
    }

    // If no match found, try to classify by keywords
    const classification = this._classifyByKeywords(normalizedDesc);
    if (classification) {
      return {
        identified: true,
        item: normalizedDesc,
        confidence: 0.5,
        ...classification
      };
    }

    return {
      identified: false,
      item: normalizedDesc,
      material: 'unknown',
      type: 'unknown',
      notes: 'Item not recognized. Please provide more details or consult local waste management.'
    };
  }

  /**
   * Identify material from image data
   * @param {string} imageData - Base64 encoded image or image path
   * @returns {Object} Material information
   */
  identifyFromImage(imageData) {
    if (!imageData) {
      throw new Error('Invalid image data provided');
    }

    // In a real implementation, this would use computer vision/ML
    // For now, we'll simulate with common items
    const simulatedResults = [
      'plastic bottle',
      'aluminum can',
      'cardboard',
      'glass bottle',
      'battery'
    ];

    const randomItem = simulatedResults[Math.floor(Math.random() * simulatedResults.length)];
    
    return {
      identified: true,
      item: randomItem,
      confidence: 0.85,
      source: 'image',
      ...this.materialDatabase[randomItem],
      notes: 'Identified from image analysis'
    };
  }

  /**
   * Classify item by keywords when exact match not found
   * @private
   */
  _classifyByKeywords(description) {
    const keywords = {
      plastic: ['plastic', 'polymer', 'bottle', 'container', 'packaging'],
      paper: ['paper', 'cardboard', 'box', 'newspaper', 'magazine'],
      metal: ['metal', 'aluminum', 'steel', 'can', 'foil'],
      glass: ['glass', 'jar', 'bottle'],
      electronics: ['electronic', 'battery', 'phone', 'computer', 'device'],
      organic: ['food', 'organic', 'compost', 'yard', 'plant']
    };

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => description.includes(word))) {
        return {
          material: type,
          type: type,
          recyclable: ['plastic', 'paper', 'metal', 'glass'].includes(type) ? 'maybe' : false
        };
      }
    }

    return null;
  }

  /**
   * Get all available materials in database
   * @returns {Array} List of all items
   */
  getAllItems() {
    return Object.keys(this.materialDatabase);
  }
}

module.exports = MaterialIdentifier;
