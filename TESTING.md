# 🧪 Testing Guide - Allegro Analyzer

## Jak przetestować scraping na prawdziwej aukcji Allegro

### Krok 1: Przeładuj Extension

1. Otwórz `chrome://extensions/`
2. Znajdź **Allegro Analyzer**
3. Kliknij ikonę reload (🔄)

### Krok 2: Otwórz aukcję Allegro

Przykładowe aukcje do testowania:
- https://allegro.pl/oferta/ (dowolna aktywna aukcja)
- Wyszukaj cokolwiek na Allegro i kliknij w dowolną ofertę

### Krok 3: Otwórz Console

1. Naciśnij **F12** lub **Ctrl+Shift+I** (Windows/Linux) lub **Cmd+Option+I** (Mac)
2. Przejdź do zakładki **Console**

### Krok 4: Sprawdź logi

Po załadowaniu strony powinny pojawić się:

```
✅ Allegro auction detected!
📍 Auction ID: 12345678
✅ Analyze button created and added to page
🤖 Auto-scraping auction data on page load...
🔍 Starting detailed scraping...
✅ Found with selector: h1[itemprop="name"] = ...
✅ Found 8 images with selector: div[data-box-name="gallery"] img
✅ Found description (1234 chars) with selector: div[data-box-name="Description"]

================================================================================
📊 INITIAL SCRAPE - AUCTION DATA
================================================================================
{
  "url": "https://allegro.pl/oferta/...",
  "auctionId": "12345678",
  "title": "Przykładowy tytuł aukcji",
  "price": "99,99 zł",
  "priceAmount": 99.99,
  "currency": "PLN",
  "imageCount": 8,
  "imageUrls": [...],
  "descriptionLength": 1234,
  "hasDescription": true,
  "seller": "NazwaSprzedawcy",
  "condition": "Nowy",
  "timestamp": "2025-10-06T...",
  "scrapedAt": "6.10.2025, 12:00:00"
}
================================================================================
```

### Krok 5: Kliknij przycisk "🔍 Analizuj aukcję"

1. W prawym dolnym rogu strony zobaczysz floating button
2. Kliknij go
3. W konsoli pojawi się dodatkowa tabela z danymi

## Co sprawdzić?

### ✅ Poprawnie zescrapowane dane:

- **Tytuł aukcji** - powinien być pełny i dokładny
- **Cena** - powinna być aktualna z walutą
- **Liczba zdjęć** - sprawdź czy zgadza się z galerią
- **URL** - powinien być pełny adres aukcji
- **Długość opisu** - powinna być > 0 jeśli aukcja ma opis
- **Sprzedawca** - nazwa sprzedającego
- **Stan** - "Nowy" lub "Używany"

### 🔍 Selektory CSS

Jeśli dane się nie scrapują (np. "Nie znaleziono tytułu"):

1. Kliknij prawym na element na stronie → **Inspect**
2. Znajdź odpowiedni selector CSS
3. Dodaj go do tablicy selektorów w `content-script.js`

Przykład:
```javascript
const title = trySelectors([
  'h1[itemprop="name"]',        // Obecny
  'h1.msts_pt',                 // Stary layout
  'h1.TWOJ_NOWY_SELECTOR',      // <-- Dodaj tutaj
  'h1'                          // Fallback
]);
```

## 🐛 Troubleshooting

### Problem: "Not an Allegro auction page"
- Upewnij się że URL zawiera `/oferta/`
- Odśwież stronę (F5)

### Problem: Brak danych w JSON
- Otwórz DevTools i sprawdź selektory CSS
- Allegro mogło zmienić strukturę HTML
- Dodaj nowe selektory do `content-script.js`

### Problem: Button się nie pojawia
- Sprawdź czy extension jest włączony
- Sprawdź Console czy nie ma błędów JavaScript
- Przeładuj extension w `chrome://extensions/`

## 📊 Expected Output Example

```json
{
  "url": "https://allegro.pl/oferta/samsung-galaxy-s23-ultra-12345678",
  "auctionId": "samsung-galaxy-s23-ultra-12345678",
  "title": "Samsung Galaxy S23 Ultra 256GB Czarny",
  "price": "4 999,00 zł",
  "priceAmount": 4999,
  "currency": "PLN",
  "imageCount": 12,
  "imageUrls": [
    "https://a.allegroimg.com/...",
    "https://a.allegroimg.com/...",
    ...
  ],
  "descriptionLength": 2847,
  "hasDescription": true,
  "seller": "SuperTech Store",
  "condition": "Nowy",
  "timestamp": "2025-10-06T14:23:45.123Z",
  "scrapedAt": "6.10.2025, 14:23:45"
}
```

## 🎯 Success Criteria

- [x] Tytuł zescrapowany poprawnie
- [x] Cena wyświetlona z walutą
- [x] Liczba zdjęć zgadza się z galerią
- [x] URL jest pełny i poprawny
- [x] JSON wyświetla się w konsoli
- [x] Floating button działa
- [x] Brak błędów w Console

---

**Ready to test!** 🚀
