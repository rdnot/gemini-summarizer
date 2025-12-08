document.addEventListener('DOMContentLoaded', async function() {
  console.log('Popup loaded - starting init'); // Debug

  const saveKeyBtn = document.getElementById('saveKey');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const searchApiKeyInput = document.getElementById('searchApiKey');
  const useOpenRouterCheckbox = document.getElementById('useOpenRouter');
  const openRouterApiKeyInput = document.getElementById('openRouterApiKey');
  const openRouterModelInput = document.getElementById('openRouterModel');
  const modelSelect = document.getElementById('modelSelect');
  const generateBtn = document.getElementById('generate');
  const captureImageBtn = document.getElementById('captureImage');
  const geminiBtn = document.getElementById('gemini-btn');
  const gptBtn = document.getElementById('gpt-btn');
  const grokBtn = document.getElementById('grok-btn');
  const textInput = document.getElementById('textInput');
  const questionInput = document.getElementById('questionInput');
  const output = document.getElementById('output');

  let fullPageText = ''; // Store untrimmed text

  // Load saved API keys and model on popup open
  chrome.storage.sync.get(['geminiApiKey', 'searchApiKey', 'useOpenRouter', 'openRouterApiKey', 'openRouterModel', 'selectedModel'], function(result) {
    console.log('Storage result:', result); // Debug
    if (result.geminiApiKey) {
      geminiApiKeyInput.value = result.geminiApiKey;
      console.log('Gemini API key loaded');
    }
    if (result.searchApiKey) {
      searchApiKeyInput.value = result.searchApiKey;
      console.log('Search API key loaded');
    }
    if (result.useOpenRouter !== undefined) {
      useOpenRouterCheckbox.checked = result.useOpenRouter;
      console.log('OpenRouter usage loaded:', result.useOpenRouter);
    }
    if (result.openRouterApiKey) {
      openRouterApiKeyInput.value = result.openRouterApiKey;
      console.log('OpenRouter API key loaded');
    }
    if (result.openRouterModel) {
      openRouterModelInput.value = result.openRouterModel;
      console.log('OpenRouter model loaded:', result.openRouterModel);
    }
    if (result.selectedModel) {
      modelSelect.value = result.selectedModel;
      console.log('Model loaded:', result.selectedModel);
    }
  });

  // Auto-load text from current tab (selection or full page) - NO TRIM
  try {
    console.log('Querying active tab'); // Debug
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab:', tab); // Debug
    if (!tab || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
      output.innerHTML = `Can't load text from this tab (URL: ${tab ? tab.url : 'No tab'}). Open on a webpage like google.com and try again.`;
      return;
    }
    console.log('Sending message to tab:', tab.id); // Debug
    chrome.tabs.sendMessage(tab.id, { action: 'getText' }, function(response) {
      console.log('Message response:', response); // Debug
      if (chrome.runtime.lastError) {
        console.error('Message error:', chrome.runtime.lastError);
        output.innerHTML = `Messaging error: ${chrome.runtime.lastError.message}. Reload extension or try a different tab.`;
        return;
      }
      if (!response || !response.text) {
        output.innerHTML = `No text found on ${tab.url}. Try selecting text or a content-rich page.`;
        return;
      }
      fullPageText = response.text; // Store full
      textInput.value = fullPageText; // Load full directly - NO TRIM
      output.innerHTML = response.isSelection ? 'Selected text loaded!' : `Full page loaded (${Math.round(fullPageText.length / 1000)}k chars)! Leave question blank for summary, or enter a question for Q&A.`;
      console.log('Text loaded:', fullPageText.length, 'chars');
    });
  } catch (error) {
    console.error('Tab query error:', error);
    output.innerHTML = `Tab query failed: ${error.message}. Ensure a tab is active.`;
  }

  // Helper: Get Search API key (from input or storage)
  function getSearchApiKey() {
    return searchApiKeyInput.value.trim() || ''; // Prioritize input, fallback to empty
  }

  // Helper: Get OpenRouter settings
  function getUseOpenRouter() {
    return useOpenRouterCheckbox.checked;
  }
  function getOpenRouterApiKey() {
    return openRouterApiKeyInput.value.trim() || '';
  }
  function getOpenRouterModel() {
    return openRouterModelInput.value.trim() || 'arcee-ai/trinity-mini:free';
  }

  // Helper: Call Gemini API (reusable, for text and vision)
  async function callGemini(apiKey, model, prompt, outputMsg = '', isVision = false, base64Image = null) {
    if (outputMsg) output.innerHTML = outputMsg;

    let contents = [{ parts: [{ text: prompt }] }];
    if (isVision && base64Image) {
      contents = [{ parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: prompt }
      ] }];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.5
        },
        safetySettings: [
          { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_LOW_AND_ABOVE" },
          { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_LOW_AND_ABOVE" }
        ]
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status} - ${response.statusText}`);

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) throw new Error('No candidates in API response.');

    const candidate = data.candidates[0];
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Generation stopped: ${candidate.finishReason}`);
    }

    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      throw new Error('Empty content from API.');
    }

    return candidate.content.parts[0].text.trim();
  }

  // Helper: Call OpenRouter API (for text-based tasks)
  async function callOpenRouter(prompt, apiKey, model, outputMsg = '') {
    if (outputMsg) output.innerHTML = outputMsg;
    if (!apiKey || !model) {
      throw new Error('Missing OpenRouter API key or model.');
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-site.com', // Optional
        'X-Title': 'Gemini Summarizer' // Optional
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8192,
        temperature: 0.5
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status} - ${response.statusText}`);
    const data = await response.json();
    if (!data.choices || data.choices.length === 0) throw new Error('No choices in API response.');
    return data.choices[0].message.content.trim();
  }

  // Helper: Call appropriate API for text generation
  async function callTextApi(prompt, outputMsg = '', isRefine = false) {
    const apiKey = geminiApiKeyInput.value.trim();
    const useOR = getUseOpenRouter();
    const orKey = getOpenRouterApiKey();
    const orModel = getOpenRouterModel();
    const gemModel = modelSelect.value;

    if (useOR && orKey) {
      return await callOpenRouter(prompt, orKey, orModel, outputMsg);
    } else if (apiKey) {
      return await callGemini(apiKey, gemModel, prompt, outputMsg);
    } else {
      throw new Error('No valid API key for text generation.');
    }
  }

  // Helper: Perform Web Search with refined query (detects API type)
  async function performWebSearch(refinedQuery, searchKey) {
    if (!refinedQuery || !searchKey) {
      console.warn('Skipping web search: No query or API key.');
      output.innerHTML += '\nNote: Web search skipped (missing API key).';
      return '';
    }

    const keyPrefix = searchKey.substring(0, 2).toLowerCase();

    try {
      let searchContext = '';

      if (keyPrefix === 'tv') {
        // Tavily
        const searchResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${searchKey}`
          },
          body: JSON.stringify({
            api_key: searchKey,
            query: refinedQuery,
            search_depth: 'advanced',
            include_answer: 'basic',
            max_results: 10,
            include_raw_content: false
          })
        });
        if (!searchResponse.ok) throw new Error(`Tavily API error: ${searchResponse.status}`);
        const searchData = await searchResponse.json();
        console.log('Tavily search data:', searchData);
        if (!searchData.answer && (!searchData.results || searchData.results.length === 0)) {
          console.warn('No search results; proceeding without.');
          return '';
        }
        if (searchData.answer) searchContext += `Web Search Answer: ${searchData.answer}\n\n`;
        if (searchData.results) {
          searchContext += 'Relevant Sources:\n';
          searchData.results.slice(0, 10).forEach((result, index) => {
            searchContext += `${index + 1}. ${result.title}: ${result.url} - ${result.content?.substring(0, 200)}...\n`;
          });
          searchContext += '\n';
        }
      } else if (keyPrefix === 'bs') {
        // Brave
        const searchResponse = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(refinedQuery)}&count=10&freshness=pm&text_decorations=false&extra_snippets=true&result_filter=web&summary=true`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': searchKey
          }
        });
        if (!searchResponse.ok) throw new Error(`Brave API error: ${searchResponse.status}`);
        const searchData = await searchResponse.json();
        if (!searchData.web || !searchData.web.results || searchData.web.results.length === 0) {
          console.warn('No search results; proceeding without.');
          return '';
        }
        let context = searchData.summarizer ? searchData.summarizer.key : '';
        if (searchData.web.results) {
          context += searchData.web.results.map(result => {
            let snippet = result.description || '';
            if (result.extra_snippets) snippet += '\n' + result.extra_snippets.join('\n');
            return `\n- Title: ${result.title}\nURL: ${result.url}\nSnippet: ${snippet}`;
          }).join('');
        }
        searchContext = context;
      } else if (keyPrefix === 'yd') {
        // You.com
        const url = new URL('https://ydc-index.io/v1/search');
        url.searchParams.append('query', refinedQuery);
        url.searchParams.append('count', '10');
        url.searchParams.append('freshness', 'month');
        const searchResponse = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-API-Key': searchKey
          }
        });
        if (!searchResponse.ok) throw new Error(`You.com API error: ${searchResponse.status}`);
        const searchData = await searchResponse.json();
        console.log('You.com search data:', searchData);
        if (!searchData.results || (!searchData.results.web && !searchData.results.news)) {
          console.warn('No search results; proceeding without.');
          return '';
        }
        // Web Results
        if (searchData.results.web && searchData.results.web.length > 0) {
          searchContext += 'Relevant Web Sources:\n';
          searchData.results.web.slice(0, 10).forEach((result, index) => {
            searchContext += `${index + 1}. ${result.title}: ${result.url} - ${result.description?.substring(0, 200)}...\n`;
          });
          searchContext += '\n';
        }
        // News Results
        if (searchData.results.news && searchData.results.news.length > 0) {
          searchContext += 'Relevant News Sources:\n';
          searchData.results.news.slice(0, 10).forEach((result, index) => {
            searchContext += `${index + 11}. ${result.title}: ${result.url} - ${result.description?.substring(0, 200)}...\n`;
          });
          searchContext += '\n';
        }
      } else {
        throw new Error(`Unsupported search API prefix: ${keyPrefix}`);
      }

      return searchContext;
    } catch (error) {
      console.error('Web search error:', error);
      output.innerHTML += `\nWarning: Web search failed (${error.message}). Proceeding without.`;
      return '';
    }
  }

  // Save API keys and model
  saveKeyBtn.addEventListener('click', function() {
    const geminiKey = geminiApiKeyInput.value.trim();
    const searchKey = searchApiKeyInput.value.trim();
    const useOR = useOpenRouterCheckbox.checked;
    const orKey = openRouterApiKeyInput.value.trim();
    const orModel = openRouterModelInput.value.trim();
    const model = modelSelect.value;
    if (geminiKey) {
      chrome.storage.sync.set({ 
        geminiApiKey: geminiKey, 
        searchApiKey: searchKey || null,
        useOpenRouter: useOR,
        openRouterApiKey: orKey || null,
        openRouterModel: orModel || null,
        selectedModel: model 
      }, function() {
        console.log('Keys and model saved');
        output.innerHTML = 'API keys and model saved successfully!';
      });
    } else {
      output.innerHTML = 'Please enter a valid Gemini API key.';
    }
  });

  // Generate with API (enhanced with contextual search)
  generateBtn.addEventListener('click', async function() {
    const apiKey = geminiApiKeyInput.value.trim();
    const searchKey = getSearchApiKey();
    const text = textInput.value.trim();
    const question = questionInput.value.trim();

    if (!apiKey) {
      output.innerHTML = 'Please enter and save your Gemini API key first.';
      return;
    }
    if (!text) {
      output.innerHTML = 'No text loaded. Open on a webpage first.';
      return;
    }

    let originalText = text;
    let finalPrompt;

    if (!question) {
      // No question: Direct summary (1 call)
      finalPrompt = `Provide a concise summary of the following text in under 400 words total, structured as 10 key bullet points for readability (one bullet per major topic or section). Each bullet should cover the main ideas, updates, and key details briefly. Keep overall output short to fit fully.

Text:
${originalText}`;

      try {
        const generatedText = await callTextApi(finalPrompt, `Generating summary...`);
        output.innerHTML = generatedText.replace(/\n\n/g, '\n');
      } catch (error) {
        console.error('Error:', error);
        output.innerHTML = `Error: ${error.message}\n\nTip: Check console for details.`;
      }
      return;
    }

    // With question: Check for search key BEFORE refinement
    if (searchKey) {
      // Search available: Refine query, search, then full response
      output.innerHTML = `Refining search query...`;

      try {
        // Step 1: Refine query with context from text
        const refinePrompt = `Based on the following text and user question, generate a single, concise web search query (under 400 characters total) that incorporates key context from the text to find relevant, up-to-date information for answering the question accurately. Output ONLY the query itself, nothing else.

Text: ${originalText.substring(0, 2000)}

Question: ${question}`;

        const refinedQuery = await callTextApi(refinePrompt, undefined, true);
        console.log('Refined query:', refinedQuery);
        let effectiveQuery = refinedQuery;
        if (refinedQuery.length > 400) {
          effectiveQuery = question; // Fallback
        }

        // Step 2: Web search
        const searchContext = await performWebSearch(effectiveQuery, searchKey);
        let webContext = searchContext ? `\n\nWeb Search Context (use ONLY for the answer section):\n${searchContext}` : '';

        // Step 3: Full response - Separate original text and web context
        finalPrompt = `Provide a concise summary of the ORIGINAL TEXT ONLY (do NOT include or reference any web search context in the summary) in under 400 words total, structured as 10 key bullet points for readability (one bullet per major topic or section). Each bullet should cover the main ideas, updates, and key details briefly. Then, directly answer this question in under 100 words, drawing from the original text AND the web search context: "${question}". Use "Summary:" for bullets and "Answer:" for the response. Keep overall output short to fit fully (total under 500 words).

Original Text:
${originalText}

${webContext}`;

        const generatedText = await callTextApi(finalPrompt, 'Generating full response with web context...');
        output.innerHTML = generatedText.replace(/\n\n/g, '\n');
      } catch (error) {
        console.error('Error:', error);
        output.innerHTML = `Error: ${error.message}\n\nTip: Check console for details.`;
      }
    } else {
      // No search: Single call with fallback prompt (no refinement or search)
      output.innerHTML = `Generating without web search (no search key)...`;

      finalPrompt = `Provide a concise summary of the following text in under 400 words total, structured as 10 key bullet points for readability (one bullet per major topic or section). Each bullet should cover the main ideas, updates, and key details briefly. Then, directly answer this question in under 100 words: "${question}". Use "Summary:" for bullets and "Answer:" for the response. Keep overall output short to fit fully (total under 500 words).

Text:
${originalText}`;

      try {
        const generatedText = await callTextApi(finalPrompt);
        output.innerHTML = generatedText.replace(/\n\n/g, '\n');
      } catch (error) {
        console.error('Error:', error);
        output.innerHTML = `Error: ${error.message}\n\nTip: Check console for details.`;
      }
    }
  });

  // Capture & Describe Image with Gemini Vision (enhanced similarly)
  captureImageBtn.addEventListener('click', async function() {
    const apiKey = geminiApiKeyInput.value.trim();
    const searchKey = getSearchApiKey();
    const question = questionInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!apiKey) {
      output.innerHTML = 'Please enter and save your Gemini API key first.';
      return;
    }

    output.innerHTML = 'Capturing screenshot...';

    try {
      // Capture screenshot
      const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      const base64Image = screenshot.split(',')[1];

      let visionPrompt;
      if (!question) {
        // No question: Direct description (1 call)
        visionPrompt = 'Describe and summarize this image in detail, structured as 10 key bullet points for readability.';

        const generatedText = await callGemini(apiKey, selectedModel, visionPrompt, undefined, true, base64Image);
        output.innerHTML = generatedText.replace(/\n\n/g, '\n');
        return;
      }

      // With question: Check for search key BEFORE refinement
      if (searchKey) {
        // Search available:  Refine query, search, then full response
        output.innerHTML = `Refining search query for image...`;

        // Step 1: Refine query (no text context, so just enhance question)
        const refinePrompt = `Based on this user question about an image, generate a single, concise web search query (under 400 characters) to find relevant context or details for answering it accurately. Output ONLY the query.

Question: ${question}`;

        const refinedQuery = await callTextApi(refinePrompt, undefined, true);
        console.log('Refined query for image:', refinedQuery);
        let effectiveQuery = refinedQuery;
        if (refinedQuery.length > 400) {
          effectiveQuery = question; // Fallback
        }

        // Step 2: Web search
        const searchContext = await performWebSearch(effectiveQuery, searchKey);
        let webContext = searchContext ? `\n\nWeb Search Context (use ONLY for the answer section):\n${searchContext}` : '';

        // Step 3: Full vision response - Separate image description and web context
        visionPrompt = `Describe and summarize this image in detail, structured as 10 key bullet points for readability (do NOT include or reference any web search context in the description). Then, answer this question about the image in under 100 words, drawing from the image AND the web search context: "${question}". Use "Description:" for bullets and "Answer:" for the response.${webContext}`;

        const generatedText = await callGemini(apiKey, selectedModel, visionPrompt, 'Generating full response with web context...', true, base64Image);
        output.innerHTML = generatedText.replace(/\n\n/g, '\n');
      } else {
        // No search: Single Gemini call with fallback prompt (no refinement or search)
        output.innerHTML = `Generating without web search (no search key)...`;

        visionPrompt = `Describe and summarize this image in detail, structured as 10 key bullet points for readability. Then, answer this question about the image in under 100 words: "${question}". Use "Description:" for bullets and "Answer:" for the response.`;

        const generatedText = await callGemini(apiKey, selectedModel, visionPrompt, undefined, true, base64Image);
        output.innerHTML = generatedText.replace(/\n\n/g, '\n');
      }
    } catch (error) {
      console.error('Error:', error);
      output.innerHTML = `Error: ${error.message}\n\nTip: Check console for details.`;
    }
  });

  // Web Buttons (updated prompt for questions to include web-search reminder)
  const webUrls = {
    'gemini-btn': 'https://gemini.google.com/app',
    'gpt-btn': 'https://chatgpt.com',
    'grok-btn': 'https://grok.com'
  };

  Object.keys(webUrls).forEach(btnId => {
    const btn = document.getElementById(btnId);
    btn.addEventListener('click', async function() {
      const text = textInput.value.trim();
      const question = questionInput.value.trim();

      if (!text) {
        output.innerHTML = 'No text loaded. Open on a webpage first.';
        return;
      }

      // Auto-mode: Summary only if no question, Q&A if question entered (with web-search reminder)
      let prompt;
      if (!question) {
        prompt = `Provide a concise summary of the following text in under 400 words total, structured as 10 key bullet points for readability (one bullet per major topic or section). Each bullet should cover the main ideas, updates, and key details briefly. Keep overall output short to fit fully.

Text:
${text}`;
      } else {
        prompt = `Provide a concise summary of the following text in under 400 words total, structured as 10 key bullet points for readability (one bullet per major topic or section). Each bullet should cover the main ideas, updates, and key details briefly. Then, directly answer this question using the text and latest web-search in under 100 words: "${question}". Use "Summary:" for bullets and "Answer:" for the response. Keep overall output short to fit fully (total under 500 words).

Text:
${text}`;
      }

      // Copy prompt to clipboard
      try {
        await navigator.clipboard.writeText(prompt);
        output.innerHTML = `Prompt copied! Opening ${btn.textContent}—paste (Ctrl+V) and hit Enter.`;
      } catch (err) {
        output.innerHTML = 'Copy failed—select and Ctrl+C below:\n\n' + prompt;
        return;
      }

      // Open site tab
      chrome.tabs.create({ url: webUrls[btnId] }, function(tab) {
        setTimeout(() => chrome.tabs.update(tab.id, { active: true }), 2000);
      });
    });
  });

  console.log('Init complete'); // Debug
});