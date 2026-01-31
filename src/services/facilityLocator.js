/**
 * Facility Locator Service
 * Locates nearby waste disposal and recycling facilities
 */

class FacilityLocator {
  constructor() {
    // Mock database of facilities by region
    this.facilities = {
      'US-CA': [
        {
          id: 'ca-001',
          name: 'Bay Area Recycling Center',
          type: 'recycling',
          acceptedMaterials: ['plastic', 'paper', 'metal', 'glass', 'electronics'],
          location: { lat: 37.7749, lng: -122.4194, address: '123 Green St, San Francisco, CA 94102' },
          hours: { weekday: '8:00 AM - 6:00 PM', weekend: '9:00 AM - 5:00 PM' },
          phone: '(415) 555-0100'
        },
        {
          id: 'ca-002',
          name: 'California Household Hazardous Waste Facility',
          type: 'hazardous-waste',
          acceptedMaterials: ['hazardous', 'batteries', 'paint', 'chemicals'],
          location: { lat: 37.7849, lng: -122.4094, address: '456 Safe Disposal Rd, San Francisco, CA 94103' },
          hours: { weekday: '9:00 AM - 4:00 PM', weekend: 'Closed' },
          phone: '(415) 555-0200'
        },
        {
          id: 'ca-003',
          name: 'E-Waste Recycling Center',
          type: 'electronics',
          acceptedMaterials: ['electronics', 'batteries'],
          location: { lat: 37.7649, lng: -122.4294, address: '789 Tech Way, San Francisco, CA 94104' },
          hours: { weekday: '10:00 AM - 7:00 PM', weekend: '10:00 AM - 5:00 PM' },
          phone: '(415) 555-0300'
        },
        {
          id: 'ca-004',
          name: 'Composting Drop-off Site',
          type: 'composting',
          acceptedMaterials: ['organic', 'food waste', 'yard waste'],
          location: { lat: 37.7549, lng: -122.4394, address: '321 Compost Ln, San Francisco, CA 94105' },
          hours: { weekday: '7:00 AM - 5:00 PM', weekend: '8:00 AM - 4:00 PM' },
          phone: '(415) 555-0400'
        }
      ],
      'US-NY': [
        {
          id: 'ny-001',
          name: 'Manhattan Recycling Center',
          type: 'recycling',
          acceptedMaterials: ['plastic', 'paper', 'metal', 'glass'],
          location: { lat: 40.7128, lng: -74.0060, address: '100 Recycle Pl, New York, NY 10001' },
          hours: { weekday: '7:00 AM - 7:00 PM', weekend: '9:00 AM - 5:00 PM' },
          phone: '(212) 555-0100'
        },
        {
          id: 'ny-002',
          name: 'NYC SAFE Disposal Event',
          type: 'hazardous-waste',
          acceptedMaterials: ['hazardous', 'batteries', 'paint', 'electronics'],
          location: { lat: 40.7228, lng: -74.0160, address: '200 Safety St, New York, NY 10002' },
          hours: { weekday: 'By appointment', weekend: 'Events on select Saturdays' },
          phone: '(212) 555-0200'
        },
        {
          id: 'ny-003',
          name: 'Lower East Side E-Waste Drop-off',
          type: 'electronics',
          acceptedMaterials: ['electronics', 'batteries'],
          location: { lat: 40.7328, lng: -73.9960, address: '300 Tech Ave, New York, NY 10003' },
          hours: { weekday: '9:00 AM - 6:00 PM', weekend: '10:00 AM - 4:00 PM' },
          phone: '(212) 555-0300'
        }
      ],
      'US-TX': [
        {
          id: 'tx-001',
          name: 'Austin Recycling Center',
          type: 'recycling',
          acceptedMaterials: ['plastic', 'paper', 'metal', 'glass'],
          location: { lat: 30.2672, lng: -97.7431, address: '500 Recycle Rd, Austin, TX 78701' },
          hours: { weekday: '8:00 AM - 5:00 PM', weekend: '9:00 AM - 3:00 PM' },
          phone: '(512) 555-0100'
        },
        {
          id: 'tx-002',
          name: 'Texas Environmental Service Center',
          type: 'hazardous-waste',
          acceptedMaterials: ['hazardous', 'batteries', 'paint', 'chemicals'],
          location: { lat: 30.2772, lng: -97.7531, address: '600 Waste Way, Austin, TX 78702' },
          hours: { weekday: '9:00 AM - 4:00 PM', weekend: 'First Saturday of month' },
          phone: '(512) 555-0200'
        }
      ]
    };
  }

  /**
   * Find facilities near a location
   * @param {string} region - Region code
   * @param {Object} materialInfo - Material information
   * @param {Object} userLocation - User's location {lat, lng} (optional)
   * @returns {Array} List of relevant facilities
   */
  findNearbyFacilities(region, materialInfo, userLocation = null) {
    const normalizedRegion = region ? region.toUpperCase() : 'US-CA';
    const facilities = this.facilities[normalizedRegion] || [];

    // Filter facilities by material type
    const relevantFacilities = facilities.filter(facility => {
      const { type, specialDisposal, compostable } = materialInfo;
      
      // Special disposal items
      if (specialDisposal) {
        if (type === 'electronics') {
          return facility.type === 'electronics' || facility.type === 'hazardous-waste';
        }
        if (type === 'hazardous') {
          return facility.type === 'hazardous-waste';
        }
      }

      // Compostable items
      if (compostable) {
        return facility.type === 'composting';
      }

      // Regular recyclables
      return facility.type === 'recycling' && 
             facility.acceptedMaterials.includes(type);
    });

    // If user location provided, calculate distances
    if (userLocation && userLocation.lat && userLocation.lng) {
      return relevantFacilities.map(facility => ({
        ...facility,
        distance: this._calculateDistance(
          userLocation.lat,
          userLocation.lng,
          facility.location.lat,
          facility.location.lng
        )
      })).sort((a, b) => a.distance - b.distance);
    }

    return relevantFacilities;
  }

  /**
   * Get facility by ID
   * @param {string} facilityId - Facility ID
   * @returns {Object|null} Facility details
   */
  getFacilityById(facilityId) {
    for (const facilities of Object.values(this.facilities)) {
      const facility = facilities.find(f => f.id === facilityId);
      if (facility) return facility;
    }
    return null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Radius of Earth in miles
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal
  }

  /**
   * Convert degrees to radians
   * @private
   */
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get all facilities for a region
   * @param {string} region - Region code
   * @returns {Array} All facilities in region
   */
  getAllFacilities(region) {
    const normalizedRegion = region ? region.toUpperCase() : 'US-CA';
    return this.facilities[normalizedRegion] || [];
  }
}

module.exports = FacilityLocator;
