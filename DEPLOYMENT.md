# Deployment Guide - Arabic Text Cleaner with Document Chunking

This guide covers deploying the Arabic Text Cleaner web application with the integrated Python document chunking service for handling large files.

## Architecture Overview

The application consists of two main components:
1. **Next.js Web Application** - Frontend and main API
2. **Python Document Chunking Service** - Microservice for large file processing

## Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker (optional)

### Option 1: Manual Setup

1. **Start the Python Service**
   ```bash
   cd python-service
   pip install -r requirements.txt
   python start_service.py
   ```

2. **Start the Next.js Application**
   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local to set PYTHON_SERVICE_URL=http://localhost:8000
   npm run dev
   ```

3. **Access the Application**
   - Web App: http://localhost:3000
   - Python Service: http://localhost:8000

### Option 2: Docker Compose

1. **Start All Services**
   ```bash
   docker-compose up --build
   ```

2. **Access the Application**
   - Web App: http://localhost:3000
   - Python Service: http://localhost:8000

## Production Deployment

### Vercel + Railway (Recommended)

This setup deploys the Next.js app on Vercel and the Python service on Railway.

#### 1. Deploy Python Service on Railway

1. **Create Railway Account** at https://railway.app
2. **Create New Project** from GitHub repository
3. **Configure Service**:
   - Root Directory: `python-service`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api_service:app --host 0.0.0.0 --port $PORT`
4. **Set Environment Variables**:
   ```
   HOST=0.0.0.0
   PORT=$PORT
   LOG_LEVEL=INFO
   ```
5. **Note the Railway URL** (e.g., `https://your-service.railway.app`)

#### 2. Deploy Next.js App on Vercel

1. **Deploy to Vercel** from GitHub
2. **Set Environment Variables**:
   ```
   PYTHON_SERVICE_URL=https://your-service.railway.app
   ```
3. **Deploy and Test**

### Heroku Deployment

#### Python Service on Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-chunking-service
   ```

2. **Configure Buildpack**
   ```bash
   heroku buildpacks:set heroku/python -a your-chunking-service
   ```

3. **Create Procfile** in `python-service/`:
   ```
   web: uvicorn api_service:app --host 0.0.0.0 --port $PORT
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix python-service heroku main
   ```

#### Next.js App on Vercel
Follow the Vercel deployment steps above, using your Heroku Python service URL.

### AWS Deployment

#### Python Service on AWS Lambda

1. **Install Serverless Framework**
   ```bash
   npm install -g serverless
   ```

2. **Create serverless.yml** in `python-service/`:
   ```yaml
   service: document-chunking-service
   
   provider:
     name: aws
     runtime: python3.9
     region: us-east-1
     timeout: 300
     memorySize: 1024
   
   functions:
     api:
       handler: lambda_handler.handler
       events:
         - http:
             path: /{proxy+}
             method: ANY
             cors: true
   ```

3. **Create Lambda Handler** (`lambda_handler.py`):
   ```python
   from mangum import Mangum
   from api_service import app
   
   handler = Mangum(app)
   ```

4. **Deploy**
   ```bash
   serverless deploy
   ```

#### Next.js App on AWS Amplify
Deploy the Next.js app using AWS Amplify, setting the Python service URL.

### Google Cloud Platform

#### Python Service on Cloud Run

1. **Build and Push Container**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/chunking-service python-service/
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy chunking-service \
     --image gcr.io/PROJECT_ID/chunking-service \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --timeout 300
   ```

#### Next.js App on Vercel
Use Vercel with the Cloud Run service URL.

## Environment Variables

### Next.js Application (.env.local)
```
PYTHON_SERVICE_URL=https://your-python-service-url.com
```

### Python Service
```
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
DEFAULT_CHUNK_SIZE_WORDS=10000
DEFAULT_OVERLAP_WORDS=100
ALLOWED_ORIGINS=https://your-nextjs-app.vercel.app
```

## Monitoring and Maintenance

### Health Checks

Both services provide health check endpoints:
- Next.js: Built-in Vercel monitoring
- Python Service: `GET /health`

### Logging

Configure appropriate log levels:
- Development: `DEBUG`
- Production: `INFO` or `WARNING`

### Performance Monitoring

Monitor key metrics:
- Response times
- Memory usage
- Error rates
- File processing success rates

### Scaling Considerations

- **Python Service**: Can handle multiple concurrent requests
- **Memory**: Large files require more memory (consider 2GB+ for production)
- **Timeout**: Set appropriate timeouts for large file processing (5+ minutes)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `ALLOWED_ORIGINS` includes your Next.js domain
   - Check CORS middleware configuration

2. **Service Unavailable**
   - Verify Python service is running and accessible
   - Check network connectivity between services

3. **Large File Processing Fails**
   - Increase memory limits
   - Check timeout settings
   - Monitor disk space for temporary files

4. **Deployment Failures**
   - Verify all dependencies are in requirements.txt
   - Check Python version compatibility
   - Ensure NLTK data downloads correctly

### Debug Commands

```bash
# Check Python service health
curl https://your-python-service.com/health

# Test file processing
curl -X POST -F "file=@test.pdf" https://your-python-service.com/chunk-file

# Check Next.js service status
curl https://your-nextjs-app.vercel.app/api/python-service-status
```

## Security Considerations

1. **File Upload Limits**: Implement appropriate file size limits
2. **Input Validation**: Validate file types and content
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **HTTPS**: Use HTTPS for all production deployments
5. **Environment Variables**: Keep sensitive data in environment variables

## Backup and Recovery

1. **Code**: Use version control (Git)
2. **Processed Files**: Consider implementing file cleanup policies
3. **Logs**: Implement log rotation and archival
4. **Database**: If using a database, implement regular backups

## Cost Optimization

1. **Auto-scaling**: Use services that scale to zero when not in use
2. **Resource Limits**: Set appropriate memory and CPU limits
3. **File Cleanup**: Implement automatic cleanup of temporary files
4. **Caching**: Consider caching frequently processed content

This deployment guide should help you get the Arabic Text Cleaner with document chunking capabilities running in production. Choose the deployment option that best fits your needs and infrastructure preferences.
