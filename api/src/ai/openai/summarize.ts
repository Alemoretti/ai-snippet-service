import { OpenAI } from 'openai';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function getSummary(text: string): Promise<string> {
  const client = getOpenAI();
  const prompt = `Summarize in ≤ 30 words:\n\n${text}`;
  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.7,
  });
  return response.choices[0]?.message.content?.trim() ?? '';
}
