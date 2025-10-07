# OpenAI GPT-5 - Troubleshooting Guide

Typowe problemy i ich rozwiązania przy pracy z GPT-5 API.

## Błędy API

### ❌ "Invalid type for 'tools[0]': expected an object, but got a string instead"

**Przyczyna:** Nieprawidłowy format parametru `tools`.

**Błędny kod:**
```javascript
tools: ['web_search']  // ❌ String array
```

**Poprawny kod:**
```javascript
tools: [
  { type: 'web_search' }  // ✅ Object array
]
```

---

### ❌ "Unsupported parameter: 'temperature'"

**Przyczyna:** GPT-5 nie wspiera parametru `temperature`.

**Błędny kod:**
```javascript
{
  model: 'gpt-5',
  temperature: 0.7  // ❌ Not supported
}
```

**Poprawny kod:**
```javascript
{
  model: 'gpt-5',
  reasoning: {
    effort: 'medium'  // ✅ Use reasoning.effort instead
  }
}
```

**Lista nieobsługiwanych parametrów:**
- ❌ `temperature`
- ❌ `top_p`
- ❌ `logprobs`

---

### ❌ "Invalid type for 'text.format': expected a text format, but got a string instead"

**Przyczyna:** Nieprawidłowy format parametru `text.format`.

**Błędny kod:**
```javascript
text: {
  format: 'json_object'  // ❌ Old format
}
```

**Poprawny kod (Option 1 - usuń parametr):**
```javascript
// ✅ Rely on instructions
instructions: 'Return response in JSON format: {...}'
// No text.format needed
```

**Poprawny kod (Option 2 - użyj json_schema):**
```javascript
text: {
  format: {
    type: 'json_schema',
    json_schema: {
      name: 'response',
      schema: { /* JSON schema */ }
    }
  }
}
```

**Rekomendacja:** Używaj instrukcji w `instructions` zamiast `text.format` - działa lepiej.

---

### ❌ Request timeout (no response after 5+ minutes)

**Przyczyna:** Model `gpt-5` z `reasoning: high` może być zbyt wolny.

**Rozwiązanie:**

```javascript
// Zamiast:
{
  model: 'gpt-5',
  reasoning: { effort: 'high' }  // ❌ 5+ min
}

// Użyj:
{
  model: 'gpt-5-mini',           // ✅ Faster model
  reasoning: { effort: 'medium' } // ✅ 1-2 min
}
```

**Timeouts według modelu:**

| Model + Reasoning | Średni czas | Timeout zalecany |
|-------------------|-------------|------------------|
| gpt-5 + high | 3-5 min | 300s (5 min) |
| gpt-5 + medium | 2-3 min | 180s (3 min) |
| gpt-5-mini + medium | 1-2 min | 120s (2 min) |
| gpt-5-mini + low | 30-60s | 90s |
| gpt-5-nano + minimal | 10-30s | 60s |

---

### ❌ "Could not extract text from response"

**Przyczyna:** Nieprawidłowy parsing odpowiedzi.

**Rozwiązanie:**

```javascript
// Responses API format (GPT-5)
const data = await response.json();

// ✅ Prawidłowy parsing
const messageItem = data.output.find(item => item.type === 'message');
const textContent = messageItem.content.find(c => c.type === 'output_text');
const text = textContent.text;

// ❌ Nieprawidłowy (stary format Chat Completions)
const text = data.choices[0].message.content;  // Won't work!
```

**Uniwersalna funkcja:**

```javascript
function extractText(data) {
  // Responses API (GPT-5)
  if (data.output && Array.isArray(data.output)) {
    const msg = data.output.find(i => i.type === 'message');
    if (msg && msg.content) {
      const txt = msg.content.find(c => c.type === 'output_text');
      if (txt) return txt.text;
    }
  }

  // Fallbacks
  if (data.output_text) return data.output_text;
  if (data.output && typeof data.output === 'string') return data.output;
  if (data.choices && data.choices[0]) return data.choices[0].message.content;

  throw new Error('Unknown response format');
}
```

---

### ❌ "Response is not valid JSON"

**Przyczyna:** GPT-5 nie zwrócił czystego JSON mimo instrukcji.

**Rozwiązanie:**

```javascript
// ✅ Zawsze używaj try/catch
try {
  const analysis = JSON.parse(responseText);
  console.log('Success:', analysis);
} catch (error) {
  console.error('JSON parse failed');
  console.log('Raw response:', responseText);

  // Fallback: wydobądź JSON z tekstu
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('Extracted JSON:', analysis);
    } catch (e) {
      throw new Error('Could not parse JSON from response');
    }
  }
}
```

**Poprawa promptu:**

```javascript
// ❌ Słabe instrukcje
input: 'Analyze this and return JSON'

// ✅ Jasne instrukcje
instructions: 'VERY IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no backticks. Start with { and end with }.',
input: `Analyze this product. Return JSON in this EXACT format:
{
  "rating": 4.5,
  "price": 99.99,
  "suggestion": "..."
}

Do NOT include any text before or after the JSON.`
```

---

## Problemy z Web Search

### ⚠️ Web search nie zwraca prawdziwych danych

**Objawy:**
- Placeholder URLs: `https://example.com/...`
- Ceny: `0.00` lub `null`
- Czas dostawy: "Brak danych"

**Diagnoza:**

```javascript
// Sprawdź czy web search był użyty
const webSearches = data.output.filter(i => i.type === 'web_search_call');
console.log(`Web searches: ${webSearches.length}`);

if (webSearches.length === 0) {
  console.log('⚠️ Web search was NOT used!');
}
```

**Rozwiązania:**

**1. Wymuś web search w instrukcjach:**

```javascript
instructions: 'CRITICAL: You MUST use web_search tool to find real data. Do NOT guess or use placeholder data. If you cannot find data, write "Data not found".',
```

**2. Użyj wyższego reasoning:**

```javascript
reasoning: {
  effort: 'medium'  // Minimum dla web search
}
```

**3. Podaj konkretne zapytanie:**

```javascript
input: `STEP 1: Search on Google: "iPhone 15 Pro site:allegro.pl"
STEP 2: Open 3-5 auction pages
STEP 3: Extract REAL prices from those pages
STEP 4: Return data in JSON format`
```

---

### ⚠️ Web search timeout

**Przyczyna:** Wiele web searches zwiększa czas odpowiedzi.

**Rozwiązanie:**

```javascript
// Ogranicz zakres wyszukiwania
input: `Search for 3 (NOT more than 3) competitor auctions...`

// Zwiększ timeout
fetch('...', {
  signal: AbortSignal.timeout(180000)  // 3 minutes
})
```

---

## Problemy z wydajnością

### ⏱️ Zbyt długi czas odpowiedzi

**Opcja 1: Zmień model**

```javascript
// Wolny (3-5 min)
model: 'gpt-5'
reasoning: { effort: 'high' }

// Szybszy (1-2 min) ✅
model: 'gpt-5-mini'
reasoning: { effort: 'medium' }

// Najszybszy (30s)
model: 'gpt-5-nano'
reasoning: { effort: 'minimal' }
```

**Opcja 2: Zmniejsz reasoning effort**

```javascript
reasoning: {
  effort: 'low'  // Zamiast 'medium' lub 'high'
}
```

**Opcja 3: Ogranicz verbosity**

```javascript
text: {
  verbosity: 'low'  // Mniej tokenów = szybsza odpowiedź
}
```

---

### 💰 Zbyt wysokie koszty

**Sprawdź zużycie:**

```javascript
console.log('Tokens:', data.usage);
// {
//   input_tokens: 10000,
//   output_tokens: 5000,
//   reasoning_tokens: 3000,  // ← Te też kosztują!
//   total_tokens: 15000
// }
```

**Redukcja kosztów:**

**1. Użyj mniejszego modelu:**

```javascript
// Expensive
model: 'gpt-5'  // ~$0.05 per call

// Cheaper ✅
model: 'gpt-5-mini'  // ~$0.02 per call (60% taniej!)
```

**2. Ogranicz reasoning:**

```javascript
reasoning: {
  effort: 'low'  // Mniej reasoning tokens
}
```

**3. Krótsze prompty:**

```javascript
// Długi prompt (10k tokens)
input: `Very long detailed explanation...`

// Krótki prompt (1k tokens) ✅
input: `Concise instructions...`
```

**4. Użyj prompt caching:**

```javascript
// Jeśli powtarzasz ten sam context
previous_response_id: 'resp_xxx'  // Reuse cached prompts
```

---

## Problemy z autentykacją

### ❌ "Incorrect API key provided"

**Przyczyna:** Nieprawidłowy lub wygasły klucz API.

**Sprawdź:**

```javascript
const API_KEY = process.env.OPENAI_API_KEY;
console.log('Key starts with:', API_KEY?.substring(0, 10));
// Should be: "sk-proj-..." or "sk-..."

if (!API_KEY || !API_KEY.startsWith('sk-')) {
  throw new Error('Invalid API key format');
}
```

**Rozwiązanie:**
1. Wejdź na https://platform.openai.com/api-keys
2. Stwórz nowy klucz
3. Zaktualizuj `.env` lub `OPENAI_API_KEY`

---

### ❌ "You exceeded your current quota"

**Przyczyna:** Brak środków na koncie OpenAI.

**Rozwiązanie:**
1. Sprawdź saldo: https://platform.openai.com/account/billing
2. Dodaj payment method
3. Doładuj konto ($5-10 na start)

---

## Problemy w Chrome Extension

### ⚠️ CORS error w extension

**Błąd:**
```
Access to fetch at 'https://api.openai.com/...' from origin 'chrome-extension://...' has been blocked by CORS
```

**Rozwiązanie:**

Dodaj `host_permissions` w `manifest.json`:

```json
{
  "host_permissions": [
    "https://api.openai.com/*"
  ]
}
```

---

### ⚠️ API key visible in extension

**Problem:** API key hardcoded w kodzie extension.

**Rozwiązanie:** Użyj `chrome.storage`:

```javascript
// Zapisz (w popup settings)
chrome.storage.local.set({
  openai_api_key: 'sk-...'
});

// Odczytaj
const { openai_api_key } = await chrome.storage.local.get(['openai_api_key']);
```

**Nigdy nie commituj API key do Git!**

---

## Debug Tips

### Pełne logowanie odpowiedzi

```javascript
const data = await response.json();

// Log całej odpowiedzi
console.log('Full response:', JSON.stringify(data, null, 2));

// Log poszczególnych części
console.log('Model:', data.model);
console.log('Status:', data.status);
console.log('Output items:', data.output?.length);
console.log('Usage:', data.usage);

// Log web searches
const searches = data.output?.filter(i => i.type === 'web_search_call') || [];
searches.forEach((s, i) => {
  console.log(`Search ${i + 1}:`, s.action?.query);
});
```

---

### Test bez web search (szybki debug)

```javascript
// Usuń web search dla szybszego testu
// tools: [{ type: 'web_search' }],  // ← Zakomentuj

// Użyj mock data w prompcie
input: `Pretend you searched and found these auctions:
1. URL: https://allegro.pl/offer/123, Price: 99.99 PLN
2. URL: https://allegro.pl/offer/456, Price: 89.99 PLN

Now analyze...`
```

---

## Checklist przed zgłoszeniem błędu

Przed zgłoszeniem problemu sprawdź:

- [ ] API key jest prawidłowy i aktywny
- [ ] Masz środki na koncie OpenAI
- [ ] Używasz endpoint `/v1/responses` (nie `/v1/chat/completions`)
- [ ] Model to `gpt-5`, `gpt-5-mini` lub `gpt-5-nano`
- [ ] Nie używasz `temperature`, `top_p`, `logprobs`
- [ ] `tools` to array obiektów: `[{ type: '...' }]`
- [ ] Timeout ustawiony na minimum 120s (2 min)
- [ ] Parsing odpowiedzi zgodny z Responses API format
- [ ] Try/catch dla JSON.parse()
- [ ] Logowanie pełnej odpowiedzi dla debug

---

## Przydatne linki

- [OpenAI Status Page](https://status.openai.com/)
- [API Reference](https://platform.openai.com/docs/api-reference/responses)
- [Community Forum](https://community.openai.com/)
- [Rate Limits](https://platform.openai.com/account/limits)
- [Billing Dashboard](https://platform.openai.com/account/billing)
