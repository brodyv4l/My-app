/**
 * Extract loggable foods from AI chat replies with full macros.
 */
const MODEL = 'claude-haiku-4-5-20251001';

export function stripMarkdownBold(text) {
  return String(text || '').replace(/\*\*(.*?)\*\*/g, '$1');
}

function normalizeFood(f, i) {
  if (!f) return null;
  const name = String(f.name || '').trim();
  if (!name) return null;
  return {
    id: `ai-chat-food-${Date.now()}-${i}`,
    name,
    serving: f.serving_size || f.serving || '1 serving',
    calories: Math.max(0, Math.round(Number(f.calories) || 0)),
    protein: Math.max(0, Math.round((Number(f.protein) || 0) * 10) / 10),
    carbs: Math.max(0, Math.round((Number(f.carbs) || 0) * 10) / 10),
    fat: Math.max(0, Math.round((Number(f.fat) || 0) * 10) / 10),
    source: 'ai-chat',
  };
}

export async function extractFoodFromResponse(aiText) {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey || !aiText || !aiText.trim()) return [];

  const prompt = `Look at this nutrition advice text and extract any specific food items mentioned. For EACH food item you MUST include calories AND protein AND carbs AND fat — do not omit any of these four values. If the text doesn't give exact macros, estimate realistic values based on the food and serving size.

Text: "${aiText.replace(/"/g, "'")}"

If no specific foods mentioned return {"foods":[]}.

Return ONLY raw JSON in this EXACT structure with ALL four nutrition fields filled for every food:
{
  "foods": [
    {
      "name": "string",
      "serving_size": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Every food object must have all 6 fields. Never omit protein, carbs, or fat even if you have to estimate.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    const validatedFoods = (parsed.foods || []).map((food) => ({
      name: food.name || 'Unknown food',
      serving_size: food.serving_size || food.serving || '1 serving',
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    }));
    return validatedFoods.map(normalizeFood).filter(Boolean);
  } catch (e) {
    console.log('extractFoodFromResponse failed:', e?.message || e);
    return [];
  }
}
