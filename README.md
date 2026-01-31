# 🌍 Landfill Legends - Environmental Agent

An agentic AI application that helps households dispose of everyday items correctly based on item type and local rules.

## Overview

**Landfill Legends** is an intelligent waste disposal assistant that:
- ✅ Identifies materials from text or image input
- ✅ Checks region-specific disposal policies
- ✅ Determines curbside vs. special drop-off requirements
- ✅ Locates nearby disposal facilities
- ✅ Suggests realistic disposal times
- ✅ Reduces guesswork, contamination, and landfill waste

## Features

### 🔍 Material Identification
- **Text Input**: Describe the item in plain language (e.g., "plastic bottle", "battery", "cardboard box")
- **Image Input**: Upload photos of waste items (simulated in current version)
- **Smart Recognition**: Handles various materials including plastics, paper, metals, glass, electronics, organics, and hazardous waste

### 🗺️ Region-Specific Policies
Supports multiple regions with tailored disposal guidelines:
- **California (US-CA)**: Strict recycling requirements, curbside composting
- **New York (US-NY)**: Comprehensive recycling program
- **Texas (US-TX)**: Variable city-specific programs
- **Default**: General guidelines for unsupported regions

### 🏢 Facility Locator
Find nearby facilities for:
- Recycling centers
- Hazardous waste disposal
- Electronics (e-waste) recycling
- Composting drop-off sites

### ⏰ Disposal Time Recommendations
- Next collection day calculations
- Urgency indicators (high/medium/low)
- Facility hours and availability
- Optimal disposal timing

### 💡 Helpful Tips
Personalized suggestions for:
- Proper preparation (cleaning, drying, separating)
- Contamination prevention
- Waste reduction strategies
- Safety precautions for hazardous materials

## Installation

```bash
# Clone the repository
git clone https://github.com/LandFillLegends/environmental-agent.git
cd environmental-agent

# Install dependencies
npm install
```

## Usage

### Quick Start

Try the quick demo to see all features:

```bash
npm run demo
```

### Command Line Interface (CLI)

Run the interactive CLI:

```bash
npm start
```

Or use the binary directly:

```bash
./src/cli.js
```

The CLI provides an interactive menu with options to:
1. Identify items from description
2. Simulate image identification
3. Search for facilities
4. View collection schedules
5. View regional policies
6. Change regions

### Programmatic Usage

```javascript
const EnvironmentalAgent = require('./src/agent');

// Initialize agent for a specific region
const agent = new EnvironmentalAgent('US-CA');

// Process text input
const result = await agent.processTextInput('plastic bottle');
console.log(result);

// Process image input
const imageResult = await agent.processImageInput(imageData);
console.log(imageResult);

// Search for facilities
const facilities = agent.searchFacilities('recycling', {
  userLocation: { lat: 37.7749, lng: -122.4194 }
});

// Get collection schedule
const schedule = agent.getCollectionSchedule();

// Get regional policy
const policy = agent.getRegionalPolicy();
```

### Example Output

```json
{
  "success": true,
  "item": "plastic bottle",
  "materialInfo": {
    "material": "PET plastic",
    "type": "plastic",
    "recyclable": true
  },
  "disposal": {
    "method": "curbside-recycling",
    "curbsideAccepted": true,
    "instructions": "Resin code #1 accepted in recycling bin",
    "region": "California"
  },
  "timing": {
    "recommendation": "Place in recycling bin by Tuesday morning",
    "urgency": "medium",
    "estimatedTime": "2 days",
    "nextCollection": "12/15/2024"
  },
  "tips": [
    "Rinse containers before recycling to prevent contamination",
    "Remove caps and lids if they're a different material",
    "Consider reducing use of single-use items"
  ]
}
```

## Running Examples

See the agent in action with comprehensive examples:

```bash
npm run examples
```

This will demonstrate:
- Various material types (plastics, metals, electronics, organics, hazardous)
- Different regions and policies
- Facility searches
- Schedule lookups
- Unknown item handling

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes:
- Unit tests for each service
- Integration tests for the main agent
- Coverage for edge cases and error handling

## Project Structure

```
environmental-agent/
├── src/
│   ├── agent.js                    # Main agent orchestrator
│   ├── cli.js                      # Command-line interface
│   ├── examples.js                 # Usage examples
│   └── services/
│       ├── materialIdentifier.js   # Material identification
│       ├── disposalPolicyService.js # Regional policies
│       ├── facilityLocator.js      # Facility search
│       └── disposalTimeService.js  # Time recommendations
├── tests/
│   ├── agent.test.js
│   ├── materialIdentifier.test.js
│   └── disposalPolicyService.test.js
├── package.json
├── jest.config.js
└── README.md
```

## Supported Materials

### Plastics
- PET (#1) - Plastic bottles, containers
- HDPE (#2) - Milk jugs, detergent bottles
- LDPE (#4) - Plastic bags, squeezable bottles
- PP (#5) - Yogurt containers, bottle caps
- PS (#6) - Styrofoam, disposable cups

### Paper Products
- Cardboard
- Newspapers
- Magazines
- Paper (conditional: pizza boxes)

### Metals
- Aluminum cans
- Steel/tin cans
- Aerosol cans (must be empty)

### Glass
- Bottles and jars
- Special handling for tempered glass

### Electronics
- Batteries
- Phones and computers
- Light bulbs

### Organics
- Food waste
- Yard waste

### Hazardous Materials
- Paint
- Motor oil
- Cleaning products

## Supported Regions

- **US-CA**: California - Comprehensive recycling and composting
- **US-NY**: New York - Extended producer responsibility programs
- **US-TX**: Texas - Variable by city
- **Default**: General guidelines for other regions

## API Reference

### EnvironmentalAgent

#### Methods

- `processTextInput(description, options)` - Process text description of waste item
- `processImageInput(imageData, options)` - Process image of waste item
- `searchFacilities(type, options)` - Search for disposal facilities
- `getCollectionSchedule(region)` - Get collection schedule for region
- `getRegionalPolicy(region)` - Get disposal policy for region
- `setRegion(region)` - Change agent's default region

#### Options

- `region` - Region code (e.g., 'US-CA', 'US-NY')
- `userLocation` - Object with `lat` and `lng` for distance calculations

## Future Enhancements

- [ ] Real computer vision integration for image recognition
- [ ] Mobile app (iOS/Android) with native camera support
- [ ] Additional regions and countries
- [ ] Real-time facility availability checking
- [ ] Community reporting and verification
- [ ] Gamification and rewards for proper disposal
- [ ] Integration with local waste management APIs
- [ ] Barcode scanning for instant identification
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details

## About

Landfill Legends is committed to making waste disposal easier and more sustainable for everyone. By providing clear, region-specific guidance, we help reduce contamination in recycling streams and keep hazardous materials out of landfills.

---

Made with 💚 for a cleaner planet