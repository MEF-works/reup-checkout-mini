# AltPay Rails - Vercel Deployment

This folder contains the built files for deploying AltPay Rails to Vercel.

## File Structure

```
vercel-deploy/
├── demo/          # Demo site → altpayrails.com
├── docs/          # Documentation → docs.altpayrails.com
└── README.md      # This file
```

---

## Deploy to Vercel

### Step 1: Deploy Demo Site (altpayrails.com)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Choose **"Upload"** (drag & drop the `demo` folder)
4. Framework Preset: **"Other"** (static HTML)
5. Click **Deploy**

After deployment:
1. Go to **Project Settings → Domains**
2. Add `altpayrails.com`
3. Follow Vercel's DNS instructions

---

### Step 2: Deploy Docs Site (docs.altpayrails.com)

1. Create a **new project** in Vercel
2. Upload the `docs` folder
3. Framework Preset: **"Other"**
4. Click **Deploy**

After deployment:
1. Go to **Project Settings → Domains**
2. Add `docs.altpayrails.com`

---

## DNS Configuration

### For altpayrails.com (Root Domain)

In your domain registrar:

**A Record:**
- Type: A
- Name: @
- Value: 76.76.21.21
- TTL: 3600

### For docs.altpayrails.com (Subdomain)

**CNAME Record:**
- Type: CNAME
- Name: docs
- Value: cname.vercel-dns.com
- TTL: 3600

---

## SSL Certificate

Vercel automatically provisions SSL certificates. No additional setup needed.

---

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Email: support@altpayrails.io
