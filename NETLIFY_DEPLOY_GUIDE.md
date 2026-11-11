# How to Safely Deploy Voixt to Netlify

This guide walks you through deploying **Voixt** to Netlify step-by-step while ensuring your **Gemini API Key remains 100% secure** and never exposed to visitors, browsers, or public Git repositories.

---

## 🔒 Why This Setup Is Safe

- **No Frontend Exposure**: Your frontend JavaScript never makes direct requests to the Gemini API. All requests go to your own serverless function (`/api/transcribe`).
- **Server-Side Key Handling**: Netlify runs `netlify/functions/transcribe.js` in a secure serverless container where `process.env.API_KEY` is injected privately.
- **Git Protection**: Your `.env` file is excluded in `.gitignore` so your secret key is never committed to GitHub or public repositories.

---

## Step-by-Step Deployment Guide

### Step 1: Verify `.gitignore` (Keep `.env` Private)
Make sure your `.env` file is never pushed to Git. Your `.gitignore` is already configured with:
```gitignore
.env
.env.local
node_modules/
```
> **Rule of thumb**: Never commit `.env` to GitHub.

---

### Step 2: Push Your Project to GitHub
1. Initialize Git in the project root if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Voixt"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 3: Connect Your Repository to Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click the **"Add new site"** button and choose **"Import an existing project"**.
3. Select **GitHub** (or your Git provider) and authorize access.
4. Search for your repository (e.g. `Voixt`) and select it.

---

### Step 4: Verify Build Settings
Netlify will automatically detect the settings from your `netlify.toml` file:
- **Build command**: *(leave blank or empty)*
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`

*(You don't need to change anything here because `netlify.toml` has already configured this for you!)*

---

### Step 5: Add Your Gemini API Key Securely
This is the most important step for safety:

1. Before clicking deploy (or right after), go to **Site configuration** in Netlify.
2. In the left sidebar, click on **Environment variables**.
3. Click **"Add a variable"** -> select **"Add a single variable"**.
4. Set the fields:
   - **Key**: `API_KEY`
   - **Value**: `<paste-your-gemini-api-key-here>` *(from your private .env file)*
   - **Scopes**: Leave default (All scopes / Functions).
5. Click **"Create variable"**.

---

### Step 6: Deploy & Verify
1. If you haven't deployed yet, click **"Deploy site"**.
2. If the site already built once before adding the variable, trigger a redeploy:
   - Go to **Deploys** -> click **"Trigger deploy"** -> select **"Deploy site"**.
3. Wait about 30 seconds for the build to finish. Netlify will give you your live URL (e.g., `https://voixt-your-site.netlify.app`).

---

## 🔍 How to Test That Your API Key Is Safe

1. Open your live Netlify website in Google Chrome or any browser.
2. Open Developer Tools (`F12` or Right Click -> **Inspect**).
3. Switch to the **Network** tab and filter by `Fetch/XHR`.
4. Click **Record** on Voixt, say a short sentence, and click **Stop & Transcribe**.
5. Look at the outgoing network request:
   - Request URL: `https://your-site.netlify.app/api/transcribe`
   - Request Body: Contains only the audio base64 payload and language choice.
   - **Notice**: Nowhere in the request headers or request URL is your API key present! It is handled entirely inside Netlify's backend function.

---

## 🛠️ Troubleshooting & Logs

If transcription ever returns an error:
1. In your Netlify dashboard, go to **Functions** in the top navigation.
2. Click on the `transcribe` function.
3. You will see real-time execution logs and exact error messages from the server to help diagnose any issues.

