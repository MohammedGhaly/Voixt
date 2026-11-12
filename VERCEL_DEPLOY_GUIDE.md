# How to Safely Deploy Voixt to Vercel

This guide walks you through deploying **Voixt** to **Vercel** with zero hassle while keeping your **Gemini API Key 100% secure** on the server.

---

## 🔒 Security Guarantee
- **No Frontend Exposure**: The Gemini API key is never bundled in frontend JavaScript.
- **Serverless API**: Calls to `/api/transcribe` run inside Vercel's Serverless Node.js runtime (`api/transcribe.js`), accessing `process.env.API_KEY` privately.
- **Git Safety**: Your `.env` file is in `.gitignore` and is never sent to GitHub.

---

## 🚀 Step-by-Step Vercel Deployment

### Step 1: Push the Latest Code to GitHub
We have added `vercel.json` and `api/transcribe.js` to your repository. Commit and push:
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

---

### Step 2: Import Your Repository into Vercel
1. Go to [Vercel](https://vercel.com/) and sign in with your GitHub account.
2. In your dashboard, click **"Add New..."** &rarr; select **"Project"**.
3. Under **Import Git Repository**, find `Voixt` (or `MohammedGhaly/Voixt`) and click **"Import"**.

---

### Step 3: Configure Project Settings
Vercel will detect the configuration automatically from `vercel.json`:
- **Framework Preset**: `Other`
- **Root Directory**: `./` (leave default)
- **Output Directory**: `public` (automatically configured by `vercel.json`)

---

### Step 4: Add Your Gemini API Key (Crucial Step)
1. On the same configure screen, expand the **Environment Variables** section.
2. Enter the variable details:
   - **Key**: `API_KEY`
   - **Value**: `<paste-your-gemini-api-key-here>` *(from your local `.env`)*
3. Click **"Add"**.

---

### Step 5: Click "Deploy"
1. Click the **"Deploy"** button.
2. Vercel will build and deploy the project in about 15–25 seconds.
3. Once finished, click **"Go to Dashboard"** or click on the preview window to visit your live production URL (e.g., `https://voixt.vercel.app` or `https://voixt-username.vercel.app`).

---

## 🔍 Verifying the Deployment
1. Open your live Vercel URL in your browser.
2. Open Developer Tools (`F12`) &rarr; **Network** tab.
3. Click **Record**, speak a short sentence, and click **Stop & Transcribe**.
4. You will see a `POST` request to `https://your-app.vercel.app/api/transcribe`.
5. Check the request payload and headers: **Your Gemini API key is completely hidden** and handled on the server!

