# 🔍 Allegro Analyzer

Chrome Extension do analizy i optymalizacji aukcji Allegro z wykorzystaniem AI.

## 📋 Opis

Allegro Analyzer to inteligentne narzędzie SaaS, które automatycznie analizuje aukcje na platformie Allegro i dostarcza spersonalizowane sugestie optymalizacji oparte na technologii sztucznej inteligencji.

## 🚀 Funkcje (Sprint 1)

- ✅ Automatyczne wykrywanie stron aukcji Allegro
- ✅ Floating button "Analizuj aukcję" na stronie aukcji
- ✅ Podstawowy scraping danych aukcji
- ✅ Modern UI z gradient design
- ✅ Console logging dla debugowania

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
2. W prawym dolnym rogu pojawi się przycisk **"🔍 Analizuj aukcję"**
3. Kliknij przycisk, aby rozpocząć analizę
4. Otwórz Console (F12) aby zobaczyć logi z zebranymi danymi

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

Extension loguje wszystkie akcje w Console:

1. Otwórz DevTools (F12)
2. Przejdź do zakładki **Console**
3. Szukaj logów z prefiksem: `🔍 Allegro Analyzer:`

Przykładowe logi:
- ✅ `Allegro auction detected!`
- 📍 `Auction ID: 12345678`
- 📊 `Scraped auction data: {...}`

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
