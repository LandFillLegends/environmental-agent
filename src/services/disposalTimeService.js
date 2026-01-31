/**
 * Disposal Time Service
 * Suggests optimal disposal times based on schedules and urgency
 */

class DisposalTimeService {
  constructor() {
    // Typical collection schedules by region and type
    this.schedules = {
      'US-CA': {
        trash: ['Monday', 'Thursday'],
        recycling: ['Tuesday'],
        composting: ['Friday'],
        bulky: 'By appointment'
      },
      'US-NY': {
        trash: ['Monday', 'Wednesday', 'Friday'],
        recycling: ['Tuesday', 'Thursday'],
        composting: 'Not available',
        bulky: 'By appointment'
      },
      'US-TX': {
        trash: ['Tuesday', 'Friday'],
        recycling: ['Wednesday'],
        composting: 'Not available',
        bulky: 'First Saturday of month'
      },
      'default': {
        trash: ['Contact local waste management'],
        recycling: ['Contact local waste management'],
        composting: 'Contact local waste management',
        bulky: 'By appointment'
      }
    };
  }

  /**
   * Get disposal time recommendation
   * @param {Object} disposalRecommendation - From disposal policy service
   * @param {string} region - Region code
   * @param {Date} currentDate - Current date (optional, defaults to now)
   * @returns {Object} Time recommendation
   */
  getDisposalTime(disposalRecommendation, region = 'default', currentDate = new Date()) {
    const { method, curbsideAccepted } = disposalRecommendation;
    const schedule = this.schedules[region.toUpperCase()] || this.schedules['default'];

    // Curbside collection
    if (method === 'curbside-recycling' && curbsideAccepted) {
      return this._getNextCollectionDay(schedule.recycling, currentDate, 'Recycling');
    }

    if (method === 'composting' && curbsideAccepted) {
      return this._getNextCollectionDay(schedule.composting, currentDate, 'Composting');
    }

    if (method === 'landfill') {
      return this._getNextCollectionDay(schedule.trash, currentDate, 'Trash');
    }

    // Special disposal - facility drop-off
    if (method === 'special-disposal' || method === 'drop-off-recycling') {
      return {
        timing: 'At your convenience',
        urgency: this._determineUrgency(disposalRecommendation),
        recommendation: 'Drop off at facility during business hours',
        notes: disposalRecommendation.notes,
        estimatedTime: 'Within 1 week recommended'
      };
    }

    // Default
    return {
      timing: 'Contact local waste management',
      urgency: 'medium',
      recommendation: 'Check with local authorities for proper disposal method',
      estimatedTime: 'As soon as possible'
    };
  }

  /**
   * Calculate next collection day
   * @private
   */
  _getNextCollectionDay(collectionDays, currentDate, collectionType) {
    if (typeof collectionDays === 'string') {
      return {
        timing: collectionDays,
        urgency: 'low',
        recommendation: collectionDays,
        estimatedTime: collectionDays
      };
    }

    if (!Array.isArray(collectionDays) || collectionDays.length === 0) {
      return {
        timing: 'Contact local waste management',
        urgency: 'low',
        recommendation: 'Check local schedule',
        estimatedTime: 'Next available collection day'
      };
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = currentDate.getDay();
    const currentDayName = daysOfWeek[currentDay];

    // Find next collection day
    let nextDay = null;
    let daysUntil = 7;

    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const checkDayName = daysOfWeek[checkDay];
      
      if (collectionDays.includes(checkDayName)) {
        if (i === 0 && currentDate.getHours() < 6) {
          // Today but before 6 AM
          nextDay = 'Today';
          daysUntil = 0;
        } else if (i === 1) {
          nextDay = 'Tomorrow';
          daysUntil = 1;
        } else {
          nextDay = checkDayName;
          daysUntil = i;
        }
        break;
      }
    }

    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + daysUntil);

    return {
      timing: nextDay || 'Check schedule',
      urgency: daysUntil <= 1 ? 'high' : 'medium',
      recommendation: `Place in ${collectionType.toLowerCase()} bin by ${nextDay} morning (${nextDate.toLocaleDateString()})`,
      nextCollection: nextDate.toLocaleDateString(),
      daysUntil: daysUntil,
      estimatedTime: `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
    };
  }

  /**
   * Determine urgency of disposal
   * @private
   */
  _determineUrgency(disposalRecommendation) {
    const { method, notes } = disposalRecommendation;

    // Hazardous materials are high urgency
    if (method === 'special-disposal' && 
        (notes?.includes('hazardous') || notes?.includes('Household hazardous'))) {
      return 'high';
    }

    // Electronics are medium urgency
    if (method === 'special-disposal' && 
        (notes?.includes('electronics') || notes?.includes('E-waste'))) {
      return 'medium';
    }

    // Everything else is low urgency
    return 'low';
  }

  /**
   * Get schedule for a region
   * @param {string} region - Region code
   * @returns {Object} Collection schedule
   */
  getSchedule(region) {
    return this.schedules[region.toUpperCase()] || this.schedules['default'];
  }
}

module.exports = DisposalTimeService;
