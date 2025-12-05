import { GoogleGenAI, Type } from "@google/genai";
import { LeaveRequest } from "../types";

// Initialize the API client
// Note: In a real app, ensure process.env.API_KEY is set. 
// For this demo, we handle the missing key gracefully in the UI.
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateLeaveInsights = async (requests: LeaveRequest[]): Promise<string> => {
  if (!ai) {
    return "API Key not configured. Unable to generate AI insights.";
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Prepare data summary for the prompt
    const summary = requests.map(r => 
      `- ${r.userName} requested ${r.days} days for ${r.type} (${r.status}). Reason: ${r.reason}`
    ).join('\n');

    const prompt = `
      You are an HR Assistant for a Leave Management System.
      Analyze the following leave requests and provide a brief executive summary (max 3 sentences)
      highlighting any trends, potential staffing issues, or anomalies.
      
      Data:
      ${summary}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating insights. Please try again later.";
  }
};

export const checkPolicyCompliance = async (reason: string, days: number): Promise<{ compliant: boolean; message: string }> => {
    if (!ai) return { compliant: true, message: "AI checks disabled." };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this leave request. Reason: "${reason}", Duration: ${days} days. 
            Corporate Policy: Leave longer than 10 days requires detailed justification. Sick leave > 3 days requires a report.
            Return JSON: { "compliant": boolean, "message": string }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        compliant: { type: Type.BOOLEAN },
                        message: { type: Type.STRING }
                    }
                }
            }
        });
        
        const text = response.text;
        if(text) return JSON.parse(text);
        return { compliant: true, message: "Could not parse AI response." };

    } catch (e) {
        return { compliant: true, message: "AI Service unavailable." };
    }
}
