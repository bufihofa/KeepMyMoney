export interface AISettings {
  apiKey: string;
  model: string;
  endpoint: string;
}

export interface ReceiptCategoryOption {
  id: string;
  name: string;
}

export interface ReceiptItemDraft {
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  category_id: string;
}

export interface ReceiptExtractionResult {
  merchant: string;
  items: ReceiptItemDraft[];
  occurredAt?: string;
  rawText: string;
}

const AI_SETTINGS_KEY = 'kmm.ai.settings.v1';

const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: '',
  model: 'moonshotai/kimi-k2.5',
  endpoint: 'https://nano-gpt.com/api/v1/messages',
};

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      apiKey: String(parsed.apiKey ?? ''),
      model: String(parsed.model ?? DEFAULT_AI_SETTINGS.model),
      endpoint: String(parsed.endpoint ?? DEFAULT_AI_SETTINGS.endpoint),
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function setAISettings(value: AISettings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(value));
}

function extractAssistantText(json: unknown): string {
  const content = Array.isArray((json as { content?: unknown[] })?.content)
    ? ((json as { content: unknown[] }).content as Array<{ type?: string; text?: string }>)
    : [];

  return content
    .filter((block) => block?.type === 'text' && typeof block?.text === 'string')
    .map((block) => block.text as string)
    .join('\n')
    .trim();
}

function readErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message.trim();
  }

  const error = record.error;
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === 'object') {
    const nested = error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message.trim();
    }
    if (typeof nested.error === 'string' && nested.error.trim()) {
      return nested.error.trim();
    }
  }

  return null;
}

async function readResponsePayload(res: Response): Promise<{ json: unknown | null; text: string }> {
  const contentType = (res.headers.get('content-type') ?? '').toLowerCase();

  if (contentType.includes('application/json')) {
    try {
      const json = (await res.json()) as unknown;
      return { json, text: '' };
    } catch {
      const text = await res.text();
      return { json: null, text };
    }
  }

  const text = await res.text();
  if (!text.trim()) {
    return { json: null, text: '' };
  }

  try {
    const json = JSON.parse(text) as unknown;
    return { json, text };
  } catch {
    return { json: null, text };
  }
}

function stripCodeFence(text: string) {
  return text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

function extractJsonChunk(text: string) {
  const s = text.trim();
  const starts = [s.indexOf('['), s.indexOf('{')].filter((x) => x >= 0);
  if (!starts.length) return s;
  return s.slice(Math.min(...starts)).trim();
}

function closeMissingBrackets(text: string) {
  let inStr = false;
  let escaped = false;
  let square = 0;
  let curly = 0;

  for (const ch of text) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '[') square += 1;
    if (ch === ']') square = Math.max(0, square - 1);
    if (ch === '{') curly += 1;
    if (ch === '}') curly = Math.max(0, curly - 1);
  }

  return text + ']'.repeat(square) + '}'.repeat(curly);
}

function repairJsonText(raw: string) {
  let s = stripCodeFence(raw);
  s = extractJsonChunk(s);
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/,\s*([}\]])/g, '$1');
  s = closeMissingBrackets(s);
  return s.trim();
}

function safeParseReceipt(rawText: string): { merchant: string; occurredAtRaw?: string; items: Array<Record<string, unknown>> } {
  const tries = [rawText, stripCodeFence(rawText), repairJsonText(rawText)];

  for (const attempt of tries) {
    try {
      const parsed = JSON.parse(attempt) as unknown;
      if (Array.isArray(parsed)) {
        return { merchant: '', items: parsed as Array<Record<string, unknown>> };
      }
      const obj = parsed as {
        merchant?: unknown;
        occurred_at?: unknown;
        purchased_at?: unknown;
        receipt_time?: unknown;
        datetime?: unknown;
        items?: unknown;
      };
      if (Array.isArray(obj?.items)) {
        return {
          merchant: typeof obj.merchant === 'string' ? obj.merchant : '',
          occurredAtRaw:
            typeof obj.occurred_at === 'string'
              ? obj.occurred_at
              : typeof obj.purchased_at === 'string'
                ? obj.purchased_at
                : typeof obj.receipt_time === 'string'
                  ? obj.receipt_time
                  : typeof obj.datetime === 'string'
                    ? obj.datetime
                    : undefined,
          items: obj.items as Array<Record<string, unknown>>,
        };
      }
    } catch {
      // continue next attempt
    }
  }

  throw new Error('LLM response is not valid JSON items.');
}

function normalizeInvoiceDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (!value) return undefined;

  const asIso = new Date(value);
  if (!Number.isNaN(asIso.getTime())) {
    return asIso.toISOString();
  }

  const match = value.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:[ T](\d{1,2}):(\d{1,2}))?$/);
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const yearRaw = Number(match[3]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function parseLooseNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value !== 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const raw = value.trim();
  if (!raw) return fallback;

  const compact = raw.replace(/\s+/g, '').replace(/[^0-9,.-]/g, '');
  const hasComma = compact.includes(',');
  const hasDot = compact.includes('.');

  let normalized = compact;
  if (hasComma && hasDot) {
    normalized = compact.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    normalized = compact.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickCategoryId(input: Record<string, unknown>, categories: ReceiptCategoryOption[]) {
  const directId = typeof input.category_id === 'string' ? input.category_id.trim() : '';
  if (directId && categories.some((c) => c.id === directId)) return directId;

  const byName = typeof input.category_name === 'string' ? normalizeText(input.category_name) : '';
  if (byName) {
    const found = categories.find((c) => normalizeText(c.name) === byName);
    if (found) return found.id;
  }

  const fallback = categories.find((c) => normalizeText(c.name).includes('khac') || c.id === 'cat_other');
  return fallback?.id ?? categories[0]?.id ?? 'cat_other';
}

function normalizeItems(items: Array<Record<string, unknown>>, categories: ReceiptCategoryOption[]): ReceiptItemDraft[] {
  return items.map((item) => {
    const quantity = parseLooseNumber(item.quantity, 1) || 1;
    const unitPrice = parseLooseNumber(item.unit_price, 0);
    const amountRaw = parseLooseNumber(item.amount ?? item.total ?? item.line_total ?? item.total_price ?? 0, 0);
    const amount = amountRaw > 0 ? amountRaw : quantity * unitPrice;

    return {
      name: String(item.name || 'Item'),
      quantity,
      unit_price: unitPrice,
      amount,
      category_id: pickCategoryId(item, categories),
    };
  });
}

export async function extractReceiptItemsWithLLM(input: {
  imageBase64: string;
  mediaType: string;
  settings: AISettings;
  categories: ReceiptCategoryOption[];
}): Promise<ReceiptExtractionResult> {
  const { imageBase64, mediaType, settings, categories } = input;
  const categoryList = categories.map((c) => `- ${c.id}: ${c.name}`).join('\n');
  const prompt = [
    'Extract receipt line items and return JSON only.',
    'Output must be JSON object: {"merchant":"...","occurred_at":"...","items":[...]}.',
    'occurred_at should be invoice datetime in ISO 8601 if readable, else empty string.',
    'Each item requires: name, quantity, unit_price, amount, category_id.',
    'category_id must be one of this list:',
    categoryList,
    'Do not wrap in markdown fences.',
  ].join('\n');

  const payload = {
    model: settings.model,
    max_tokens: 1200,
    stream: false,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  const res = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${settings.apiKey}`,
      'x-api-key': settings.apiKey,
    },
    body: JSON.stringify(payload),
  });

  const { json, text } = await readResponsePayload(res);
  if (!res.ok) {
    const message =
      readErrorMessage(json) ||
      (text.trim() ? text.trim() : '') ||
      `AI request failed (${res.status})`;
    throw new Error(message);
  }

  if (!json) {
    throw new Error('AI server did not return JSON response.');
  }

  const rawText = extractAssistantText(json);
  if (!rawText) {
    throw new Error('LLM did not return text content.');
  }

  const parsed = safeParseReceipt(rawText);
  return {
    merchant: parsed.merchant,
    occurredAt: normalizeInvoiceDate(parsed.occurredAtRaw),
    items: normalizeItems(parsed.items, categories),
    rawText,
  };
}
