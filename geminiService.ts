
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FileData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `You are the "Lab Interpreter" specialized document analyst for "LabLens".
Your goal is to perform a 100% data grounding scan of clinical reports and provide a high-end, humanized summary.

STRICT TONE & JARGON RULES:
- NEVER use technical jargon like "metabolic markers", "clinical profile", "optimized", "indexing", "grounding", or "data objects".
- Use friendly, conversational language (e.g., "Reading your labs..." or "Your blood sugar is a bit higher than we'd like").
- PREFERRED PHRASES: Above the target range, A focus area for your next checkup, Developing trend, Room for optimization.
- PROHIBITED WORDS: critical, urgent, immediate attention, notably high, dangerously, alarming, abnormal, bad.
- FORMATTING: NEVER use bolding (**), hash symbols (#), or quotation marks (", ') inside any text field.
- Output ONLY plain text sentences.

INTELLIGENCE VERDICT (Executive Summary):
- Must be EXACTLY TWO sentences.
- Sentence 1: A big win (e.g., "Your heart health results look fantastic and show great progress").
- Sentence 2: A big focus (e.g., "For your next goal, let’s focus on bringing your blood sugar levels down into a more comfortable range").

PREP FOR MY VISIT (QUESTIONS FOR MY DOCTOR):
- Generate 3-4 simple questions written in the FIRST PERSON ("I", "My").
- Tone: Natural, conversational patient seeking advice.
- Question field: E.g., "Since my sugar is a bit high, what are the first few food changes you'd like me to try?"
- Why field: Rename this logically to "Why this helps". E.g., "To help me make the most effective changes to my diet right away."

Output MUST be strictly valid JSON.`;

export const analyzeReports = async (latest: FileData, previous?: FileData): Promise<AnalysisResult> => {
  const model = 'gemini-3-flash-preview';
  
  const contents: any[] = [
    { text: `Analyze the medical report. ${previous ? "Compare with the past record for trends." : "Single report analysis."} 
    Focus on extracting patient metadata and clinical results accurately without using technical jargon.` },
    {
      inlineData: {
        data: latest.base64,
        mimeType: latest.mimeType
      }
    }
  ];

  if (previous) {
    contents.push({ text: "PREVIOUS REPORT:" });
    contents.push({
      inlineData: {
        data: previous.base64,
        mimeType: previous.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          age: { type: Type.STRING },
          gender: { type: Type.STRING },
          collectionDate: { type: Type.STRING },
          labId: { type: Type.STRING },
          hospitalName: { type: Type.STRING },
          doctorName: { type: Type.STRING },
          summary: { type: Type.STRING },
          bottomLine: {
            type: Type.OBJECT,
            properties: {
              main: { type: Type.STRING },
              good: { type: Type.ARRAY, items: { type: Type.STRING } },
              watch: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["main", "good", "watch"]
          },
          executiveSummary: { type: Type.STRING },
          biomarkers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                currentValue: { type: Type.NUMBER },
                previousValue: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['high', 'low', 'normal'] },
                range: { type: Type.STRING },
                analogy: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["name", "currentValue", "unit", "status", "range", "analogy", "explanation"]
            }
          },
          lifestyle: {
            type: Type.OBJECT,
            properties: {
              diet: { type: Type.STRING },
              sleep: { type: Type.STRING },
              exercise: { type: Type.STRING }
            }
          },
          doctorQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                why: { type: Type.STRING }
              },
              required: ["question", "why"]
            }
          }
        },
        required: ["summary", "bottomLine", "executiveSummary", "biomarkers", "lifestyle", "doctorQuestions"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const chatWithContext = async (
  message: string, 
  history: {role: string, content: string}[], 
  context: AnalysisResult
) => {
  const model = 'gemini-3-flash-preview';
  
  const chatSystemInstruction = `You are the LabLens expert nurse. 
You have FULL ACCESS to the patient's analyzed report data:
- Patient: ${context.patientName || 'Unknown'} (${context.gender || 'N/A'}, Age: ${context.age || 'N/A'})
- Clinic: ${context.hospitalName || 'N/A'}
- Report Date: ${context.collectionDate || 'N/A'}
- Biomarkers: ${context.biomarkers.map(b => `${b.name}: ${b.currentValue} ${b.unit} (Ref: ${b.range})`).join(', ')}

STRICT BEHAVIOR RULES:
1. DATA AWARENESS: Never say "I do not have your report" or "I can't see your data". You can see everything listed above.
2. WHICH LAB?: If asked "Which lab?", reply with the clinic name (${context.hospitalName}) and date (${context.collectionDate}), and mention you've analyzed the specific markers found (e.g. ${context.biomarkers.slice(0, 3).map(b => b.name).join(', ')}).
3. ANXIETY HANDLING (Am I in trouble?): Do not give a simple "Yes/No". Be empathetic. Balance focus areas with wins. Example: "I can see why those numbers might look high, but let’s look at the full picture. Your heart health markers are actually in a great place, which is a big win. Your blood sugar is the main area we should talk about with your doctor to get it back on track."
4. TONE: Friendly, clear, conversational. No jargon. No bolding. No quotes.
5. GROUNDING: Strictly use the provided results. Do not speculate on conditions not supported by the data.`;

  const chat = ai.chats.create({
    model,
    history: history.map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content) }]
    })),
    config: {
      systemInstruction: chatSystemInstruction,
    }
  });
  return await chat.sendMessageStream({ message });
};
