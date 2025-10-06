# 🔍 Allegro Analyzer

Chrome Extension do analizy i optymalizacji aukcji Allegro z wykorzystaniem AI.

## 📋 Opis

Allegro Analyzer to inteligentne narzędzie SaaS, które automatycznie analizuje aukcje na platformie Allegro i dostarcza spersonalizowane sugestie optymalizacji oparte na technologii sztucznej inteligencji.

## 🚀 Funkcje (Sprint 1)

- ✅ Automatyczne wykrywanie stron aukcji Allegro
- ✅ Floating button "Analizuj aukcję" na stronie aukcji
- ✅ **Zaawansowany scraping danych aukcji:**
  - Tytuł aukcji
  - Cena (tekst + parsed amount)
  - Liczba zdjęć w galerii
  - URL-e pierwszych 5 zdjęć
  - Długość opisu
  - Nazwa sprzedawcy
  - Stan przedmiotu (nowy/używany)
- ✅ Multiple selector fallbacks (odporność na zmiany w HTML Allegro)
- ✅ Auto-scraping przy załadowaniu strony
- ✅ Formatted JSON output w console
- ✅ Console.table dla lepszej czytelności
- ✅ Modern UI z gradient design (purple theme)
- ✅ Professional icons (16x16, 48x48, 128x128)

## 📦 Wymagania

- Google Chrome (wersja 88+) lub inna przeglądarka oparta na Chromium
- System Windows/macOS/Linux

## 🛠️ Instalacja (Developer Mode)

### Krok 1: Przygotowanie

```bash
# Sklonuj repozytorium
git clone https://github.com/DamianMazurek/allegro-analyzer.git
cd allegro-analyzer
```

### Krok 2: Załaduj extension w Chrome

1. Otwórz Chrome i przejdź do: `chrome://extensions/`
2. Włącz **"Tryb dewelopera"** (Developer mode) w prawym górnym rogu
3. Kliknij **"Załaduj rozpakowane"** (Load unpacked)
4. Wybierz folder `allegro-analyzer/extension/`
5. Extension zostanie załadowany i pojawi się w pasku narzędzi

### Krok 3: Testowanie

1. Przejdź do dowolnej aukcji na Allegro: `https://allegro.pl/oferta/...`
2. Otwórz Console (F12) - **dane scrapują się automatycznie!**
3. W prawym dolnym rogu pojawi się przycisk **"🔍 Analizuj aukcję"**
4. Kliknij przycisk, aby odświeżyć dane i zobaczyć console.table

**Szczegółowe instrukcje testowania:** Zobacz [TESTING.md](TESTING.md)

## 📁 Struktura projektu

```
allegro-analyzer/
├── extension/              # Chrome Extension
│   ├── manifest.json       # Manifest V3
│   ├── popup/              # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── content/            # Content scripts
│       ├── content-script.js
│       └── content-styles.css
├── backend/                # Backend API (coming soon)
├── .gitignore
├── package.json
└── README.md
```

## 🐛 Debug Mode

Extension automatycznie scrapuje dane przy załadowaniu strony i wyświetla je w Console:

1. Otwórz DevTools (F12)
2. Przejdź do zakładki **Console**
3. Szukaj logów z prefiksem: `🔍 Allegro Analyzer:`

### Przykładowy output:

```
✅ Allegro auction detected!
📍 Auction ID: samsung-galaxy-s23-12345678
✅ Analyze button created and added to page
🤖 Auto-scraping auction data on page load...
🔍 Starting detailed scraping...
✅ Found with selector: h1[itemprop="name"] = Samsung Galaxy S23 Ultra...
✅ Found 12 images with selector: div[data-box-name="gallery"] img
✅ Found description (2847 chars) with selector: div[data-box-name="Description"]

================================================================================
📊 INITIAL SCRAPE - AUCTION DATA
================================================================================
{
  "url": "https://allegro.pl/oferta/samsung-galaxy-s23-ultra-12345678",
  "auctionId": "samsung-galaxy-s23-ultra-12345678",
  "title": "Samsung Galaxy S23 Ultra 256GB Czarny",
  "price": "4 999,00 zł",
  "priceAmount": 4999,
  "currency": "PLN",
  "imageCount": 12,
  "imageUrls": ["https://a.allegroimg.com/...", ...],
  "descriptionLength": 2847,
  "hasDescription": true,
  "seller": "SuperTech Store",
  "condition": "Nowy",
  "timestamp": "2025-10-06T14:23:45.123Z",
  "scrapedAt": "6.10.2025, 14:23:45"
}
================================================================================
```

### Scraped Data Fields:

| Pole | Opis |
|------|------|
| `title` | Pełny tytuł aukcji |
| `price` | Cena jako tekst (z walutą) |
| `priceAmount` | Cena jako liczba (do analizy) |
| `currency` | Waluta (domyślnie PLN) |
| `imageCount` | Liczba zdjęć w galerii |
| `imageUrls` | Pierwsze 5 URL-i zdjęć |
| `descriptionLength` | Długość opisu w znakach |
| `seller` | Nazwa sprzedawcy |
| `condition` | Stan: "Nowy" / "Używany" |

## 🔜 Roadmap

### Sprint 2
- Backend API z integracją OpenAI
- Wysyłanie danych do backendu
- Wyświetlanie sugestii AI

### Sprint 3
- System subskrypcji (Stripe)
- Panel użytkownika
- Historia analiz

## 👨‍💻 Autor

**Damian Mazurek**
- GitHub: [@DamianMazurek](https://github.com/DamianMazurek)

## 📄 Licencja

Copyright © 2025 Damian Mazurek. All rights reserved.

Niniejsze oprogramowanie jest objęte własnością prywatną. Wszelkie prawa zastrzeżone.
Kopiowanie, modyfikowanie, dystrybucja lub wykorzystanie tego oprogramowania bez wyraźnej pisemnej zgody autora jest surowo zabronione.

---

**Wersja:** 1.0.0
**Data:** 2025-10-06
