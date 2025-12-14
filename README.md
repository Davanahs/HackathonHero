# HackathonHero

## 1. Information Architecture & UX

**Overall Flow:** Linear "Wizard" style for setup, followed by a Dashboard for execution.
1.  **Landing Page:** Value proposition -> Call to Action ("Start Your Hackathon").
2.  **Step 1: Idea Studio:** Two paths: "Suggest an Idea" (based on interests) or "Refine My Idea".
    *   *Output:* A structured Project Concept (Name, Problem, Solution, Key Features).
3.  **Step 2: Team Tactics:** User selects "Solo" or "Team".
    *   *Output:* A Role Responsibility Matrix tailored to the project.
4.  **Step 3: Roadmap Builder:** Select duration (24h / 48h).
    *   *Output:* A generated hour-by-hour phase breakdown (Ideation, Dev, Polish, Pitch).
5.  **Step 4: Hero Dashboard (Main App):**
    *   *Tab 1: Roadmap Tracker:* Interactive checklist of the generated phases.
    *   *Tab 2: Mentor (Chat):* Context-aware AI chat for coding help/advice.
    *   *Tab 3: Pitch Deck:* AI generator for the final presentation script.

## 2. UI Copy (Friendly & Beginner-Focused)

*   **Landing:** "Ready to win? Let's turn that spark into a shipping product. I'll guide you from zero to demo in record time."
*   **Idea Helper:** "Stuck on what to build? Tell me what you love (e.g., 'climate change', 'gaming', 'finance'), or paste your rough idea here. I'll polish it into a winning concept."
*   **Team Planner:** "Hackathons are intense! Whether you're a lone wolf or a squad, let's define who does what so you don't step on each other's toes."
*   **Roadmap:** "The clock is ticking. Choose your timeline (24h or 48h). I'll build a survival schedule to ensure you actually finish."
*   **Mentor Chat:** "I'm your 24/7 senior engineer. Ask me anything—from 'How do I center a div?' to 'How do I pitch this API?'"
*   **Pitch Assistant:** "Demo time! Don't wing it. Here is a script tailored to your project that hits all the judging criteria."

## 3. Follow-up Prompts for Iteration

1.  "Modify the `RoadmapView` to allow me to drag and drop tasks between phases or mark them as 'Blocked'."
2.  "Update the `GeminiService` to use `veo-3.1-fast-generate-preview` to generate a 5-second teaser video for the pitch deck screen based on the project description."
3.  "Add a 'Technology Stack' selector in Step 1, so the AI suggests a roadmap specifically for React/Python/etc."
4.  "Implement `localStorage` persistence so if I refresh the browser, I don't lose my current hackathon plan."
5.  "Add a feature to export the Pitch Deck as a PDF or Markdown file."
6.  "Enhance the Mentor Chat to support image uploads, so I can show the AI a screenshot of my UI bug."
7.  "Add a 'Panic Button' that gives me a 2-minute breathing exercise and a quick motivational quote when I'm stressed."
