import { InvoiceData } from '../invoiceHTML';
import { mapFactureToInvoiceData } from './htmlService';

/**
 * Generate professional invoice HTML using the Mistral model via OpenRouter.
 * The environment variable OPENROUTER_API_KEY must be set.
 */
export async function generateMistralHTML(facture: any): Promise<string> {
  const invoiceData: InvoiceData = mapFactureToInvoiceData(facture);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY env var missing');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-small-3.2-24b-instruct:free',
      messages: [
        {
          role: 'system',
          content: 'Generate a professional French invoice in HTML using the provided JSON data.'
        },
        {
          role: 'user',
          content: JSON.stringify(invoiceData)
        }
      ]
    })
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${msg}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}
