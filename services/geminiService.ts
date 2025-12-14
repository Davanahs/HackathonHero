import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectIdea, RoadmapPhase, TeamPlan } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';

/**
 * Generates a list of project ideas based on 3 specific inputs.
 */
export const generateIdeaOptions = async (
  interests: string,
  tech: string,
  frustration: string
): Promise<ProjectIdea[]> => {
  const prompt = `I need 3 distinct hackathon ideas based on:
    1. Interests: ${interests}
    2. Loved Tech: ${tech}
    3. Real-world Frustration: ${frustration}
    
    Generate 3 unique, feasible, and impressive MVP ideas for a 24-hour hackathon.
    For each, provide a title, problem, audience, and core features.`;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        problem: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        coreFeatures: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        },
        techStackRecommendation: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
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

  if (response.text) {
    return JSON.parse(response.text) as ProjectIdea[];
  }
  throw new Error("Failed to generate ideas");
};

/**
 * Refines a single raw idea.
 */
export const refineProjectIdea = async (rawInput: string): Promise<ProjectIdea> => {
  const prompt = `Refine this hackathon idea: "${rawInput}". 
       Structure it clearly, defining the exact problem, audience, and core features feasible in 24-48 hours.`;

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

  if (response.text) {
    return JSON.parse(response.text) as ProjectIdea;
  }
  throw new Error("Failed to refine idea");
};

/**
 * Generates a "Looking for Team" post for social media/Discord.
 */
export const generateTeammatePost = async (
  skills: string,
  interests: string,
  ideaSummary?: string
): Promise<string> => {
  const prompt = `Write a catchy "Looking for Team" post for a Hackathon Discord server.
  My Skills: ${skills}
  My Interests: ${interests}
  ${ideaSummary ? `My Idea: ${ideaSummary}` : "I am looking to join a team."}
  
  Make it friendly, professional, and emphasize collaboration. Use emojis.`;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
  });

  return response.text || "Could not generate post.";
};

/**
 * Generates roles based on team type and project idea.
 */
export const generateTeamRoles = async (
  isSolo: boolean,
  idea: ProjectIdea,
  teamSize?: number
): Promise<TeamPlan> => {
  const prompt = `Create a team role breakdown for a hackathon project titled "${idea.title}".
    Context: ${idea.problem}
    Mode: ${isSolo ? "Solo Developer" : `Team of ${teamSize || 3}`}.
    
    Explain the core roles (Frontend, Backend, Design/UX, Pitch/Product) relative to this specific project.
    If Solo, explain how to wear all hats.`;

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
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as TeamPlan;
  }
  throw new Error("Failed to generate team roles");
};

/**
 * Generates a roadmap schedule.
 */
export const generateRoadmap = async (
  duration: '24h' | '48h',
  idea: ProjectIdea
): Promise<RoadmapPhase[]> => {
  const prompt = `Create a highly technical ${duration} hackathon roadmap for "${idea.title}".
    Features: ${idea.coreFeatures.join(', ')}.
    
    Structure strictly into these 4 phases:
    1. Phase 1: Setup & Data Schema (Hours 0-4)
    2. Phase 2: Core API & Logic (Hours 4-${duration === '24h' ? '16' : '32'})
    3. Phase 3: UI Integration & Styling (Hours ${duration === '24h' ? '16-20' : '32-40'})
    4. Phase 4: Polish & Deployment (Hours ${duration === '24h' ? '20-24' : '40-48'})
    
    CRITICAL INSTRUCTION: Be extremely specific and technical. Do not give generic advice like "Plan the app".
    Instead, say "Initialize React app with Vite and set up Tailwind", "Create MongoDB Schema for User", "Build POST /api/v1/auth endpoint".
    
    For each task:
    - Prefix the title with the role: [Frontend], [Backend], [Design], or [Fullstack].
    - In the description, name specific libraries or commands to use.`;

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
              id: { type: Type.STRING },
              time: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING, description: "Technical instruction" },
              completed: { type: Type.BOOLEAN }
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
    const phases = JSON.parse(response.text) as RoadmapPhase[];
    return phases.map((phase, pIdx) => ({
      ...phase,
      tasks: phase.tasks.map((task, tIdx) => ({
        ...task,
        id: `p${pIdx}_t${tIdx}`,
        completed: false
      }))
    }));
  }
  throw new Error("Failed to generate roadmap");
};

/**
 * Generates code for a specific task.
 */
export const generateCodeForTask = async (taskTitle: string, taskDesc: string, idea: ProjectIdea): Promise<string> => {
  const prompt = `Write the code implementation for the following hackathon task.
    Project: ${idea.title} (${idea.coreFeatures.join(', ')})
    Task: ${taskTitle}
    Details: ${taskDesc}
    
    Provide the code in a single Markdown block (e.g. \`\`\`tsx ... \`\`\`).
    If multiple files are needed, combine them clearly or choose the most critical file.
    Do not add excessive explanation, just the code.`;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
  });

  return response.text || "// Could not generate code.";
};

/**
 * Mentor Chat stream.
 */
export const createMentorChat = (idea: ProjectIdea) => {
  const chat = ai.chats.create({
    model: MODEL_FAST,
    config: {
      systemInstruction: `You are a senior hackathon mentor. 
      The user is building "${idea.title}".
      Provide short, sharp, and highly technical advice. 
      Prioritize speed and "hacky" but working solutions.`
    }
  });
  return chat;
};