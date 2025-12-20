import { GoogleGenAI, Type } from "@google/genai";
import { ProjectIdea, RoadmapPhase, TeamPlan } from "../types";

// Helper to get the AI instance
const getAI = (customKey?: string | null) => {
  const apiKey = (customKey && customKey.trim() !== '') ? customKey.trim() : process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API_KEY_MISSING: No valid Gemini API key found. Please set it in Netlify env or App Settings.");
  }

  const cleanKey = apiKey.trim();
  // Debug log: Shows masked key to verify it is being picked up correctly
  console.log(`[GeminiService] Using Key: ${cleanKey.substring(0, 4)}...${cleanKey.substring(cleanKey.length - 4)}`);
  
  return new GoogleGenAI({ apiKey: cleanKey });
};

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

export const generateIdeaOptions = async (
  interests: string,
  tech: string,
  frustration: string,
  customKey?: string | null
): Promise<ProjectIdea[]> => {
  const ai = getAI(customKey);
  const prompt = `I need 3 distinct hackathon ideas based on:
    1. Interests: ${interests}
    2. Loved Tech: ${tech}
    3. Frustration: ${frustration}
    
    CRITICAL: Only suggest ideas that can be built as a working MVP in 24 hours. 
    Focus on simple CRUD apps, specialized dashboards, or API-first tools.
    Provide a title, problem, audience, and 3-4 specific features.`;

  const responseSchema = {
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
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text ? JSON.parse(response.text) : [];
};

export const refineProjectIdea = async (rawInput: string, devPrefs?: string, customKey?: string | null): Promise<ProjectIdea> => {
  const ai = getAI(customKey);
  const prompt = `Convert this rough idea into a practical MVP plan: "${rawInput}". 
       ${devPrefs ? `TECHNICAL PREFERENCES: ${devPrefs}` : ""}
       Strip away theoretical fluff. Define the core loop and only the features needed for a winning demo.`;

  const responseSchema = {
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
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const idea = response.text ? JSON.parse(response.text) : null;
  if (idea) idea.developerPreferences = devPrefs;
  return idea;
};

export const generateRoadmap = async (
  duration: '24h' | '48h',
  idea: ProjectIdea,
  teamPlan: TeamPlan,
  customKey?: string | null
): Promise<RoadmapPhase[]> => {
  const ai = getAI(customKey);
  const roleNames = teamPlan.roles.map(r => r.roleName).join(", ");
  
  const prompt = `Create a PRACTICAL technical roadmap for "${idea.title}".
    ${idea.developerPreferences ? `TECHNICAL STYLE PREFERENCES: ${idea.developerPreferences}` : ""}
    
    TEAM ROLES: ${roleNames}
    
    Phases:
    1. Skeleton & Tools (Hours 0-4)
    2. Data & Business Logic (Hours 4-${duration === '24h' ? '12' : '24'})
    3. UI Layout & State (Hours ${duration === '24h' ? '12-20' : '24-40'})
    4. Finishing & Deployment (Final 4 hours)

    CRITICAL: For every task, assign it to one or more of the specific roles provided in the TEAM ROLES list.`;

  const responseSchema = {
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
              assignedRoles: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "assignedRoles"]
          }
        }
      },
      required: ["phaseName", "tasks"]
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 }
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

export const generateCodeForTask = async (taskTitle: string, taskDesc: string, idea: ProjectIdea, customKey?: string | null): Promise<string> => {
  const ai = getAI(customKey);
  const prompt = `Write a PRACTICAL implementation for: ${taskTitle}. Context: ${idea.title}. Details: ${taskDesc}. Output ONLY code.`;
  const response = await ai.models.generateContent({ 
    model: MODEL_PRO, 
    contents: [{ parts: [{ text: prompt }] }] 
  });
  return response.text || "// Error generating code.";
};

export const createMentorChat = (idea: ProjectIdea, customKey?: string | null) => {
  const ai = getAI(customKey);
  return ai.chats.create({
    model: MODEL_PRO,
    config: {
      systemInstruction: `You are a practical hackathon mentor. User is building "${idea.title}".`
    }
  });
};

export const generateTeammatePost = async (skills: string, interests: string, ideaSummary?: string, customKey?: string | null): Promise<string> => {
  const ai = getAI(customKey);
  const prompt = `Write a short Discord post: I have skills in ${skills}, looking to join or build a project about ${interests}. ${ideaSummary ? `Current idea: ${ideaSummary}` : ""}`;
  const response = await ai.models.generateContent({ 
    model: MODEL_FAST, 
    contents: [{ parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });
  return response.text || "";
};

export const generateTeamRoles = async (isSolo: boolean, idea: ProjectIdea, teamSize?: number, customKey?: string | null): Promise<TeamPlan> => {
  const ai = getAI(customKey);
  const prompt = `Roles for "${idea.title}" (${isSolo ? "Solo" : "Team of " + teamSize}). Describe 3-4 practical roles.`;
  const responseSchema = {
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
    contents: [{ parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json", 
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text ? JSON.parse(response.text) : { isSolo, roles: [] };
};