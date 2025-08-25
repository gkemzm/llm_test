// app/api/router/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  // 1) Gemini Free
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const m = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const r = await m.generateContent(prompt);
    return NextResponse.json({ text: r.response.text(), provider: "gemini" });
  } catch {}

  // 2) Local (LM Studio or Ollama)
  try {
    const base = process.env.LMSTUDIO_URL ?? "http://localhost:1234/v1";
    const client = new OpenAI({ baseURL: base, apiKey: "local" });
    const r = await client.chat.completions.create({
      model: process.env.LMSTUDIO_MODEL ?? "llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
    });
    return NextResponse.json({
      text: r.choices[0].message?.content,
      provider: "local",
    });
  } catch {}

  // 3) 폴백: GPT-5.0
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const r = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
  });
  return NextResponse.json({
    text: r.choices[0].message?.content,
    provider: "gpt-5",
  });
}
