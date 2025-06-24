import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getSummary(text: string): Promise<string> {
  const prompt = `Summarize in ≤ 30 words:\n\n${text}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.7,
  });
  return response.choices[0]?.message.content?.trim() || '';
}
