# AltPay Nexus Demo



## Project Purpose

This is a sales artifact demonstrating the AltPay Nexus payment architecture. It showcases:
- Multiple payment rails (Cryptocurrency, P2P Transfer, Secure Card Gateway)
- Resilience features (processor outage simulation)
- Custom merchant configuration capabilities

 — This represents architectural solutions custom-fit to the merchant's needs

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```


3. Run the app:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deploy to Vercel

This project is ready for Vercel deployment:

1. **Connect your repository** to Vercel (GitHub/GitLab/Bitbucket)

2. **Configure build settings** (auto-detected):
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Optional Environment Variables**:

4. **Deploy**: Vercel will automatically build and deploy

The demo will be available at your Vercel URL. No additional configuration required.

## Tech Stack

- React 19
- TypeScript
- Vite
- Framer Motion
- Tailwind CSS (via Vite)
- Lucide React Icons

## Features

- Interactive checkout modal with multiple payment methods
- Processor outage simulation toggle
- Use case descriptors for each payment rail
- Responsive design
