# Gemini Summarizer & Q&A

A powerful browser extension for summarizing selected text (or full page) and answering questions using Google Gemini / OpenRouter API. Includes image capture and description, web search integration via Tavily/Brave/You.com, and quick prompts for Gemini/ChatGPT/Grok.

![Popup Interface v1.4](https://raw.githubusercontent.com/rdnot/gemini-summarizer/screenshot1.4.png)

## About
Gemini Summarizer & Q&A lets you quickly summarize web pages or selected text using Google's Gemini AI or OpenRouter. Auto-load text from any tab, generate bullet-point summaries, or ask questions for concise answers. Features include: screenshot capture for image descriptions; optional Tavily/Brave/You.com web search API for enriched responses; and one-click prompt copying to Gemini, ChatGPT, or Grok sites. Securely handles your API keys; data (text/screenshots) is only sent to APIs upon user request—no tracking or storage. Ideal for research, reading, and productivity. Requires free Gemini / OpenRouter API key; supports multiple models like 2.5 Flash / 2.5 Flash Lite / 2.5 Pro / Robotics-ER 1.5 Preview.

- If user does not provide web search API, the summary and question will use only 1 API request.
- For 1 Tavily web-search, Tavily API uses 2 API credits for more deeper web-search (Parameter search_depth="advanced"). For Brave and You.com use 1 API credit.
- For YouTube videos, press 'show transcript' first to load text.

This repository contains versions for both Chrome and Firefox. The code is mostly shared, with browser-specific differences in API namespaces and manifest configurations.

## Features
- Auto-load selected text or full-page content from the current tab.
- Generate concise bullet-point summaries.
- Answer user questions with optional web search context.
- Capture and describe screenshots using Gemini's vision capabilities.
- Support for multiple Gemini models and OpenRouter for alternative AI models.
- One-click buttons to copy prompts for use in Gemini, ChatGPT, or Grok web interfaces.
- Web search integration with Tavily, Brave, or You.com APIs.
- Secure API key storage via browser storage.

## Installation

### Chrome
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the `chrome/` folder from the repo (or the root if not using subfolders).
5. The extension should appear in your toolbar. Click it to open the popup.

### Firefox
1. Clone or download this repository.
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on" and select the `manifest.json` file from the `firefox/` folder (or the root if not using subfolders).
4. The extension will load temporarily (until browser restart). For permanent installation, submit to Firefox Add-ons or use a signed version.
https://addons.mozilla.org/en-US/firefox/addon/gemini-summarizer-q-a/

## Usage
1. Open the extension popup on a webpage.
2. Text auto-loads (selected or full page).
3. Enter your Gemini/OpenRouter API key and save.
4. Optionally add a search API key (Tavily/Brave/You.com) and OpenRouter details.
5. Leave the question field blank for a summary, or enter a question for Q&A.
6. Use "Capture & Describe Image" for screenshot analysis.
7. Click Gemini/GPT/Grok buttons to copy prompts and open their sites.

## Differences Between Versions
- **API Namespace**: Chrome uses the `chrome.` API (e.g., `chrome.storage`, `chrome.tabs`); Firefox uses `browser.` (e.g., `browser.storage`, `browser.tabs`).
- **Manifest**: Firefox includes `browser_specific_settings` for Gecko compatibility (e.g., extension ID, min version). Chrome does not.
- **Permissions**: Both require "storage" and "activeTab". Host permissions for APIs (Tavily, Brave, You.com, OpenRouter) are the same.
- **Content Script**: Firefox version uses `browser.runtime.onMessage`; Chrome uses `chrome.runtime.onMessage`.
- Functionality is otherwise identical, with shared logic for text extraction, API calls, and UI.

## API Requirements
- **Gemini API Key**: Required; get from Google AI Studio.
- **OpenRouter**: Optional; checkbox to enable, with API key and model (e.g., 'arcee-ai/trinity-mini:free').
- **Search API**: Optional for web-enriched responses; supports Tavily, Brave, or You.com keys.
- No internet access beyond specified APIs; all processing is client-side.

## Permissions and Data
- **Required Permissions**: Access your data for all websites (for text extraction and screenshots).
- **Optional Permissions**: Access to api.tavily.com, api.search.brave.com, ydc-index.io, openrouter.ai (for web searches and AI calls).
- **Data Collection**: Website content (text/screenshots) only when you request summaries/Q&A/images. No tracking or external storage.

## License

This project is licensed under the MIT License.



