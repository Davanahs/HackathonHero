import { GoogleGenAI, Type } from "@google/genai";
import { ProjectIdea, RoadmapPhase, TeamPlan } from "../types";

const DAILY_LIMIT = 20;
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Tracks and limits usage per user to protect the shared API key.
 * Only applies when using the shared process.env.API_KEY.
 */
const checkAndIncrementUsage = (isCustomKey: boolean) => {
  if (isCustomKey) return; // Bypass limit for custom keys

  const today = new Date().toDateString();
  const storedData = localStorage.getItem('hackerhero_usage_tracker');
  
  let usage = storedData ? JSON.parse(storedData) : { date: today, count: 0 };

  // Reset counter if it's a new day
  if (usage.date !== today) {
    usage = { date: today, count: 0 };
  }

  if (usage.count >= DAILY_LIMIT) {
    throw new Error("LIMIT_EXCEEDED");
  }

  usage.count++;
  localStorage.setItem('hackerhero_usage_tracker', JSON.stringify(usage));
};

/**
 * Gets the most appropriate API Key.
 * Returns null if no key is available.
 */
export const getActiveKey = () => {
  const customKey = localStorage.getItem('hackerhero_custom_key');
  const isCustom = !!(customKey && customKey.trim() !== '');
  const apiKey = isCustom ? customKey!.trim() : process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  // Only check usage limits if we are NOT using a custom key
  if (!isCustom) {
    checkAndIncrementUsage(isCustom);
  }
  
  return apiKey;
};

// Internal helper for initialization
const getAIClient = () => {
  const apiKey = getActiveKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

export const generateIdeaOptions = async (
  interests: string,
  tech: string,
  frustration: string
): Promise<ProjectIdea[]> => {
  const ai = getAIClient();
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
        recipeName: { type: Type.STRING },
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
    model: MODEL_NAME,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text ? JSON.parse(response.text) : [];
};

export const refineProjectIdea = async (rawInput: string, devPrefs?: string): Promise<ProjectIdea> => {
  const ai = getAIClient();
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
    model: MODEL_NAME,
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
  teamPlan: TeamPlan
): Promise<RoadmapPhase[]> => {
  const ai = getAIClient();
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
    model: MODEL_NAME,
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

export const generateCodeForTask = async (taskTitle: string, taskDesc: string, idea: ProjectIdea): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Write high-quality, executable source code for the task: "${taskTitle}". 
  Task Details: ${taskDesc}. 
  Project Context: Building "${idea.title}". 
  
  FORMAT RULES:
  1. Provide ONLY the raw source code. 
  2. DO NOT include markdown backticks (\`\`\`).
  3. DO NOT include any introductory or concluding text. 
  4. Use clear comments for explanation within the code itself.`;
  
  const response = await ai.models.generateContent({ 
    model: MODEL_NAME, 
    contents: [{ parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });
  return response.text || "// Error generating code.";
};

export const createMentorChat = (idea: ProjectIdea) => {
  const ai = getAIClient();
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `You are a practical senior software engineer and hackathon mentor. 
      The user is building: "${idea.title}". 
      Context: ${idea.problem}.
      
      STRICT COMMUNICATION STYLE:
      1. Use Markdown for structured responses.
      2. Use **bold** for key technical terms or headers.
      3. Use bullet points for steps/lists.
      4. wrap all code snippets in triple backticks (\`\`\`).
      5. Organize your response into:
         - **Observation**: Quick assessment.
         - **Actionable Steps**: Bullet points of what to do.
         - **Code snippet**: If applicable.
         - **Pro-Tip**: A hackathon-specific shortcut.
      6. Focus 100% on high-velocity MVP building.`,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
};

export const generateTeammatePost = async (skills: string, interests: string, ideaSummary?: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Write a short Discord post: I have skills in ${skills}, looking to join or build a project about ${interests}. ${ideaSummary ? `Current idea: ${ideaSummary}` : ""}`;
  const response = await ai.models.generateContent({ 
    model: MODEL_NAME, 
    contents: [{ parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });
  return response.text || "";
};

export const generateTeamRoles = async (isSolo: boolean, idea: ProjectIdea, teamSize?: number): Promise<TeamPlan> => {
  const ai = getAIClient();
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
    model: MODEL_NAME,
    contents: [{ parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json", 
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text ? JSON.parse(response.text) : { isSolo, roles: [] };
};