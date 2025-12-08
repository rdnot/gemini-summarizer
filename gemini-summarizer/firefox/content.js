// Content script: Listen for messages from popup to get text
console.log('Content script loaded'); // Debug on page F12

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request); // Debug
  if (request.action === 'getText') {
    // Check for selection first
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      sendResponse({ text: selectedText, isSelection: true });
      return;
    }

    // Wait for dynamic content (5s for heavy sites like AHA)
    setTimeout(() => {
      try {
        // Site-specific for ahajournals.org / journal sites
        let mainElement = document.querySelector('article, main, .article-body, .body-content, .article-text, .article-section, #article-content, .content-wrapper');
        if (!mainElement) {
          mainElement = document.body; // Fallback
        }

        // Recursive extraction with depth limit & cycle prevention
        function extractTextFromElement(element, depth = 0, visited = new WeakSet()) {
          if (depth > 20 || !element || visited.has(element)) return ''; // FIXED: Depth cap + cycle check

          visited.add(element);

          // Expanded skip: nav, ads, metrics, share, pdf, help, etc. + tables
          const skipSelectors = 'script, style, noscript, nav, header, footer, aside, .sidebar, .ads, .advertisement, .cookie, .modal, .popup, [role="dialog"], iframe, .metrics, .share, .pdf, .help, .navigation, .references-list, .disclosures, button, a[href*="pdf"], .citation, .expand-table';
          if (element.matches(skipSelectors) || element.closest(skipSelectors)) {
            return '';
          }

          let text = '';
          if (element.childNodes) {
            for (let child of element.childNodes) {
              if (child.nodeType === Node.TEXT_NODE) {
                const childText = child.textContent.trim();
                if (childText && childText.length > 3) { // Skip short fragments
                  text += childText + ' ';
                }
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                text += extractTextFromElement(child, depth + 1, visited); // FIXED: Pass depth/visited
              }
            }
          }

          // Always extract key article elements: headers, paras, lists, tables
          const keyTags = 'P, H1, H2, H3, H4, H5, H6, LI, TD, TH, FIGCAPTION, CAPTION';
          if (element.matches(keyTags)) {
            text += extractTextFromElement(element, depth + 1, visited);
          }

          return text.trim();
        }

        let fullText = extractTextFromElement(mainElement);
        fullText = fullText.replace(/\s+/g, ' ').trim();

        console.log('Clean extraction length:', fullText.length, 'from', mainElement.className || mainElement.tagName); // Debug

        sendResponse({ text: fullText, isSelection: false });
      } catch (error) {
        console.error('Extraction error:', error);
        // Fallback to basic, but skip junk
        let fallbackText = document.body.innerText || document.body.textContent;
        fallbackText = fallbackText.replace(/\s+/g, ' ').trim();
        console.log('Fallback length:', fallbackText.length);
        sendResponse({ text: fallbackText, isSelection: false });
      }
    }, 1000); // 1s wait

    // Port safety
    return true;
  }
});