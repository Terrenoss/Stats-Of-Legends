// Script de test pour extractTextFromResponse
// Usage: node scripts/test_extract.js

const sample = {
  sdkHttpResponse: {
    headers: {
      'content-type': 'application/json; charset=UTF-8'
    }
  },
  candidates: [
    { content: { role: 'model' }, finishReason: 'MAX_TOKENS', index: 0 }
  ],
  modelVersion: 'gemini-2.5-flash',
  responseId: 'U_olacD_NoGA7M8P8JLH4A0',
  usageMetadata: { promptTokenCount: 215, totalTokenCount: 726 }
};

// Import the extract function from the route file by requiring it via ts-node is not trivial here,
// so replicate the minimal extraction logic similar to route's function for unit test.

function extractTextFromResponse(response) {
  if (!response) return { text: '', truncated: false };
  if (typeof response === 'string') return { text: response, truncated: false };
  if (response.text && typeof response.text === 'string') return { text: response.text, truncated: response.finishReason === 'MAX_TOKENS' || false };

  const extractFromContent = (content) => {
    if (!content) return null;
    if (typeof content === 'string') return content;
    if (typeof content.text === 'string' && content.text.trim().length) return content.text;
    if (Array.isArray(content.parts) && content.parts.length) return content.parts.join('');
    if (Array.isArray(content) && content.length) {
      const first = content[0];
      if (typeof first === 'string') return first;
      if (first && typeof first.text === 'string') return first.text;
      if (first && Array.isArray(first.parts)) return first.parts.join('');
    }
    if (content.content && Array.isArray(content.content) && content.content[0]) {
      const c0 = content.content[0];
      if (typeof c0 === 'string') return c0;
      if (c0 && typeof c0.text === 'string') return c0.text;
      if (c0 && Array.isArray(c0.parts)) return c0.parts.join('');
    }
    return null;
  };

  if (response.output && Array.isArray(response.output) && response.output[0]) {
    const first = response.output[0];
    const t = extractFromContent(first);
    if (t) return { text: t, truncated: response.finishReason === 'MAX_TOKENS' || first.finishReason === 'MAX_TOKENS' || false };
  }

  let truncated = response.finishReason === 'MAX_TOKENS';
  if (response.candidates && Array.isArray(response.candidates) && response.candidates.length) {
    for (const c of response.candidates) {
      if (c && c.finishReason === 'MAX_TOKENS') truncated = true;
      if (typeof c.output === 'string' && c.output.trim().length) return { text: c.output, truncated };
      const t = extractFromContent(c.content) || extractFromContent(c);
      if (t) return { text: t, truncated };
    }
  }

  const fallback = (() => {
    try {
      if (response.candidates) return JSON.stringify(response.candidates);
      if (response.output) return JSON.stringify(response.output);
      return JSON.stringify(response);
    } catch (e) { return '' }
  })();

  return { text: fallback, truncated };
}

console.log('--- Test extractTextFromResponse ---');
const res = extractTextFromResponse(sample);
console.log('Extracted text (length):', res.text.length);
console.log('Extracted text (snippet):', res.text.slice(0, 200));
console.log('Truncated:', res.truncated);
console.log('--- End ---');
