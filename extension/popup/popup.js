// Popup functionality
let currentAuctionData = null;
let currentTabUrl = null;
let currentAIAnalysis = null;

// API Key management
const API_KEY_STORAGE_KEY = 'openai_api_key';

function saveApiKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [API_KEY_STORAGE_KEY]: apiKey }, () => {
      resolve();
    });
  });
}

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get([API_KEY_STORAGE_KEY], (result) => {
      resolve(result[API_KEY_STORAGE_KEY] || null);
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Allegro Analyzer popup loaded');

  // Get DOM elements
  const initialMessage = document.getElementById('initial-message');
  const auctionCard = document.getElementById('auction-card');
  const analyzeAgainBtn = document.getElementById('analyze-again-btn');
  const viewAuctionBtn = document.getElementById('view-auction-btn');

  // Settings modal elements
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const settingsStatus = document.getElementById('settings-status');

  // AI elements
  const aiAnalyzeBtn = document.getElementById('ai-analyze-btn');
  const aiResults = document.getElementById('ai-results');
  const aiLoading = document.getElementById('ai-loading');
  const aiError = document.getElementById('ai-error');

  // Check if current tab is an Allegro auction
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    currentTabUrl = currentTab.url;
    const isAllegroAuction = currentTab.url && currentTab.url.includes('allegro.pl/oferta/');

    if (isAllegroAuction) {
      console.log('Current tab is an Allegro auction:', currentTab.url);
    } else {
      console.log('Current tab is NOT an Allegro auction');
    }
  });

  // Request latest data from background script
  console.log('📤 Requesting latest data from background...');
  chrome.runtime.sendMessage({ type: 'GET_LATEST_DATA' }, (response) => {
    if (response && response.success && response.data) {
      console.log('✅ Received data from background:', response.data);
      currentAuctionData = response.data;
      displayAuctionData(response.data);
    } else {
      console.log('ℹ️ No data available yet. Click "Analizuj aukcję" button on the page.');
    }
  });

  // Listen for messages from background (live updates)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUCTION_DATA_UPDATED') {
      console.log('🔄 Received updated auction data:', message.data);
      currentAuctionData = message.data;
      displayAuctionData(message.data);
    }
  });

  // Display auction data in the popup
  function displayAuctionData(data) {
    // Hide initial message, show auction card
    initialMessage.classList.add('hidden');
    auctionCard.classList.remove('hidden');

    // Update title
    document.getElementById('auction-title').textContent = data.title || 'Brak tytułu';

    // Update price
    document.getElementById('auction-price').textContent = data.price || 'Brak ceny';

    // Update thumbnail image
    const thumbnail = document.getElementById('auction-thumbnail');
    if (data.imageUrls && data.imageUrls.length > 0) {
      thumbnail.src = data.imageUrls[0];
      thumbnail.style.display = 'block';
    } else {
      thumbnail.style.display = 'none';
    }

    // Update details
    document.getElementById('auction-images').textContent = data.imageCount || 0;
    document.getElementById('auction-description').textContent =
      data.descriptionLength ? `${data.descriptionLength} znaków` : '0 znaków';
    document.getElementById('auction-seller').textContent =
      data.seller || 'Nie znaleziono';
    document.getElementById('auction-condition').textContent =
      data.condition || 'Nie określono';
  }

  // Button handlers
  analyzeAgainBtn.addEventListener('click', () => {
    console.log('Analyze again clicked');
    // Send message to content script to scrape again
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SCRAPE_AGAIN' });
    });
  });

  viewAuctionBtn.addEventListener('click', () => {
    console.log('View auction clicked');
    if (currentAuctionData && currentAuctionData.url) {
      chrome.tabs.create({ url: currentAuctionData.url });
    }
  });

  // Settings modal handlers
  settingsBtn.addEventListener('click', async () => {
    settingsModal.classList.remove('hidden');
    const apiKey = await getApiKey();
    if (apiKey) {
      apiKeyInput.value = apiKey;
    }
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showSettingsStatus('Proszę wpisać klucz API', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showSettingsStatus('Nieprawidłowy format klucza API', 'error');
      return;
    }

    await saveApiKey(apiKey);
    showSettingsStatus('✅ Klucz API zapisany!', 'success');

    setTimeout(() => {
      settingsModal.classList.add('hidden');
    }, 1500);
  });

  function showSettingsStatus(message, type) {
    settingsStatus.textContent = message;
    settingsStatus.className = `status-message ${type}`;
    settingsStatus.classList.remove('hidden');

    setTimeout(() => {
      settingsStatus.classList.add('hidden');
    }, 3000);
  }

  // AI Analysis handlers
  aiAnalyzeBtn.addEventListener('click', async () => {
    const apiKey = await getApiKey();

    if (!apiKey) {
      showAIError('Najpierw skonfiguruj klucz OpenAI API w ustawieniach ⚙️');
      return;
    }

    if (!currentAuctionData) {
      showAIError('Najpierw zeskanuj aukcję klikając przycisk na stronie Allegro');
      return;
    }

    await analyzeWithAI(currentAuctionData, apiKey);
  });

  async function analyzeWithAI(auctionData, apiKey) {
    // Hide results and errors, show loading
    aiResults.classList.add('hidden');
    aiError.classList.add('hidden');
    aiLoading.classList.remove('hidden');

    try {
      const prompt = createAnalysisPrompt(auctionData);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Jesteś ekspertem od optymalizacji aukcji Allegro. Analizujesz aukcje i podajesz konkretne, praktyczne sugestie poprawy sprzedaży.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Błąd API OpenAI');
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      currentAIAnalysis = analysis;
      displayAIResults(analysis);

    } catch (error) {
      console.error('AI Analysis error:', error);
      showAIError(`Błąd analizy: ${error.message}`);
    } finally {
      aiLoading.classList.add('hidden');
    }
  }

  function createAnalysisPrompt(auctionData) {
    return `Przeanalizuj następującą aukcję Allegro i znajdź konkurencję:

URL: ${auctionData.url}
Tytuł: ${auctionData.title}
Cena: ${auctionData.price}
Liczba zdjęć: ${auctionData.imageCount}
Długość opisu: ${auctionData.descriptionLength} znaków
Sprzedawca: ${auctionData.seller}
Stan: ${auctionData.condition}

ZADANIE:
1. Wyszukaj w internecie 3-5 konkurencyjnych aukcji tego samego produktu na Allegro.pl
2. Porównaj ceny, jakość opisów, zdjęcia, warunki dostawy
3. Oceń bieżącą aukcję w skali 0-5 gwiazdek
4. Znajdź aukcję z najlepszą ceną
5. Wymień przewagi konkurencji
6. Zaproponuj konkretne poprawki

ODPOWIEDŹ W FORMACIE JSON:
{
  "rating": 4.5,
  "bestCompetitor": {
    "url": "https://allegro.pl/...",
    "price": 239.99,
    "priceDiff": -3.2,
    "priceFormatted": "239,99 zł"
  },
  "advantages": [
    "Darmowa dostawa",
    "Czas wysyłki: 24h",
    "150+ zdjęć produktu"
  ],
  "suggestions": "Szczegółowe sugestie optymalizacji aukcji...",
  "improvedDescription": "<div>Poprawiony opis HTML dla Allegro...</div>"
}`;
  }

  function displayAIResults(analysis) {
    // Show results
    aiResults.classList.remove('hidden');

    // Display rating
    const stars = '★'.repeat(Math.floor(analysis.rating)) + '☆'.repeat(5 - Math.floor(analysis.rating));
    document.getElementById('ai-stars').textContent = stars;
    document.getElementById('ai-rating-value').textContent = `${analysis.rating}/5`;

    // Display best competitor
    if (analysis.bestCompetitor) {
      document.getElementById('ai-best-price').textContent = analysis.bestCompetitor.priceFormatted;

      const diffElement = document.getElementById('ai-price-diff');
      const diff = analysis.bestCompetitor.priceDiff;
      diffElement.textContent = `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
      diffElement.className = `comparison-value price-diff ${diff > 0 ? 'positive' : 'negative'}`;

      const linkElement = document.getElementById('ai-best-link');
      linkElement.href = analysis.bestCompetitor.url;
    }

    // Display advantages
    const advantagesList = document.getElementById('ai-advantages-list');
    advantagesList.innerHTML = '';
    (analysis.advantages || []).forEach(adv => {
      const li = document.createElement('li');
      li.textContent = adv;
      advantagesList.appendChild(li);
    });

    // Display suggestions
    document.getElementById('ai-suggestions-content').textContent = analysis.suggestions || 'Brak sugestii';

    // Display improved description
    document.getElementById('ai-description-content').textContent = analysis.improvedDescription || 'Brak poprawionego opisu';
  }

  function showAIError(message) {
    aiError.classList.remove('hidden');
    aiError.querySelector('.error-message').textContent = message;
    aiResults.classList.add('hidden');
  }

  // Copy buttons
  document.getElementById('copy-suggestions-btn').addEventListener('click', () => {
    const text = document.getElementById('ai-suggestions-content').textContent;
    navigator.clipboard.writeText(text);
    showCopyFeedback('copy-suggestions-btn');
  });

  document.getElementById('copy-description-btn').addEventListener('click', () => {
    const text = document.getElementById('ai-description-content').textContent;
    navigator.clipboard.writeText(text);
    showCopyFeedback('copy-description-btn');
  });

  function showCopyFeedback(buttonId) {
    const btn = document.getElementById(buttonId);
    const originalText = btn.textContent;
    btn.textContent = '✅ Skopiowano!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }

  // PDF Export (placeholder)
  document.getElementById('export-pdf-btn').addEventListener('click', () => {
    alert('Funkcja eksportu PDF będzie dostępna wkrótce!');
  });
});
