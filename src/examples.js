/**
 * Example usage of the Environmental Agent
 * Demonstrates various features and use cases
 */

const EnvironmentalAgent = require('./agent');

async function runExamples() {
  console.log('🌍 Landfill Legends - Environmental Agent Examples\n');
  console.log('='.repeat(60));

  // Initialize agent for California
  const agent = new EnvironmentalAgent('US-CA');

  // Example 1: Text input - plastic bottle
  console.log('\n📝 Example 1: Identifying a plastic bottle');
  console.log('-'.repeat(60));
  const result1 = await agent.processTextInput('plastic bottle');
  console.log(JSON.stringify(result1, null, 2));

  // Example 2: Text input - battery (hazardous)
  console.log('\n\n📝 Example 2: Identifying a battery (hazardous material)');
  console.log('-'.repeat(60));
  const result2 = await agent.processTextInput('battery', {
    region: 'US-NY',
    userLocation: { lat: 40.7128, lng: -74.0060 }
  });
  console.log(JSON.stringify(result2, null, 2));

  // Example 3: Image input simulation
  console.log('\n\n📷 Example 3: Image identification (simulated)');
  console.log('-'.repeat(60));
  const result3 = await agent.processImageInput('mock_image_data', {
    region: 'US-CA'
  });
  console.log(JSON.stringify(result3, null, 2));

  // Example 4: Food waste (compostable)
  console.log('\n\n📝 Example 4: Food waste disposal');
  console.log('-'.repeat(60));
  const result4 = await agent.processTextInput('food waste');
  console.log(JSON.stringify(result4, null, 2));

  // Example 5: Search for facilities
  console.log('\n\n🏢 Example 5: Finding recycling facilities');
  console.log('-'.repeat(60));
  const facilities = agent.searchFacilities('recycling', {
    region: 'US-CA'
  });
  console.log(JSON.stringify(facilities, null, 2));

  // Example 6: Get collection schedule
  console.log('\n\n📅 Example 6: Collection schedule for California');
  console.log('-'.repeat(60));
  const schedule = agent.getCollectionSchedule('US-CA');
  console.log(JSON.stringify(schedule, null, 2));

  // Example 7: Get regional policy
  console.log('\n\n📋 Example 7: California disposal policy');
  console.log('-'.repeat(60));
  const policy = agent.getRegionalPolicy('US-CA');
  console.log(JSON.stringify(policy, null, 2));

  // Example 8: Cardboard box
  console.log('\n\n📝 Example 8: Cardboard disposal');
  console.log('-'.repeat(60));
  const result8 = await agent.processTextInput('cardboard box');
  console.log(JSON.stringify(result8, null, 2));

  // Example 9: Electronics disposal
  console.log('\n\n📝 Example 9: Old phone disposal');
  console.log('-'.repeat(60));
  const result9 = await agent.processTextInput('phone', {
    region: 'US-TX'
  });
  console.log(JSON.stringify(result9, null, 2));

  // Example 10: Unknown item
  console.log('\n\n📝 Example 10: Unknown item handling');
  console.log('-'.repeat(60));
  const result10 = await agent.processTextInput('unknown weird item');
  console.log(JSON.stringify(result10, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('✅ All examples completed!\n');
}

// Run examples if executed directly
if (require.main === module) {
  runExamples().catch(error => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}

module.exports = { runExamples };
