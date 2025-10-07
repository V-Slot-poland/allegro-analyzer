/**
 * OpenAI GPT-5 - Working Examples
 *
 * Tested and verified code examples for GPT-5 API.
 * All examples use the Responses API (/v1/responses).
 */

// ============================================================================
// EXAMPLE 1: Basic GPT-5-mini request (no tools)
// ============================================================================

async function example1_basicRequest() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      instructions: 'You are a helpful assistant.',
      input: 'What is the capital of Poland?',
      reasoning: {
        effort: 'minimal'  // Fast response
      },
      text: {
        verbosity: 'low'   // Concise answer
      }
    })
  });

  const data = await response.json();

  // Extract text from response
  const messageItem = data.output.find(item => item.type === 'message');
  const textContent = messageItem.content.find(c => c.type === 'output_text');

  console.log('Answer:', textContent.text);
  console.log('Tokens used:', data.usage.total_tokens);
}


// ============================================================================
// EXAMPLE 2: GPT-5-mini with Web Search
// ============================================================================

async function example2_withWebSearch() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      instructions: 'You are a research assistant. Use web search to find accurate, up-to-date information.',
      input: 'Search for the latest price of iPhone 15 Pro in Poland on allegro.pl',
      tools: [
        {
          type: 'web_search'
        }
      ],
      reasoning: {
        effort: 'medium'  // Balance speed and accuracy
      },
      text: {
        verbosity: 'medium'
      }
    })
  });

  const data = await response.json();

  // Count web searches performed
  const webSearches = data.output.filter(item => item.type === 'web_search_call');
  console.log(`Web searches performed: ${webSearches.length}`);

  // Extract answer
  const messageItem = data.output.find(item => item.type === 'message');
  const textContent = messageItem.content.find(c => c.type === 'output_text');

  console.log('Answer:', textContent.text);

  // Extract URL citations
  const citations = textContent.annotations?.filter(a => a.type === 'url_citation') || [];
  console.log('Sources:');
  citations.forEach((cite, i) => {
    console.log(`  ${i + 1}. ${cite.title}`);
    console.log(`     ${cite.url}`);
  });
}


// ============================================================================
// EXAMPLE 3: JSON Response (for structured data)
// ============================================================================

async function example3_jsonResponse() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const prompt = `Analyze this product and return JSON:

Product: "iPhone 15 Pro 256GB"
Price: 4999 PLN

Return in this JSON format:
{
  "productName": "...",
  "price": 0.00,
  "category": "...",
  "isExpensive": true/false,
  "recommendation": "..."
}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      instructions: 'You are a product analyst. ALWAYS return valid JSON matching the requested schema.',
      input: prompt,
      reasoning: {
        effort: 'low'
      }
    })
  });

  const data = await response.json();
  const messageItem = data.output.find(item => item.type === 'message');
  const textContent = messageItem.content.find(c => c.type === 'output_text');

  try {
    const jsonResult = JSON.parse(textContent.text);
    console.log('Parsed JSON:', jsonResult);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.log('Raw response:', textContent.text);
  }
}


// ============================================================================
// EXAMPLE 4: Function Calling
// ============================================================================

async function example4_functionCalling() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      instructions: 'You are a helpful assistant that can check weather.',
      input: 'What is the weather in Warsaw?',
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get current weather for a location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'City name, e.g., Warsaw, Poland'
                },
                unit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                  description: 'Temperature unit'
                }
              },
              required: ['location']
            }
          }
        }
      ],
      reasoning: {
        effort: 'low'
      }
    })
  });

  const data = await response.json();

  // Check if function was called
  const functionCall = data.output.find(item => item.type === 'function_call');

  if (functionCall) {
    console.log('Function called:', functionCall.name);
    console.log('Arguments:', functionCall.arguments);

    // Here you would call your actual function
    // const weatherData = await getWeather(functionCall.arguments);

    // Then send result back to GPT-5 (multi-turn conversation)
  }
}


// ============================================================================
// EXAMPLE 5: Error Handling (robust)
// ============================================================================

async function example5_errorHandling() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        instructions: 'You are a helpful assistant.',
        input: 'Hello, how are you?',
        reasoning: {
          effort: 'minimal'
        }
      })
    });

    // Check HTTP status
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error ${response.status}: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Check response status
    if (data.status === 'failed') {
      throw new Error(`Response failed: ${data.error?.message || 'Unknown error'}`);
    }

    // Extract text with fallback
    let responseText;

    const messageItem = data.output?.find(item => item.type === 'message');

    if (messageItem && messageItem.content) {
      const textContent = messageItem.content.find(c => c.type === 'output_text');
      if (textContent) {
        responseText = textContent.text;
      }
    }

    if (!responseText) {
      throw new Error('Could not extract text from response');
    }

    console.log('Success:', responseText);
    return responseText;

  } catch (error) {
    console.error('Error:', error.message);

    // Handle specific errors
    if (error.message.includes('401')) {
      console.error('Authentication failed - check your API key');
    } else if (error.message.includes('429')) {
      console.error('Rate limit exceeded - wait and retry');
    } else if (error.message.includes('timeout')) {
      console.error('Request timed out - try again or use faster model');
    }

    throw error;
  }
}


// ============================================================================
// EXAMPLE 6: High-quality Analysis (our Allegro use case)
// ============================================================================

async function example6_allegroAnalysis() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const auctionData = {
    url: 'https://allegro.pl/oferta/product-123',
    title: 'iPhone 15 Pro 256GB',
    price: 4999,
    imageCount: 8,
    descriptionLength: 2500
  };

  const prompt = `Analyze this Allegro auction and find competition:

YOUR AUCTION:
URL: ${auctionData.url}
Title: ${auctionData.title}
Price: ${auctionData.price} PLN
Photos: ${auctionData.imageCount}
Description length: ${auctionData.descriptionLength} chars

TASK:
1. Search for 3-5 competing auctions on Allegro.pl
2. Extract REAL data: prices, delivery times, shipping costs
3. Compare and rate this auction (0-5 stars)
4. Provide specific improvements

Return JSON format:
{
  "rating": 4.0,
  "yourAuction": {
    "price": ${auctionData.price},
    "deliveryTime": "...",
    "shippingCost": "..."
  },
  "bestCompetitor": {
    "url": "https://...",
    "price": 0.00,
    "deliveryTime": "...",
    "shippingCost": "..."
  },
  "advantages": ["..."],
  "suggestions": "..."
}`;

  console.log('Starting analysis (may take 1-2 minutes)...\n');

  const startTime = Date.now();

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      instructions: 'You are an expert at Allegro auction optimization. Use web search to find REAL competitor data. Return response in JSON format.',
      input: prompt,
      tools: [
        {
          type: 'web_search'
        }
      ],
      reasoning: {
        effort: 'medium'  // Good balance for analysis
      },
      text: {
        verbosity: 'medium'
      }
    })
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Completed in ${elapsed}s\n`);

  const data = await response.json();

  // Count web searches
  const webSearches = data.output.filter(item => item.type === 'web_search_call');
  console.log(`Web searches: ${webSearches.length}`);

  // Extract and parse JSON
  const messageItem = data.output.find(item => item.type === 'message');
  const textContent = messageItem.content.find(c => c.type === 'output_text');

  try {
    const analysis = JSON.parse(textContent.text);

    console.log('\n=== Analysis Results ===');
    console.log(`Rating: ${analysis.rating}/5`);
    console.log(`Best competitor price: ${analysis.bestCompetitor?.price} PLN`);
    console.log(`Competitor URL: ${analysis.bestCompetitor?.url}`);
    console.log(`\nAdvantages: ${analysis.advantages?.join(', ')}`);

    return analysis;

  } catch (error) {
    console.error('Failed to parse JSON response');
    console.log('Raw response:', textContent.text);
    throw error;
  }
}


// ============================================================================
// EXAMPLE 7: Streaming (for real-time responses)
// ============================================================================

async function example7_streaming() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // Note: Streaming requires different handling
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      instructions: 'You are a helpful assistant.',
      input: 'Write a short poem about coding.',
      reasoning: {
        effort: 'minimal'
      },
      stream: true  // Enable streaming
    })
  });

  // Process stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          // Process streaming chunk
          console.log(parsed);
        } catch (e) {
          // Ignore parse errors in streaming
        }
      }
    }
  }
}


// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extract text from GPT-5 response (handles all formats)
 */
function extractTextFromResponse(data) {
  // Primary: Responses API format
  if (data.output && Array.isArray(data.output)) {
    const messageItem = data.output.find(item => item.type === 'message');
    if (messageItem && messageItem.content && Array.isArray(messageItem.content)) {
      const textContent = messageItem.content.find(c => c.type === 'output_text');
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }
  }

  // Fallback: Other formats
  if (data.output && typeof data.output === 'string') {
    return data.output;
  }

  if (data.output_text) {
    return data.output_text;
  }

  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }

  throw new Error('Could not extract text from response - unknown format');
}

/**
 * Calculate estimated cost
 */
function estimateCost(usage, model = 'gpt-5-mini') {
  // Rough estimates (check current pricing)
  const pricing = {
    'gpt-5': { input: 0.00003, output: 0.00012 },
    'gpt-5-mini': { input: 0.000015, output: 0.00006 },
    'gpt-5-nano': { input: 0.000005, output: 0.00002 }
  };

  const rates = pricing[model] || pricing['gpt-5-mini'];

  const inputCost = (usage.input_tokens / 1000) * rates.input;
  const outputCost = (usage.output_tokens / 1000) * rates.output;

  return {
    input: inputCost.toFixed(4),
    output: outputCost.toFixed(4),
    total: (inputCost + outputCost).toFixed(4)
  };
}


// ============================================================================
// Export examples
// ============================================================================

module.exports = {
  example1_basicRequest,
  example2_withWebSearch,
  example3_jsonResponse,
  example4_functionCalling,
  example5_errorHandling,
  example6_allegroAnalysis,
  example7_streaming,
  extractTextFromResponse,
  estimateCost
};


// ============================================================================
// Run example (uncomment to test)
// ============================================================================

// example6_allegroAnalysis().then(() => {
//   console.log('\n✅ Example completed!');
// }).catch(err => {
//   console.error('\n❌ Example failed:', err);
// });
