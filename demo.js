#!/usr/bin/env node

/**
 * Quick demonstration of Landfill Legends features
 */

const EnvironmentalAgent = require('./src/agent');

async function demo() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           🌍 LANDFILL LEGENDS DEMO 🌍                 ║');
  console.log('║     Your Smart Waste Disposal Assistant               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const agent = new EnvironmentalAgent('US-CA');

  // Demo 1: Simple recyclable item
  console.log('📦 Demo 1: Identifying a Plastic Bottle\n');
  const result1 = await agent.processTextInput('plastic bottle');
  console.log(`✓ Item: ${result1.item}`);
  console.log(`✓ Material: ${result1.materialInfo.material}`);
  console.log(`✓ Disposal: ${result1.disposal.method} (${result1.disposal.instructions})`);
  console.log(`✓ When: ${result1.timing.recommendation}`);
  console.log(`✓ Tip: ${result1.tips[0]}\n`);

  // Demo 2: Hazardous material
  console.log('⚠️  Demo 2: Identifying a Battery\n');
  const result2 = await agent.processTextInput('battery');
  console.log(`✓ Item: ${result2.item}`);
  console.log(`✓ Type: ${result2.materialInfo.type} (Special disposal required)`);
  console.log(`✓ Disposal: ${result2.disposal.method}`);
  console.log(`✓ Urgency: ${result2.timing.urgency}`);
  if (result2.facilities && result2.facilities.length > 0) {
    console.log(`✓ Nearest Facility: ${result2.facilities[0].name}`);
    console.log(`  Address: ${result2.facilities[0].location.address}`);
  }
  console.log();

  // Demo 3: Compostable item
  console.log('🌱 Demo 3: Food Waste Disposal\n');
  const result3 = await agent.processTextInput('food waste');
  console.log(`✓ Item: ${result3.item}`);
  console.log(`✓ Compostable: ${result3.materialInfo.compostable ? 'Yes' : 'No'}`);
  console.log(`✓ Disposal: ${result3.disposal.method}`);
  console.log(`✓ Instructions: ${result3.disposal.instructions}`);
  console.log();

  // Demo 4: Facility search
  console.log('🏢 Demo 4: Finding Recycling Centers\n');
  const facilities = agent.searchFacilities('recycling');
  console.log(`✓ Found ${facilities.length} recycling centers:`);
  facilities.slice(0, 2).forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name} - ${f.location.address}`);
  });
  console.log();

  // Demo 5: Collection schedule
  console.log('📅 Demo 5: Collection Schedule\n');
  const schedule = agent.getCollectionSchedule();
  console.log(`✓ Trash: ${schedule.trash.join(', ')}`);
  console.log(`✓ Recycling: ${schedule.recycling.join(', ')}`);
  console.log(`✓ Composting: ${schedule.composting.join(', ')}`);
  console.log();

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║          ✨ Demo Complete! ✨                          ║');
  console.log('║                                                        ║');
  console.log('║  Try it yourself:                                      ║');
  console.log('║    npm start      - Interactive CLI                   ║');
  console.log('║    npm run examples - More detailed examples          ║');
  console.log('║    npm test       - Run test suite                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

demo().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
