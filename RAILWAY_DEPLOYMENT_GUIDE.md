# 🚂 Railway Deployment Guide - Step by Step

This guide will walk you through deploying your Python Document Chunking Service to Railway, which will enable your Vercel app to handle files up to 500MB.

## 📋 Prerequisites

- ✅ Your code is already on GitHub (which it is)
- ✅ A Railway account (we'll create this)
- ✅ Your Vercel app is running at: https://arabic-cleaner-web-a91v.vercel.app

## 🎯 Step 1: Create Railway Account

1. **Go to Railway**: https://railway.app
2. **Click "Login"** in the top right
3. **Sign up with GitHub** (recommended for easy repo access)
   - Click "Continue with GitHub"
   - Authorize Railway to access your GitHub account
   - Complete your profile setup

## 🚀 Step 2: Deploy from GitHub Repository

1. **Create New Project**
   - Once logged in, click **"New Project"**
   - Select **"Deploy from GitHub repo"**

2. **Connect Your Repository**
   - You'll see a list of your GitHub repositories
   - Find and select your `arabic-cleaner-web` repository
   - Click on it to select

3. **Configure the Service**
   - Railway will detect it's a Node.js project by default
   - We need to deploy only the Python service
   - **IMPORTANT**: Look for "Root Directory" or "Source" settings
   - Set the **Root Directory** to: `python-service`
   - This tells Railway to only deploy the Python service folder

4. **Deploy**
   - Click **"Deploy Now"** or **"Deploy"**
   - Railway will start building your Python service

## ⚙️ Step 3: Configure Environment Variables

While the deployment is running, let's set up the environment variables:

1. **Go to Your Project Dashboard**
   - You should see your project building
   - Click on the service name (it might be called "python-service" or similar)

2. **Navigate to Settings**
   - Click on the **"Settings"** tab
   - Look for **"Environment Variables"** section

3. **Add Environment Variables**
   Click **"Add Variable"** for each of these:

   ```
   Variable Name: HOST
   Value: 0.0.0.0
   ```

   ```
   Variable Name: LOG_LEVEL
   Value: INFO
   ```

   ```
   Variable Name: ALLOWED_ORIGINS
   Value: https://arabic-cleaner-web-a91v.vercel.app,https://*.vercel.app
   ```

   ```
   Variable Name: DEFAULT_CHUNK_SIZE_WORDS
   Value: 10000
   ```

   ```
   Variable Name: DEFAULT_OVERLAP_WORDS
   Value: 100
   ```

   ```
   Variable Name: PYTHONUNBUFFERED
   Value: 1
   ```

   ```
   Variable Name: PYTHONDONTWRITEBYTECODE
   Value: 1
   ```

4. **Save Variables**
   - After adding all variables, the service will automatically redeploy

## 🌐 Step 4: Get Your Railway URL

1. **Wait for Deployment to Complete**
   - Watch the deployment logs in the "Deployments" tab
   - Wait for it to show "Success" or "Deployed"

2. **Generate Public URL**
   - Go to the **"Settings"** tab
   - Find the **"Networking"** section
   - Click **"Generate Domain"**
   - Railway will create a public URL like: `https://your-service-name.railway.app`

3. **Test Your Service**
   - Copy the Railway URL
   - Add `/health` to the end: `https://your-service-name.railway.app/health`
   - Open this URL in your browser
   - You should see a JSON response like:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-XX...",
     "service": "Document Chunking Service",
     "version": "1.0.0"
   }
   ```

## 🔗 Step 5: Connect to Your Vercel App

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Find your `arabic-cleaner-web-a91v` project
   - Click on it

2. **Add Environment Variable**
   - Go to **Settings** → **Environment Variables**
   - Click **"Add New"**
   - Set:
     ```
     Name: PYTHON_SERVICE_URL
     Value: https://your-service-name.railway.app
     ```
     (Replace with your actual Railway URL from Step 4)
   - Select all environments: **Production**, **Preview**, **Development**
   - Click **"Save"**

3. **Redeploy Vercel App**
   - Go to the **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment
   - Wait for redeployment to complete

## ✅ Step 6: Test Everything

1. **Visit Your Vercel App**
   - Go to: https://arabic-cleaner-web-a91v.vercel.app

2. **Check Service Status**
   - Look for "Enhanced Processing Status" on the upload page
   - It should show: **"Available (up to 500MB per file)"** with a green dot

3. **Test Large File Upload**
   - Try uploading a file larger than 10MB
   - The file should be processed using the Python service
   - You should get chunked output files

## 🔧 Troubleshooting

### If Railway Deployment Fails:

1. **Check Build Logs**
   - Go to "Deployments" tab in Railway
   - Click on the failed deployment
   - Check the build logs for errors

2. **Common Issues:**
   - **Root Directory**: Make sure it's set to `python-service`
   - **Requirements**: Ensure `requirements.txt` is in the python-service folder
   - **Port**: Railway automatically sets the PORT variable

### If Service Status Shows "Unavailable":

1. **Check Railway URL**
   - Test: `https://your-service.railway.app/health`
   - Should return JSON response

2. **Check CORS Settings**
   - Verify `ALLOWED_ORIGINS` includes your Vercel domain
   - Redeploy Railway service after changing variables

3. **Check Vercel Environment Variable**
   - Ensure `PYTHON_SERVICE_URL` is set correctly
   - Redeploy Vercel app after changes

### If File Upload Still Limited to 100MB:

1. **Verify Environment Variable**
   - Check Vercel dashboard for `PYTHON_SERVICE_URL`
   - Test the Railway URL directly

2. **Check Browser Console**
   - Open browser dev tools
   - Look for any CORS or network errors

## 💰 Railway Pricing

- **Starter Plan**: $5/month
  - 512MB RAM, 1GB storage
  - Perfect for this service
  - No free tier anymore (as of 2024)

- **Pro Plan**: $20/month
  - 8GB RAM, 100GB storage
  - For high-traffic applications

## 🎉 Success!

Once everything is working, your Arabic Text Cleaner will support:
- ✅ Files up to 500MB (vs 100MB before)
- ✅ Intelligent chunking with word boundary preservation
- ✅ Better PDF processing with multiple libraries
- ✅ Automatic fallback if Python service is unavailable

Your users can now upload much larger documents and get them processed efficiently with smart chunking!

## 📞 Need Help?

If you encounter any issues:
1. Check the Railway deployment logs
2. Test the health endpoint directly
3. Verify all environment variables are set correctly
4. Ensure CORS settings include your Vercel domain

The service should be running smoothly and handling large files within minutes of completing this guide!
