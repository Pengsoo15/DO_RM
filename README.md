# Student Survival OS

A financial survival tool for Filipino students. Tracks daily spending, calculates budget limits, and gives advice based on local Philippine pricing data.

## Features

- Budget setup with allowance, rent, transport, and food preferences
- Daily spending tracker with dynamic limit adjustment
- Weekly meal plan generator (uses Groq AI)
- Financial advice based on real PH market data (PSA, DA, LTFRB, DOE)
- Heatmap calendar for spending history
- Add money / income tracking

## Setup

1. Clone the repo
2. Create a `.env` file in root:
```
API_KEY=your_groq_api_key
API_URL=https://api.groq.com/openai/v1/chat/completions
MODEL=llama-3.3-70b-versatile
```
3. Open `index.html` in a browser or deploy to Vercel

## Project Structure

```
/js
  app.js        - form handling, navigation
  ui.js         - dashboard and tracker rendering
  budgetEngine.js - budget calculations and advice
  ai.js         - Groq API integration
  storage.js    - LocalStorage wrapper
  loadEnv.js    - loads .env into window.__ENV
/data
  localCosts.js - PH government pricing data
/css
  styles.css    - main stylesheet
```

## Deployment

- Frontend: deploy HTML/CSS/JS directly to Vercel or any static host
- API key is loaded from `.env` at runtime via `loadEnv.js`
- Make sure `.env` is in `.gitignore` before pushing

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- Groq API (llama-3.3-70b) for AI features
- LocalStorage for data persistence
