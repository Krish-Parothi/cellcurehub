'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function enhanceTechnicianNotes(notes: string) {
  if (!notes || notes.trim() === '') {
    return { success: false, error: 'Notes are empty' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Gemini API key is not configured in .env' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash-lite as requested by the user
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are an AI assistant for a mobile repair shop. 
A technician has written some rough diagnostic notes (RCA). 
Your task is to rewrite these notes strictly into the following format using bullet points, keeping tokens minimal and concise:

Problems identified:
- [point 1]
- [point 2]

Repairs done:
- [point 1]
- [point 2]

Do not add new issues not mentioned. Do not use conversational filler.

Technician notes:
${notes}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text().trim();

    return { success: true, text: enhancedText };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return { success: false, error: error.message || 'Failed to enhance notes using AI' };
  }
}
