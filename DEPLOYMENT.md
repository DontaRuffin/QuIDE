# QuIDE Deployment Guide

## ✅ Supabase Setup (DONE)

Your Supabase database is configured with:
- **URL:** https://aayapllqvogavlzxgzch.supabase.co
- **Database tables:** profiles, circuits, simulation_results
- **Row Level Security:** Enabled with policies

---

## 🚀 Deploy Python Backend to Railway

### 1. Sign up for Railway
- Go to https://railway.app
- Sign up with GitHub

### 2. Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account and select **DontaRuffin/QuIDE**
4. Railway will auto-detect the Python app in the `python/` directory

### 3. Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
PORT=8000
SERVICE_API_KEY=Jrt6WpOe+18kvAlCygGl3U/KpcQPeSNwpURSm5BrjFQ=
ENVIRONMENT=production
```

### 4. Configure Start Command (if needed)

Railway should auto-detect, but if needed, set the start command to:
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 5. Get Your Railway URL

After deployment, Railway will give you a URL like:
- `https://quide-python-production.up.railway.app`

**Save this URL** — you'll need it for Vercel.

---

## 🌐 Deploy Frontend to Vercel

### 1. Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### 2. Deploy from QuIDE directory

```bash
cd ~/Documents/QuIDE
vercel
```

Follow the prompts:
- **Set up and deploy?** Y
- **Which scope?** (select your account)
- **Link to existing project?** N
- **Project name?** quide
- **In which directory is your code located?** ./
- **Want to override settings?** N

### 3. Add Environment Variables in Vercel

After initial deployment, go to https://vercel.com/dashboard and select your project.

Go to **Settings → Environment Variables** and add:

**Production:**
```
NEXT_PUBLIC_SUPABASE_URL=https://aayapllqvogavlzxgzch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheWFwbGxxdm9nYXZsenhnemNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDc1NjgsImV4cCI6MjA4OTE4MzU2OH0.S8kSOpIKB8DB72un3i69Un02QTneI1YZF6MriI2PSjg
NEXT_PUBLIC_SIMULATION_API_URL=https://your-railway-url.up.railway.app
SIMULATION_SERVICE_KEY=Jrt6WpOe+18kvAlCygGl3U/KpcQPeSNwpURSm5BrjFQ=
```

**Replace** `https://your-railway-url.up.railway.app` with your actual Railway URL from step 5 above.

### 4. Redeploy

```bash
vercel --prod
```

Your app will be live at: `https://quide.vercel.app` (or similar)

---

## 🧪 Test Your Deployment

1. Visit your Vercel URL
2. Click "Open IDE"
3. Try dragging gates onto the canvas
4. Click "Run Simulation" to test the Python backend
5. Check if results appear

---

## 🔒 Security Notes

- ✅ Your `SERVICE_API_KEY` is a secure random key
- ✅ Supabase RLS (Row Level Security) is enabled
- ✅ Environment variables are not committed to git
- ⚠️ The anon key is safe to expose (it's meant to be public)

---

## 📝 Post-Deployment Checklist

- [ ] Railway backend is running (check Railway dashboard)
- [ ] Vercel frontend is deployed (check Vercel dashboard)
- [ ] Environment variables are set in both Railway and Vercel
- [ ] Test simulation works end-to-end
- [ ] Set up Supabase Auth (email/password or OAuth)
- [ ] Create a test user account
- [ ] Test saving a circuit
- [ ] Test loading a saved circuit

---

## 🐛 Troubleshooting

**Frontend can't connect to backend:**
- Check `NEXT_PUBLIC_SIMULATION_API_URL` matches your Railway URL
- Make sure Railway app is running (check logs)
- Verify `SERVICE_API_KEY` matches in both Vercel and Railway

**Database errors:**
- Check Supabase dashboard for connection issues
- Verify the SQL migration ran successfully
- Check browser console for auth errors

**Python errors:**
- Check Railway logs for Python errors
- Verify all dependencies installed correctly
- Check qiskit version compatibility

---

## 🎉 You're Done!

Your QuIDE app should now be live and accessible from anywhere!
