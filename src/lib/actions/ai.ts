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
    // Use gemini-1.5-flash as it's fast and suitable for this text transformation
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI assistant for a mobile repair shop. 
A technician has written some rough diagnostic notes (RCA - Root Cause Analysis) about a customer's device. 
Your task is to rewrite these notes into a professional, clear, and customer-friendly format. 
Correct any grammar or spelling mistakes. 
Do not add any new technical issues that aren't mentioned in the original notes.
Keep it concise and polite. Do not include any conversational filler like "Here is the rewritten text". Just output the rewritten notes.

Original Technician Notes:
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
