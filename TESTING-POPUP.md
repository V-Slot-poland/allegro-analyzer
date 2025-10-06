# 🧪 Testing Guide - Popup Communication

## Jak przetestować komunikację content script ↔ popup

### Przygotowanie

1. **Przeładuj extension:**
   ```
   chrome://extensions/ → Allegro Analyzer → kliknij reload 🔄
   ```

2. **Otwórz aukcję Allegro:**
   - Przykład: https://allegro.pl/oferta/gube-r-black-2gu10-kinkiet-2xgu10-elewacyjny-17945721966

### Test 1: Floating Button → Popup

**Kroki:**

1. Na stronie aukcji Allegro kliknij floating button **"🔍 Analizuj aukcję"** (prawy dolny róg)
2. Poczekaj 2 sekundy
3. Kliknij ikonę extension w toolbar (albo Ctrl+Shift+A)
4. Popup powinien pokazać **kartę z danymi aukcji**

**Oczekiwany rezultat:**

✅ Popup pokazuje:
- Miniaturkę zdjęcia (80x80px)
- Tytuł aukcji (max 2 linie)
- Cenę (fioletowy bold text)
- Liczbę zdjęć (np. "165")
- Długość opisu (np. "2113 znaków")
- Nazwę sprzedawcy
- Stan ("Nowy" / "Używany")
- 2 przyciski: "🔄 Analizuj ponownie" i "👁️ Zobacz aukcję"

### Test 2: Przycisk "Analizuj ponownie"

**Kroki:**

1. W popupie kliknij przycisk **"🔄 Analizuj ponownie"**
2. Popup powinien zaktualizować dane (jeśli coś się zmieniło na stronie)

**Oczekiwany rezultat:**

✅ Dane w popupie się odświeżają
✅ W console.log pojawia się: `📨 Received SCRAPE_AGAIN message from popup`

### Test 3: Przycisk "Zobacz aukcję"

**Kroki:**

1. W popupie kliknij przycisk **"👁️ Zobacz aukcję"**
2. Powinna otworzyć się nowa karta z aukcją

**Oczekiwany rezultat:**

✅ Otwiera się nowa karta Chrome z URL aukcji

### Test 4: Multiple Aukcje

**Kroki:**

1. Otwórz pierwszą aukcję Allegro
2. Kliknij floating button "🔍 Analizuj aukcję"
3. Otwórz popup - sprawdź dane pierwszej aukcji ✅
4. Przejdź do **innej aukcji** Allegro (nowa karta)
5. Kliknij floating button na nowej aukcji
6. Otwórz popup - sprawdź czy dane się zmieniły ✅

**Oczekiwany rezultat:**

✅ Popup pokazuje dane aktualnej aukcji
✅ Każda aukcja ma swoje własne dane

### Debug Mode

**Console logs do sprawdzenia:**

#### W Content Script Console (F12 na stronie aukcji):
```
✅ Allegro auction detected!
📍 Auction ID: ...
🔍 Starting detailed scraping...
✅ Found with selector: h1 = ...
📨 Received SCRAPE_AGAIN message from popup (gdy klikniesz "Analizuj ponownie")
```

#### W Popup Console (F12 na popupie):
```
Allegro Analyzer popup loaded
Current tab is an Allegro auction: https://allegro.pl/oferta/...
Received auction data: { title: "...", price: "...", ... }
```

### Troubleshooting

**Problem: Popup pokazuje tylko "Gotowy do analizy!"**
- Sprawdź czy kliknąłeś floating button na stronie aukcji
- Sprawdź Console czy message został wysłany (`chrome.runtime.sendMessage`)
- Przeładuj extension

**Problem: Brak miniatury zdjęcia**
- Sprawdź czy `imageUrls` array ma elementy
- Sprawdź Console czy URL zdjęcia jest poprawny
- Niektóre aukcje mogą blokować cross-origin images

**Problem: "Analizuj ponownie" nie działa**
- Sprawdź Console content script czy pojawia się `📨 Received SCRAPE_AGAIN message`
- Upewnij się że jesteś na tej samej karcie co aukcja
- Przeładuj extension

### Expected Data Structure

Popup powinien otrzymać taki obiekt:

```json
{
  "url": "https://allegro.pl/oferta/...",
  "auctionId": "...",
  "title": "GUBE-R Black 2GU10 - Kinkiet 2xGU10 elewacyjny",
  "price": "68.40",
  "priceAmount": 68.4,
  "currency": "PLN",
  "imageCount": 153,
  "imageUrls": [
    "https://a.allegroimg.com/...",
    "https://a.allegroimg.com/...",
    ...
  ],
  "descriptionLength": 1113,
  "hasDescription": true,
  "seller": "BHP_Incor",
  "condition": "Nowy",
  "timestamp": "2025-10-06T...",
  "scrapedAt": "6.10.2025, 14:23:45"
}
```

## UI Screenshots

### Before (Initial State)
- Gradient purple header ✅
- "Gotowy do analizy!" message ✅
- Instrukcje (3 kroki) ✅

### After (Data Loaded)
- Miniaturka + tytuł + cena na górze ✅
- 4 rzędy detali (zdjęcia, opis, sprzedawca, stan) ✅
- 2 przyciski akcji na dole ✅

---

**Ready to test!** 🚀
