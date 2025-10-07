// Test script for GPT-5 Allegro Analysis
// This script tests the GPT-5 API call with real auction data

// IMPORTANT: Replace with your actual OpenAI API key
// You can get one from: https://platform.openai.com/api-keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here';

// Real auction data from screenshot
const auctionData = {
  url: 'https://allegro.pl/oferta/naswietlacz-solarny-50w-17945721736',
  title: 'NAŚWIETLACZ SOLARNY 50W...',
  price: '89.90 zł',
  priceAmount: 89.90,
  imageCount: 50,
  descriptionLength: 3131,
  seller: 'SklepBerge',
  condition: 'Nie określono'
};

// Create the same prompt as in extension
function createAnalysisPrompt(auctionData) {
  return `WAŻNE: Użyj funkcji web_search aby znaleźć PRAWDZIWE konkurencyjne aukcje!

TWOJA AUKCJA DO ANALIZY:
URL: ${auctionData.url}
Tytuł: ${auctionData.title}
Cena: ${auctionData.price}
Liczba zdjęć: ${auctionData.imageCount}
Długość opisu: ${auctionData.descriptionLength} znaków
Sprzedawca: ${auctionData.seller}
Stan: ${auctionData.condition}

KROK 1 - WYSZUKIWANIE (UŻYJ WEB SEARCH!):
Wyszukaj na Allegro.pl: "${auctionData.title}"
Znajdź 3-5 konkurencyjnych aukcji od różnych sprzedawców
Otwórz każdą aukcję i wyciągnij PRAWDZIWE dane

KROK 2 - ZBIERANIE DANYCH z każdej konkurencyjnej aukcji:
- Cena (dokładna kwota w PLN)
- Czas dostawy (np. "24h", "2-3 dni", "do 5 dni") - znajdź na stronie!
- Koszt wysyłki (np. "Darmowa", "14,99 zł") - sprawdź opcje dostawy!
- Jakość opisu: oceń 1-10 (czy ma HTML, emoji, formatowanie, parametry)
- Liczba zdjęć: policz ile jest zdjęć produktu w galerii

KROK 3 - PORÓWNANIE:
Wybierz najlepszą konkurencyjną aukcję (najlepsza cena + czas dostawy)
Porównaj z twoją aukcją
Oceń twoją aukcję w skali 0-5 gwiazdek

KROK 4 - SUGESTIE:
Wymień konkretne przewagi konkurencji
Zaproponuj co poprawić w opisie (z emoji, HTML dla Allegro)

ODPOWIEDŹ MUSI BYĆ W FORMACIE JSON:
{
  "rating": 4.5,
  "yourAuction": {
    "price": ${auctionData.priceAmount || 'null'},
    "deliveryTime": "sprawdź na stronie lub 'Brak danych'",
    "shippingCost": "sprawdź na stronie lub 'Brak danych'",
    "descriptionQuality": ${Math.min(Math.max(Math.floor(auctionData.descriptionLength / 500), 1), 10)},
    "photosCount": ${auctionData.imageCount}
  },
  "bestCompetitor": {
    "url": "https://allegro.pl/oferta/...",
    "price": 0.00,
    "deliveryTime": "RZECZYWISTY z aukcji",
    "shippingCost": "RZECZYWISTY z aukcji",
    "descriptionQuality": 0,
    "photosCount": 0
  },
  "advantages": [
    "Konkretna przewaga 1",
    "Konkretna przewaga 2"
  ],
  "suggestions": "Szczegółowe sugestie...",
  "improvedDescription": "<div style='font-family: Arial;'><h2>📦 Tytuł z emoji</h2><p>Opis...</p></div>"
}

UWAGA: Jeśli nie możesz znaleźć danych - wpisz "Brak danych" zamiast zgadywać!`;
}

async function testGPT5() {
  console.log('🚀 Starting GPT-5 test...\n');
  console.log('📊 Test auction:', auctionData.title);
  console.log('💰 Price:', auctionData.price);
  console.log('🔗 URL:', auctionData.url);
  console.log('\n⏳ Calling GPT-5 API (this may take 30-90 seconds)...\n');

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        instructions: 'Jesteś ekspertem od optymalizacji aukcji Allegro. Analizujesz aukcje i podajesz konkretne, praktyczne sugestie poprawy sprzedaży. MUSISZ użyć web search aby znaleźć prawdziwe konkurencyjne aukcje na Allegro.pl i wyciągnąć z nich RZECZYWISTE dane (ceny, czas dostawy, liczbę zdjęć). BARDZO WAŻNE: Twoja odpowiedź MUSI być w formacie JSON zgodnym z schematem podanym w input.',
        input: createAnalysisPrompt(auctionData),
        tools: [
          {
            type: 'web_search'
          }
        ],
        reasoning: {
          effort: 'medium'
        },
        text: {
          verbosity: 'medium'
        }
      })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  API call completed in ${elapsed}s\n`);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      throw new Error(error.error?.message || 'API call failed');
    }

    const data = await response.json();

    console.log('📦 Raw API Response:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(80));
    console.log('\n');

    // Try to parse the analysis
    let analysisText;
    if (data.output && typeof data.output === 'string') {
      analysisText = data.output;
    } else if (data.output && data.output.content) {
      analysisText = data.output.content;
    } else if (data.output_text) {
      analysisText = data.output_text;
    } else if (data.choices && data.choices[0]) {
      analysisText = data.choices[0].message.content;
    } else {
      console.error('⚠️  Unknown response format!');
      return;
    }

    console.log('📝 Output Text:');
    console.log('='.repeat(80));
    console.log(analysisText);
    console.log('='.repeat(80));
    console.log('\n');

    // Try to parse as JSON
    try {
      const analysis = JSON.parse(analysisText);

      console.log('✅ Successfully parsed JSON!\n');
      console.log('📊 Analysis Results:');
      console.log('='.repeat(80));
      console.log(`Rating: ${analysis.rating}/5 ⭐`);
      console.log('\nYour Auction:');
      console.log(`  Price: ${analysis.yourAuction?.price} PLN`);
      console.log(`  Delivery: ${analysis.yourAuction?.deliveryTime}`);
      console.log(`  Shipping: ${analysis.yourAuction?.shippingCost}`);
      console.log(`  Description Quality: ${analysis.yourAuction?.descriptionQuality}/10`);
      console.log(`  Photos: ${analysis.yourAuction?.photosCount}`);

      console.log('\nBest Competitor:');
      console.log(`  URL: ${analysis.bestCompetitor?.url}`);
      console.log(`  Price: ${analysis.bestCompetitor?.price} PLN`);
      console.log(`  Delivery: ${analysis.bestCompetitor?.deliveryTime}`);
      console.log(`  Shipping: ${analysis.bestCompetitor?.shippingCost}`);
      console.log(`  Description Quality: ${analysis.bestCompetitor?.descriptionQuality}/10`);
      console.log(`  Photos: ${analysis.bestCompetitor?.photosCount}`);

      console.log('\nAdvantages:');
      (analysis.advantages || []).forEach((adv, i) => {
        console.log(`  ${i + 1}. ${adv}`);
      });

      console.log('\nSuggestions:');
      console.log(`  ${analysis.suggestions?.substring(0, 200)}...`);

      console.log('='.repeat(80));

      // Validation
      console.log('\n🔍 Validation:');
      const validations = [];

      if (!analysis.bestCompetitor?.url || analysis.bestCompetitor.url === 'https://allegro.pl/oferta/...') {
        validations.push('❌ Competitor URL is placeholder - GPT did not find real auction');
      } else {
        validations.push('✅ Competitor URL looks real');
      }

      if (analysis.bestCompetitor?.price === 0 || !analysis.bestCompetitor?.price) {
        validations.push('❌ Competitor price is 0 or missing - data not extracted');
      } else {
        validations.push(`✅ Competitor price: ${analysis.bestCompetitor.price} PLN`);
      }

      if (analysis.yourAuction?.deliveryTime === "sprawdź na stronie lub 'Brak danych'" ||
          analysis.yourAuction?.deliveryTime === 'Brak danych') {
        validations.push('⚠️  Your delivery time not found');
      } else {
        validations.push(`✅ Your delivery time: ${analysis.yourAuction?.deliveryTime}`);
      }

      if (analysis.bestCompetitor?.deliveryTime === 'RZECZYWISTY z aukcji' ||
          analysis.bestCompetitor?.deliveryTime === 'Brak danych') {
        validations.push('❌ Competitor delivery time is placeholder - not real data');
      } else {
        validations.push(`✅ Competitor delivery time: ${analysis.bestCompetitor?.deliveryTime}`);
      }

      validations.forEach(v => console.log(v));

    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError.message);
      console.log('\n💡 Response might not be valid JSON. Check the output above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testGPT5().then(() => {
  console.log('\n✅ Test completed!');
}).catch(err => {
  console.error('\n❌ Test crashed:', err);
  process.exit(1);
});
