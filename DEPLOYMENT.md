# Deployment Guide for Glottie

## Prerequisites
- Vercel account (free tier works)
- Domain: diddydum.com (to be configured)

## Step 1: Prepare for Deployment

### Required Environment Variables for Vercel:
```
SITE_PASSWORD=glottie2024
DATABASE_URL=[Your production database URL]
SPOTIFY_CLIENT_ID=074c9198ca534a588df3b95c7eaf2e98
SPOTIFY_CLIENT_SECRET=b6911b7446704d61acdb47af4d2c2489
MUSIXMATCH_API_KEY=b6bdee9e895ac0d91209a79a31498440
MUSIXMATCH_FULL_LYRICS=true
TRANSLATOR=openai
OPENAI_API_KEY=[Your OpenAI API key]
```

## Step 2: Database Options

### Option A: Vercel Postgres (Recommended for simplicity)
1. In Vercel dashboard, go to Storage
2. Create a new Postgres database
3. It will automatically set DATABASE_URL

### Option B: Supabase (Free tier available)
1. Create account at supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Use the "Transaction" connection string

## Step 3: Deploy to Vercel

### Via Vercel CLI:
```bash
npm i -g vercel
vercel
```

### Via GitHub:
1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Add environment variables
4. Deploy

## Step 4: Configure Domain

1. In Vercel dashboard, go to Settings > Domains
2. Add diddydum.com
3. Follow DNS configuration instructions:
   - Add A record pointing to Vercel IP
   - Or add CNAME record to cname.vercel-dns.com

## Step 5: Post-Deployment

1. Run database migrations:
```bash
npx prisma db push
```

2. Seed initial data if needed:
```bash
npm run db:migrate
```

## Password Protection

The app is protected with a simple password system:
- Login page at `/login`
- Default password: `glottie2024` (change via SITE_PASSWORD env var)
- Sessions last 30 days
- No user accounts needed

## Troubleshooting

### If database connection fails:
- Check DATABASE_URL format
- Ensure SSL is enabled for production databases
- Add `?sslmode=require` to connection string if needed

### If password protection not working:
- Verify SITE_PASSWORD is set in Vercel env vars
- Check middleware.ts is deployed correctly
- Clear browser cookies and try again

## Security Notes

- Change SITE_PASSWORD from default
- Keep API keys secure
- Use production database (not SQLite file)
- Enable SSL for all connections