# HackathonHero 🚀

**HackathonHero** is your professional AI co-pilot for high-stakes hackathons. It eliminates common project hurdles by providing an Idea Studio, Team Planner, and a 24/48-Hour Execution Roadmap with integrated AI mentorship.

## 🌟 Key Features
- **Idea Studio:** Brainstorm concepts or refine rough drafts into technical MVP plans.
- **Team Tactics:** Role responsibility matrix tailored for solo builders or squads.
- **Execution Roadmap:** Hour-by-hour phase breakdown for 24h/48h timelines.
- **Mentor AI:** A context-aware senior engineer chat that understands your specific project.
- **Code Gen:** Generate shippable code snippets for every task in your roadmap.

## 🛠️ Tech Stack
- **Frontend:** React 19, Tailwind CSS
- **AI Engine:** Google Gemini API (`gemini-3-flash-preview` & `gemini-3-pro-preview`)

---

## 🌎 How to Host this App (Make it Live)

Follow these 3 steps to put your app online for free:

### 1. Sign up for Vercel
Go to [Vercel.com](https://vercel.com) and sign up with your GitHub account.

### 2. Import Project
Click **"Add New"** > **"Project"** and select your `Hacksathan_Hreo` repository.

### 3. Set Environment Variables (CRITICAL)
Before clicking "Deploy", look for the **Environment Variables** section:
- **Key**: `API_KEY`
- **Value**: *Paste your Gemini API Key here*
- Click **Add**.

### 4. Deploy!
Click **Deploy**. In less than 1 minute, you will have a live URL (e.g., `hackathon-hero.vercel.app`) that you can share with judges or your team!

---

## 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Davanahs/Hacksathan_Hreo.git
   ```

2. **Configure Secrets:**
   - Create a `.env` file in the root directory.
   - Add your API key: `API_KEY=your_actual_key_here`

3. **Run the app:**
   Simply open `index.html` in a modern browser using a Live Server extension.

## 🛡️ Security & Privacy
This project uses `process.env.API_KEY` to ensure secrets are never committed to version control. It also supports **BYOK (Bring Your Own Key)** in the UI, allowing users to use their own usage quotas if the primary key is exhausted.
