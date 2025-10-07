# GPT-5 API Reference

Kompletna dokumentacja użycia GPT-5 models przez OpenAI Responses API.

## Modele

### Dostępne warianty

| Model | Najlepsze zastosowanie | Czas odpowiedzi | Koszt |
|-------|------------------------|-----------------|-------|
| `gpt-5` | Złożone rozumowanie, szeroka wiedza, ciężkie zadania kodowania | 3-5 min (high reasoning) | ~$0.05 |
| `gpt-5-mini` | Zbalansowane: szybkość, koszt, jakość | 1-2 min (medium reasoning) | ~$0.02 |
| `gpt-5-nano` | Wysokie przepustowość, proste instrukcje, klasyfikacja | 10-30 sek (minimal reasoning) | ~$0.005 |

### Mapowanie nazw (System Card vs API)

| System Card Name | API Alias |
|------------------|-----------|
| gpt-5-thinking | `gpt-5` |
| gpt-5-thinking-mini | `gpt-5-mini` |
| gpt-5-thinking-nano | `gpt-5-nano` |
| gpt-5-main | `gpt-5-chat-latest` |

## Endpoint

```
POST https://api.openai.com/v1/responses
```

**Ważne:** Nie używaj `/v1/chat/completions` - to stary API. GPT-5 wymaga `/v1/responses`.

## Parametry

### Wymagane

```javascript
{
  "model": "gpt-5-mini",           // gpt-5 | gpt-5-mini | gpt-5-nano
  "input": "Your prompt here..."   // Prompt użytkownika
}
```

### Opcjonalne (rekomendowane)

```javascript
{
  "instructions": "System instructions",  // Instrukcje systemowe (role: system)

  "reasoning": {
    "effort": "medium"             // minimal | low | medium | high
  },

  "text": {
    "verbosity": "medium"          // low | medium | high
  },

  "tools": [                       // Narzędzia (np. web search)
    { "type": "web_search" }
  ],

  "max_output_tokens": 4000        // Limit tokenów wyjściowych
}
```

### ⚠️ Nieobsługiwane parametry

**NIE używaj tych parametrów - zwrócą błąd:**

- ❌ `temperature`
- ❌ `top_p`
- ❌ `logprobs`
- ❌ `response_format` (użyj `text.format` zamiast)

## Reasoning Effort

Kontroluje głębokość rozumowania (reasoning tokens).

| Poziom | Czas | Dokładność | Użyj gdy |
|--------|------|------------|----------|
| `minimal` | Najszybszy | Podstawowa | Proste instrukcje, szybka odpowiedź |
| `low` | Szybki | Dobra | Zamiennik GPT-4.1 |
| `medium` | **Domyślny** | Bardzo dobra | Większość zastosowań |
| `high` | Najwolniejszy | Najlepsza | Złożone problemy, coding, multi-step |

```javascript
reasoning: {
  effort: 'medium'
}
```

## Text Verbosity

Kontroluje długość odpowiedzi (output tokens).

| Poziom | Długość | Użyj gdy |
|--------|---------|----------|
| `low` | Zwięzłe | Proste odpowiedzi, SQL queries, krótki kod |
| `medium` | **Domyślne** | Balansowane wyjaśnienia |
| `high` | Szczegółowe | Długie dokumentacje, refactoring kodu |

```javascript
text: {
  verbosity: 'low'
}
```

## Tools

### Web Search

Pozwala GPT-5 wyszukiwać w internecie i odwiedzać strony.

```javascript
tools: [
  {
    type: 'web_search'
  }
]
```

**Ważne:**
- Web search znacznie wydłuża czas odpowiedzi (+ 30-120 sek)
- GPT-5 może wykonać wiele wyszukiwań (widzieliśmy 8x w testach)
- Wspierane we wszystkich wariantach (gpt-5, gpt-5-mini, gpt-5-nano)

### Custom Tools (Function Calling)

```javascript
tools: [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather in a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }
  }
]
```

### Custom Tools (Freeform)

GPT-5 wspiera również custom tools z freeform input:

```javascript
tools: [
  {
    type: 'custom',
    name: 'code_exec',
    description: 'Executes arbitrary python code'
  }
]
```

## Format odpowiedzi

### Struktura

```json
{
  "id": "resp_...",
  "object": "response",
  "created_at": 1759869941,
  "status": "completed",
  "model": "gpt-5-mini-2025-08-07",

  "output": [
    {
      "id": "rs_...",
      "type": "reasoning",
      "summary": []
    },
    {
      "id": "ws_...",
      "type": "web_search_call",
      "status": "completed",
      "action": {
        "type": "search",
        "query": "your search query"
      }
    },
    {
      "id": "msg_...",
      "type": "message",
      "status": "completed",
      "content": [
        {
          "type": "output_text",
          "text": "Actual response text here...",
          "annotations": [
            {
              "type": "url_citation",
              "url": "https://...",
              "title": "..."
            }
          ]
        }
      ],
      "role": "assistant"
    }
  ],

  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567,
    "output_tokens_details": {
      "reasoning_tokens": 200
    },
    "total_tokens": 1801
  }
}
```

### Typy elementów w `output[]`

| Type | Opis |
|------|------|
| `reasoning` | Łańcuch myślenia (Chain of Thought) - ukryty |
| `web_search_call` | Wywołanie web search |
| `function_call` | Wywołanie funkcji |
| `message` | **Główna odpowiedź** - tu jest tekst |

### Wydobycie tekstu odpowiedzi

```javascript
const data = await response.json();

// Znajdź element typu 'message'
const messageItem = data.output.find(item => item.type === 'message');

// Wydobądź tekst z content
const textContent = messageItem.content.find(c => c.type === 'output_text');
const responseText = textContent.text;

console.log(responseText);
```

## Usage i koszty

```json
"usage": {
  "input_tokens": 39159,
  "output_tokens": 5787,
  "output_tokens_details": {
    "reasoning_tokens": 3840    // Tokeny używane do rozumowania
  },
  "total_tokens": 44946
}
```

**Reasoning tokens** są oddzielnie liczone - wpływają na koszt ale nie na `max_output_tokens`.

## Rekomendacje wyboru modelu

### Zamienniki dla starszych modeli

| Stary model | Zamiennik GPT-5 | Reasoning | Powód |
|-------------|-----------------|-----------|-------|
| o3 | `gpt-5` | medium/high | Lepsze wyniki, podobna cena |
| gpt-4.1 | `gpt-5` | minimal/low | Lepsze rozumowanie, szybkie |
| o4-mini | `gpt-5-mini` | medium | Lepsza jakość |
| gpt-4.1-mini | `gpt-5-mini` | low | Tańsze, szybsze |
| gpt-4.1-nano | `gpt-5-nano` | minimal | Zamiennik 1:1 |

### Use cases

**gpt-5:**
- Złożone zadania kodowania
- Multi-step agentic tasks
- Analiza wymagająca szerokiej wiedzy
- Research & planning

**gpt-5-mini (POLECANY dla większości):**
- Chat/conversational AI
- Analiza danych z web search
- Content generation
- Code review & suggestions
- **Balans: szybkość + jakość + koszt**

**gpt-5-nano:**
- Klasyfikacja
- Simple Q&A
- Instruction following
- High-throughput scenariusze
- Real-time responses

## Structured Outputs

Wymuszanie JSON format (nie zawsze działa - lepiej użyć instrukcji w prompt):

```javascript
// NIE ZALECANE - może nie działać
text: {
  format: 'json_object'
}

// ZALECANE - użyj instrukcji
instructions: 'Return response in JSON format matching this schema: {...}'
```

## Best Practices

1. **Zawsze używaj `instructions`** zamiast system message
2. **Dla web search:** ustaw `reasoning: { effort: 'medium' }` minimum
3. **Timeout:** Ustaw minimum 120 sekund (2 min) dla gpt-5-mini
4. **Error handling:** Web search może zawieść - obsłuż błędy
5. **Caching:** Responses API wspiera prompt caching - używaj `previous_response_id`
6. **JSON parsing:** Używaj `try/catch` - GPT może nie zawsze zwrócić czysty JSON

## Limity

| Parametr | Wartość |
|----------|---------|
| Max input tokens | ~200k (model zależny) |
| Max output tokens | Konfigurowalny (domyślnie ~16k) |
| Max reasoning tokens | Automatyczny (effort-dependent) |
| Timeout | 10 minut (server-side) |
| Rate limits | Tier-dependent (sprawdź dashboard) |

## Bibliografia

- [Using GPT-5 Guide](https://platform.openai.com/docs/guides/latest-model)
- [Migrate to Responses API](https://platform.openai.com/docs/guides/migrate-to-responses)
- [GPT-5 System Card](https://openai.com/index/gpt-5-system-card/)
- [Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
