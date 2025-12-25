import { GoogleGenAI, Type } from "@google/genai";
import { Task, TeamMember, Assignment, Module, Team } from "../types";

export const analyzeTaskCompletion = async (
  task: Task,
  assignments: Assignment[],
  members: TeamMember[],
  module: Module,
  teams: Team[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const context = {
    task: {
      title: task.title,
      priority: task.priority,
      deadline: task.due_date,
      status: task.status,
    },
    module: {
      name: module.name,
    },
    resources: assignments.map(a => {
      const member = members.find(m => m.id === a.member_id);
      return {
        name: member?.name,
        assigned_hours: a.assigned_hours,
        capacity: member?.capacity_hours_per_week,
        experience: member?.experience_level,
        performance_history: member?.historical_performance,
      };
    })
  };

  const prompt = `
    As a Senior Project Manager and Resource Analyst, evaluate the feasibility of this project task.
    
    Context:
    ${JSON.stringify(context, null, 2)}
    
    Instructions:
    1. Assess if the assigned resources (hours and skills) match the task priority and deadline.
    2. Identify risks (e.g., over-capacity, lack of senior oversight, historical performance issues).
    3. Provide a feasibility score (0-100).
    4. Suggest optimizations.
    
    Return the analysis in a structured JSON format.
  `;

  try {
    // Upgraded to gemini-3-pro-preview for advanced reasoning and optimization tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feasibility_score: { type: Type.NUMBER, description: "A score from 0-100" },
            summary: { type: Type.STRING },
            risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["feasibility_score", "summary", "risks", "recommendations"]
        }
      }
    });

    // Added safety check for response.text and trimmed whitespace
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      feasibility_score: 0,
      summary: "Failed to perform AI analysis due to an error.",
      risks: ["Analysis Engine Offline"],
      recommendations: ["Manually review assignments"]
    };
  }
};