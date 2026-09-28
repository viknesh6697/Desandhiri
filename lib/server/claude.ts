import Anthropic from "@anthropic-ai/sdk";

export function anthropicKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() || "";
}

export async function complete(prompt: string) {
  const apiKey = anthropicKey();
  if (!apiKey) {
    throw new Error(
      "Custom trips need ANTHROPIC_API_KEY on the server. Kashmir, Kerala, and Rajasthan work without it.",
    );
  }
  const client = new Anthropic({ apiKey, timeout: 50_000 });
  try {
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) throw new Error("The model returned an empty response.");
    return text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(error.message || "Claude could not complete that request.");
    }
    throw error;
  }
}
