/**
 * Prepare training data for OpenAI fine-tuning
 * This creates JSONL format training examples specific to your canvas app
 */

const fs = require('fs');
const path = require('path');

// Training examples specific to your canvas application
const trainingExamples = [
  // Canvas element operations
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "add a dog emoji" },
      { role: "assistant", content: '{"commands":[{"action":"addElement","params":{"type":"emoji","emoji":"🐶"}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "add text that says Welcome" },
      { role: "assistant", content: '{"commands":[{"action":"addElement","params":{"type":"text","text":"Welcome","fontSize":24}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "create a bar chart" },
      { role: "assistant", content: '{"commands":[{"action":"addVisualization","params":{"type":"barChart","title":"Bar Chart"}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "add a line chart showing sales" },
      { role: "assistant", content: '{"commands":[{"action":"addVisualization","params":{"type":"lineChart","title":"Sales"}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "arrange everything in a grid" },
      { role: "assistant", content: '{"commands":[{"action":"arrangeGrid"}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "add a blue rectangle" },
      { role: "assistant", content: '{"commands":[{"action":"addElement","params":{"type":"shape","shape":"rectangle","fill":"#3B82F6"}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "connect the data to the chart" },
      { role: "assistant", content: '{"commands":[{"action":"bindData","target":{"selector":"#last"}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "add three charts side by side" },
      { role: "assistant", content: '{"commands":[{"action":"addVisualization","params":{"type":"barChart","title":"Chart 1"}},{"action":"addVisualization","params":{"type":"lineChart","title":"Chart 2"}},{"action":"addVisualization","params":{"type":"pieChart","title":"Chart 3"}},{"action":"distribute","params":{"direction":"horizontal"}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "add a 🎉 emoji" },
      { role: "assistant", content: '{"commands":[{"action":"addElement","params":{"type":"emoji","emoji":"🎉","fontSize":64}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "delete everything" },
      { role: "assistant", content: '{"commands":[{"action":"clearCanvas"}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "make it bigger" },
      { role: "assistant", content: '{"commands":[{"action":"resizeItem","target":{"selector":"@selected"},"params":{"width":600,"height":400}}]}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "move it to the right" },
      { role: "assistant", content: '{"commands":[{"action":"moveItem","target":{"selector":"@selected"},"params":{"dx":100,"dy":0}}]}' }
    ]
  },
  // Add failure cases - what NOT to do
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "what's the weather?" },
      { role: "assistant", content: '{"error":"I only handle canvas operations. I cannot answer questions about weather."}' }
    ]
  },
  {
    messages: [
      { role: "system", content: "You are a canvas assistant that ONLY understands canvas operations. Output JSON commands only." },
      { role: "user", content: "write me a poem" },
      { role: "assistant", content: '{"error":"I only handle canvas operations. Try: add text, add emoji, create chart, arrange items."}' }
    ]
  }
];

// Convert to JSONL format for OpenAI
const jsonlData = trainingExamples
  .map(example => JSON.stringify(example))
  .join('\n');

// Write training data
fs.writeFileSync(
  path.join(__dirname, '../training-data.jsonl'),
  jsonlData
);

console.log(`✅ Created training data with ${trainingExamples.length} examples`);
console.log('📝 Next steps:');
console.log('1. Upload to OpenAI: openai api fine_tuning.jobs.create -t training-data.jsonl -m gpt-4o-mini-2024-07-18');
console.log('2. Wait for training to complete');
console.log('3. Update OPENAI_MODEL in .env to use your fine-tuned model');