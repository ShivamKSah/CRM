import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './config/env.js';

export const genAI = new GoogleGenerativeAI(env.geminiApiKey);
export const GEMINI_MODEL = 'gemini-2.5-flash';
