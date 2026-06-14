export function parseJsonFromText(text: string): any {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON from AI response:', text);
    throw new Error('Invalid JSON format from AI');
  }
}
