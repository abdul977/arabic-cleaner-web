# 🚀 Railway Deployment Checklist

Use this checklist to ensure your deployment goes smoothly:

## ✅ Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] `python-service` folder contains all necessary files:
  - [ ] `api_service.py`
  - [ ] `document_chunker.py`
  - [ ] `requirements.txt`
  - [ ] `railway.json`
  - [ ] `Procfile`
  - [ ] `.env` (optional)

## ✅ Railway Setup

- [ ] Railway account created with GitHub login
- [ ] New project created from GitHub repo
- [ ] Root directory set to `python-service`
- [ ] Environment variables configured:
  - [ ] `HOST=0.0.0.0`
  - [ ] `LOG_LEVEL=INFO`
  - [ ] `ALLOWED_ORIGINS=https://arabic-cleaner-web-a91v.vercel.app,https://*.vercel.app`
  - [ ] `DEFAULT_CHUNK_SIZE_WORDS=10000`
  - [ ] `DEFAULT_OVERLAP_WORDS=100`
  - [ ] `PYTHONUNBUFFERED=1`
  - [ ] `PYTHONDONTWRITEBYTECODE=1`

## ✅ Railway Deployment

- [ ] Deployment completed successfully
- [ ] Build logs show no errors
- [ ] Public domain generated
- [ ] Health check endpoint working: `https://your-service.railway.app/health`

## ✅ Vercel Integration

- [ ] `PYTHON_SERVICE_URL` environment variable added to Vercel
- [ ] Vercel app redeployed
- [ ] Service status shows "Available" on upload page
- [ ] Large file upload test successful (>10MB file)

## ✅ Testing

- [ ] Health endpoint returns JSON response
- [ ] Service status indicator shows green
- [ ] File size limits increased to 500MB
- [ ] Chunking works for large files
- [ ] Download options include individual chunks and merged files

## 🔧 Troubleshooting Commands

If something goes wrong, use these to debug:

```bash
# Test Railway service health
curl https://your-service.railway.app/health

# Test file upload (replace with your Railway URL)
curl -X POST -F "file=@test.pdf" https://your-service.railway.app/chunk-file

# Check Vercel service status
curl https://arabic-cleaner-web-a91v.vercel.app/api/python-service-status
```

## 📞 Common Issues & Solutions

### Issue: "Service Unavailable"
**Solution**: Check Railway deployment logs and environment variables

### Issue: "CORS Error"
**Solution**: Verify `ALLOWED_ORIGINS` includes your Vercel domain

### Issue: "Build Failed"
**Solution**: Check `requirements.txt` and ensure root directory is set to `python-service`

### Issue: "File Size Still Limited"
**Solution**: Verify `PYTHON_SERVICE_URL` is set in Vercel and redeploy

## 🎯 Expected Results

After successful deployment:
- Railway service running at: `https://your-service.railway.app`
- Vercel app enhanced with large file support
- File size limit increased from 100MB to 500MB
- Intelligent chunking for large documents
- Better error handling and user feedback

## 💡 Pro Tips

1. **Monitor Railway Logs**: Keep an eye on deployment logs for any issues
2. **Test Incrementally**: Test health endpoint first, then file uploads
3. **Use Railway CLI**: Install Railway CLI for easier debugging
4. **Check Pricing**: Monitor usage to stay within your plan limits
5. **Backup Strategy**: Keep your GitHub repo as the source of truth

Your Arabic Text Cleaner is now ready for production with enhanced large file processing capabilities! 🎉
