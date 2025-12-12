# Privacy Policy for Gemini Summarizer

**Effective Date: December 12, 2025**

This Privacy Policy describes how Gemini Summarizer (the "Extension"), developed by not11 (GitHub: https://github.com/rdnot), collects, uses, and protects information when you use the Extension. Our goal is to provide AI-powered summarization, Q&A, and image analysis tools for web content while prioritizing your privacy. We do not collect, store, or share any personal data without your explicit action, and all processing occurs locally on your device unless you initiate an API request.

## Information Collection and Use

The Extension does not collect or store personal data, browsing history, or any user-identifiable information. It processes web content (text or screenshots) **only locally** on your device and **only when you actively request a feature** (e.g., summarizing text or describing an image). 

- **Text Extraction**: When you open the Extension on a webpage, it may extract selected text or full-page content from the active tab using browser permissions. This text is used solely for generating summaries or answers via your provided API (e.g., Google Gemini or OpenRouter). The text is not stored, transmitted, or shared beyond the API call you authorize.
  
- **Image Capture**: If you use the "Capture & Describe Image" feature, the Extension captures a screenshot of the visible tab. This image is converted to base64 format locally and sent **only to the Google Gemini API** (if you have provided a key) for analysis. No image data is retained after processing.

- **API Keys**: You may optionally input API keys (e.g., for Gemini, OpenRouter, Tavily, Brave, or You.com). These are stored securely in your browser's local storage (via `chrome.storage.sync`) for your convenience and are not accessible to us or third parties. Keys are used only to make API requests on your behalf.

- **Web Search Integration**: If you provide a search API key (Tavily, Brave, or You.com), the Extension may first refine your question into an optimized search query by sending a prompt (including a snippet of the page text and your question) to your configured AI API (Gemini or OpenRouter). It then fetches results from the search service using that refined query to enrich responses. The refined query and search results are processed locally and incorporated into subsequent AI prompts; no query history is logged or shared by the Extension.

No analytics, tracking, or telemetry data is collected. We do not sell, rent, or share your data with third parties for any purpose unrelated to the Extension's core functionality.

## Permissions and Host Access

The Extension requests minimal permissions to function:

- **Storage**: To save your API keys locally (optional and user-controlled).
- **Active Tab**: To extract text or capture screenshots from the current webpage only when you interact with the Extension.
- **Host Permissions**: Limited to specific domains for API calls:
  - `https://api.tavily.com/*` (web search, if enabled).
  - `https://api.search.brave.com/*` (web search, if enabled).
  - `https://ydc-index.io/*` (You.com web search, if enabled).
  - `https://openrouter.ai/*` (alternative AI models, if enabled).
  - `https://generativelanguage.googleapis.com/*` (Google Gemini API, if enabled).

These permissions do not grant access to other tabs, sites, or your full browsing session. Content scripts run only on pages matching `<all_urls>` for text extraction but are triggered solely by your actions.

## Data Storage

- All temporary data (e.g., extracted text, screenshots, search results) is processed in memory and discarded immediately after use.
- API keys are stored encrypted in your browser's local storage and are not synced to our servers or accessible remotely.
- No data is uploaded to external servers, databases, or cloud storage operated by us.

## Security

We prioritize security by design:
- All sensitive operations (e.g., API calls) use HTTPS.
- Data transmission occurs only to the APIs you authorize, with no interception or logging on our end.
- Local processing minimizes exposure; we recommend using strong, unique API keys and reviewing API provider policies (e.g., Google's for Gemini).

If a vulnerability is discovered, we will address it promptly via Extension updates.

## Children's Privacy

The Extension is not directed to children under 13 (or the applicable age in your jurisdiction). We do not knowingly collect data from children.

## Changes to This Privacy Policy

We may update this policy to reflect changes in functionality or legal requirements. Updates will be posted here with a revised effective date. Continued use of the Extension after changes constitutes acceptance. Check periodically for updates.

## Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or the Extension, please contact the developer:

- **Email**: tsntsntsn-not@yahoo.com
- **GitHub**: https://github.com/rdnot/gemini-summarizer (report issues or suggestions)

By using Gemini Summarizer, you acknowledge that you have read and agree to this Privacy Policy. If you do not agree, please uninstall the Extension.

---

*This policy complies with Chrome Web Store requirements. For the full Extension source code, visit [https://github.com/rdnot/gemini-summarizer](https://github.com/rdnot/gemini-summarizer).*
