#!/usr/bin/env node

/**
 * Landfill Legends CLI
 * Command-line interface for the Environmental Agent
 */

const EnvironmentalAgent = require('./agent');
const readline = require('readline');

// ANSI color codes for better CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

class LandfillLegendsCLI {
  constructor() {
    this.agent = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log(`${colors.bright}${colors.green}╔═══════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║     🌍 LANDFILL LEGENDS 🌍          ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║   Helping You Dispose Responsibly    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚═══════════════════════════════════════╝${colors.reset}\n`);

    // Get region
    const region = await this.askQuestion('Enter your region code (e.g., US-CA, US-NY, US-TX) or press Enter for default: ');
    this.agent = new EnvironmentalAgent(region || 'default');
    
    console.log(`\n${colors.cyan}Region set to: ${region || 'default'}${colors.reset}\n`);

    await this.mainMenu();
  }

  async mainMenu() {
    while (true) {
      console.log(`\n${colors.bright}What would you like to do?${colors.reset}`);
      console.log('1. Identify item from description');
      console.log('2. Simulate image identification');
      console.log('3. Search for facilities');
      console.log('4. View collection schedule');
      console.log('5. View regional policy');
      console.log('6. Change region');
      console.log('7. Exit');

      const choice = await this.askQuestion('\nEnter your choice (1-7): ');

      switch (choice.trim()) {
        case '1':
          await this.identifyFromText();
          break;
        case '2':
          await this.identifyFromImage();
          break;
        case '3':
          await this.searchFacilities();
          break;
        case '4':
          await this.viewSchedule();
          break;
        case '5':
          await this.viewPolicy();
          break;
        case '6':
          await this.changeRegion();
          break;
        case '7':
          console.log(`\n${colors.green}Thank you for using Landfill Legends! 🌍♻️${colors.reset}\n`);
          this.rl.close();
          return;
        default:
          console.log(`${colors.red}Invalid choice. Please try again.${colors.reset}`);
      }
    }
  }

  async identifyFromText() {
    console.log(`\n${colors.bright}${colors.blue}=== Identify Item from Description ===${colors.reset}`);
    const description = await this.askQuestion('Enter the item description: ');

    if (!description.trim()) {
      console.log(`${colors.red}Please enter a valid description.${colors.reset}`);
      return;
    }

    console.log(`\n${colors.yellow}Processing...${colors.reset}`);
    const result = await this.agent.processTextInput(description);

    this.displayResult(result);
  }

  async identifyFromImage() {
    console.log(`\n${colors.bright}${colors.blue}=== Identify Item from Image ===${colors.reset}`);
    console.log('(This is a simulation - in a real app, you would upload an image)');
    
    const confirm = await this.askQuestion('Proceed with simulation? (y/n): ');
    if (confirm.toLowerCase() !== 'y') return;

    console.log(`\n${colors.yellow}Processing image...${colors.reset}`);
    const result = await this.agent.processImageInput('simulated_image_data');

    this.displayResult(result);
  }

  async searchFacilities() {
    console.log(`\n${colors.bright}${colors.blue}=== Search Facilities ===${colors.reset}`);
    console.log('Facility types:');
    console.log('  - recycling');
    console.log('  - hazardous-waste');
    console.log('  - electronics');
    console.log('  - composting');
    console.log('  - (leave blank for all)');

    const facilityType = await this.askQuestion('\nEnter facility type: ');
    const facilities = this.agent.searchFacilities(facilityType || null);

    console.log(`\n${colors.green}Found ${facilities.length} facilities:${colors.reset}\n`);
    
    facilities.forEach((facility, index) => {
      console.log(`${colors.bright}${index + 1}. ${facility.name}${colors.reset}`);
      console.log(`   Type: ${facility.type}`);
      console.log(`   Address: ${facility.location.address}`);
      console.log(`   Hours: Weekday ${facility.hours.weekday}, Weekend ${facility.hours.weekend}`);
      console.log(`   Phone: ${facility.phone}\n`);
    });
  }

  async viewSchedule() {
    console.log(`\n${colors.bright}${colors.blue}=== Collection Schedule ===${colors.reset}`);
    const schedule = this.agent.getCollectionSchedule();

    console.log(`\n${colors.green}Collection days for your region:${colors.reset}`);
    console.log(`Trash: ${Array.isArray(schedule.trash) ? schedule.trash.join(', ') : schedule.trash}`);
    console.log(`Recycling: ${Array.isArray(schedule.recycling) ? schedule.recycling.join(', ') : schedule.recycling}`);
    console.log(`Composting: ${schedule.composting}`);
    console.log(`Bulky items: ${schedule.bulky}`);
  }

  async viewPolicy() {
    console.log(`\n${colors.bright}${colors.blue}=== Regional Policy ===${colors.reset}`);
    const policy = this.agent.getRegionalPolicy();

    console.log(`\n${colors.green}Region: ${policy.name} (${policy.country})${colors.reset}`);
    console.log(`\n${colors.bright}Curbside Recycling:${colors.reset}`);
    console.log(`  Plastic codes: ${policy.curbsideRecycling.plastic}`);
    console.log(`  Paper: ${policy.curbsideRecycling.paper ? 'Yes' : 'No'}`);
    console.log(`  Cardboard: ${policy.curbsideRecycling.cardboard ? 'Yes' : 'No'}`);
    console.log(`  Metal: ${policy.curbsideRecycling.metal ? 'Yes' : 'No'}`);
    console.log(`  Glass: ${policy.curbsideRecycling.glass ? 'Yes' : 'No'}`);
    
    console.log(`\n${colors.bright}Organics Program:${colors.reset}`);
    console.log(`  Available: ${policy.organics.compostingAvailable ? 'Yes' : 'No'}`);
    console.log(`  Curbside pickup: ${policy.organics.curbsidePickup ? 'Yes' : 'No'}`);
    
    console.log(`\n${colors.cyan}Notes: ${policy.notes}${colors.reset}`);
  }

  async changeRegion() {
    const region = await this.askQuestion('Enter new region code: ');
    this.agent.setRegion(region || 'default');
    console.log(`${colors.green}Region changed to: ${region || 'default'}${colors.reset}`);
  }

  displayResult(result) {
    if (!result.success) {
      console.log(`\n${colors.red}❌ Error: ${result.error}${colors.reset}`);
      if (result.suggestion) {
        console.log(`${colors.yellow}Suggestion: ${result.suggestion}${colors.reset}`);
      }
      return;
    }

    console.log(`\n${colors.bright}${colors.green}✓ Item Identified: ${result.item}${colors.reset}`);
    
    if (result.confidence) {
      console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    }

    console.log(`\n${colors.bright}Material Information:${colors.reset}`);
    console.log(`  Material: ${result.materialInfo.material}`);
    console.log(`  Type: ${result.materialInfo.type}`);
    console.log(`  Recyclable: ${result.materialInfo.recyclable}`);
    if (result.materialInfo.compostable) {
      console.log(`  Compostable: Yes`);
    }

    console.log(`\n${colors.bright}Disposal Instructions:${colors.reset}`);
    console.log(`  Method: ${result.disposal.method}`);
    console.log(`  Curbside accepted: ${result.disposal.curbsideAccepted ? 'Yes' : 'No'}`);
    console.log(`  Instructions: ${result.disposal.instructions}`);
    console.log(`  Region: ${result.disposal.region}`);

    console.log(`\n${colors.bright}Timing Recommendation:${colors.reset}`);
    console.log(`  Recommendation: ${result.timing.recommendation}`);
    console.log(`  Urgency: ${result.timing.urgency}`);
    console.log(`  Estimated time: ${result.timing.estimatedTime}`);

    if (result.facilities && result.facilities.length > 0) {
      console.log(`\n${colors.bright}Nearby Facilities:${colors.reset}`);
      result.facilities.forEach((facility, index) => {
        console.log(`  ${index + 1}. ${facility.name}`);
        console.log(`     ${facility.location.address}`);
        if (facility.distance) {
          console.log(`     Distance: ${facility.distance} miles`);
        }
        console.log(`     Phone: ${facility.phone}`);
      });
    }

    if (result.tips && result.tips.length > 0) {
      console.log(`\n${colors.bright}${colors.cyan}Helpful Tips:${colors.reset}`);
      result.tips.forEach((tip, index) => {
        console.log(`  💡 ${tip}`);
      });
    }
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Run CLI if executed directly
if (require.main === module) {
  const cli = new LandfillLegendsCLI();
  cli.start().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = LandfillLegendsCLI;
