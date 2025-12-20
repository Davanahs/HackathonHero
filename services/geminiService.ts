import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectIdea, RoadmapPhase, TeamPlan } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Update to the latest recommended models
const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

/**
 * Generates project ideas with a focus on practical feasibility.
 */
export const generateIdeaOptions = async (
  interests: string,
  tech: string,
  frustration: string
): Promise<ProjectIdea[]> => {
  const prompt = `I need 3 distinct hackathon ideas based on:
    1. Interests: ${interests}
    2. Loved Tech: ${tech}
    3. Frustration: ${frustration}
    
    CRITICAL: Only suggest ideas that can be built as a working MVP in 24 hours. 
    Focus on simple CRUD apps, specialized dashboards, or API-first tools.
    Provide a title, problem, audience, and 3-4 specific features.`;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        problem: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        coreFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        techStackRecommendation: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "problem", "targetAudience", "coreFeatures"]
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  return response.text ? JSON.parse(response.text) : [];
};

/**
 * Refines a project idea into a practical execution plan.
 */
export const refineProjectIdea = async (rawInput: string, devPrefs?: string): Promise<ProjectIdea> => {
  const prompt = `Convert this rough idea into a practical MVP plan: "${rawInput}". 
       ${devPrefs ? `TECHNICAL PREFERENCES: ${devPrefs}` : ""}
       Strip away theoretical fluff. Define the core loop and only the features needed for a winning demo.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      problem: { type: Type.STRING },
      targetAudience: { type: Type.STRING },
      coreFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
      techStackRecommendation: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "problem", "targetAudience", "coreFeatures"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  const idea = response.text ? JSON.parse(response.text) : null;
  if (idea) idea.developerPreferences = devPrefs;
  return idea;
};

/**
 * Generates a roadmap focused on practical, executable tasks.
 */
export const generateRoadmap = async (
  duration: '24h' | '48h',
  idea: ProjectIdea
): Promise<RoadmapPhase[]> => {
  const prompt = `Create a PRACTICAL technical roadmap for "${idea.title}".
    ${idea.developerPreferences ? `TECHNICAL STYLE PREFERENCES: ${idea.developerPreferences}` : ""}
    
    CRITICAL: For the first phase, include EXPLICIT and DETAILED website creation steps.
    Example of a GOOD first phase:
    1. "Initialize Next.js with Lucide Icons and Tailwind Config"
    2. "Define global colors in globals.css following the brand palette"
    3. "Scaffold the main Layout.tsx with a Sidebar and Header"
    4. "Setup Database Schema in Prisma/Supabase"
    
    RULES:
    1. Tasks must be ACTIONABLE code-focused steps.
    2. Provide the EXACT command or library to use in the description.
    
    Phases:
    1. Skeleton & Tools (Hours 0-4)
    2. Data & Business Logic (Hours 4-${duration === '24h' ? '12' : '24'})
    3. UI Layout & State (Hours ${duration === '24h' ? '12-20' : '24-40'})
    4. Finishing & Deployment (Final 4 hours)`;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        phaseName: { type: Type.STRING },
        duration: { type: Type.STRING },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["phaseName", "tasks"]
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  if (response.text) {
    const rawPhases = JSON.parse(response.text) as RoadmapPhase[];
    return rawPhases.map((phase, pIdx) => ({
      ...phase,
      tasks: phase.tasks.map((task, tIdx) => ({
        ...task,
        id: `p${pIdx}_t${tIdx}`,
        completed: false,
        time: ""
      }))
    }));
  }
  return [];
};

/**
 * Generates practical code snippets for technical tasks using the Pro model for complex logic.
 */
export const generateCodeForTask = async (taskTitle: string, taskDesc: string, idea: ProjectIdea): Promise<string> => {
  const prompt = `Write a PRACTICAL implementation for: ${taskTitle}.
    Context: ${idea.title}.
    Details: ${taskDesc}.
    ${idea.developerPreferences ? `MANDATORY CODING STYLE: ${idea.developerPreferences}` : ""}
    
    Output ONLY code. No explanations. Use standard, beginner-friendly libraries unless preferences say otherwise.`;

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: prompt,
  });

  return response.text || "// Error generating code.";
};

/**
 * Creates a mentor chat session using the Pro model for advanced reasoning.
 */
export const createMentorChat = (idea: ProjectIdea) => {
  return ai.chats.create({
    model: MODEL_PRO,
    config: {
      systemInstruction: `You are a practical hackathon mentor. 
      The user is building "${idea.title}".
      ${idea.developerPreferences ? `THE USER PREFERS THIS TECHNICAL STYLE: ${idea.developerPreferences}` : ""}
      RULES:
      1. Give technical code solutions, not theory.
      2. Recommend standard libraries unless preferences specify otherwise.
      3. If they ask a complex question, simplify it into a 15-minute hack.`
    }
  });
};

export const generateTeammatePost = async (skills: string, interests: string, ideaSummary?: string): Promise<string> => {
  const prompt = `Write a short Discord post: I have skills in ${skills}, looking to join or build a project about ${interests}. ${ideaSummary ? `Current idea: ${ideaSummary}` : ""}`;
  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
  return response.text || "";
};

export const generateTeamRoles = async (isSolo: boolean, idea: ProjectIdea, teamSize?: number): Promise<TeamPlan> => {
  const prompt = `Roles for "${idea.title}" (${isSolo ? "Solo" : "Team of " + teamSize}). Describe 3-4 practical roles.`;
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isSolo: { type: Type.BOOLEAN },
      roles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            roleName: { type: Type.STRING },
            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }
  };
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: responseSchema }
  });
  return response.text ? JSON.parse(response.text) : { isSolo, roles: [] };
};