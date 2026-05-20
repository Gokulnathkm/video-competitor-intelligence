# Video Competitor Intelligence Tool

An enterprise-ready, professional-grade competitor intelligence dashboard for YouTube content analytics and automated report generation. Built using Next.js App Router, TypeScript, Tailwind CSS, Recharts, and pptxgenjs.

## Overview
This tool allows businesses to run deep competitor analysis on YouTube channels. It aggregates statistics, classifies video topics using title keyword heuristic classification, determines upload frequencies and posting consistencies (using standard deviation coefficient of variation), calculates audience engagement rates, performs content gap analyses with opportunity mapping, and produces high-quality exportable PowerPoint (.pptx) slide decks.

---
## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- PptxGenJS
- Axios
- YouTube Data API v3
- Vercel


## Project Architecture & Directory Structure

The project has been refactored into a modular enterprise-level architecture separating frontend presentation components from backend business logic services:

```text
video-competitor-intelligence/
│
├── app/                              # Next.js App Router Pages & API Routes
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts              # Thin wrapper API route invoking backend services
│   ├── globals.css                   # Global styles & design token variables
│   ├── layout.tsx                    # Main App Layout (fonts, metadata, SEO)
│   └── page.tsx                      # Competitor analysis workspace entrypoint
│
├── backend/                          # Backend Logic & Computation Services
│   ├── analytics/                    # Modular analytics services
│   │   ├── engagement.ts             # Views, likes, and comment rate metrics
│   │   ├── frequency.ts              # Posting frequency and consistency calculations
│   │   ├── gap-analysis.ts           # Content gap and opportunity discovery
│   │   ├── recommendations.ts        # Dynamic recommendations & executive summaries
│   │   ├── scoring.ts                # Score normalization and ranking engines
│   │   └── report-builder.ts         # Orchestration layer compiling reports
│   │
│   ├── classification/
│   │   └── topic-engine.ts           # Title keyword topic classification service
│   │
│   ├── ppt/
│   │   └── ppt-generator.ts          # Custom PowerPoint slide deck builder
│   │
│   └── youtube/
│       ├── youtube-service.ts        # YouTube API ingestion service with match scoring
│       └── youtube-types.ts          # YouTube API service type definitions
│
├── components/                       # Frontend Presentation Layer
│   └── report/
│       └── ReportView.tsx            # High-fidelity dashboard displaying report details
│
├── lib/                              # Shared Library Utilities & Constants
│   ├── colors.ts                     # Hex code constants for charts & presentation
│   ├── constants.ts                  # Shared application constants
│   ├── formatters.ts                 # Formatting helper functions
│   └── utils.ts                      # Tailwind styling utility helpers
│
├── services/                         # Shared Service Clients
│   └── youtube-api.ts                # Configured Axios instance for YouTube API calls
│
├── types/                            # Type Definition Layer
│   ├── index.ts                      # Main type entry point re-exporting modules
│   ├── channel.ts                    # Channel information typings
│   ├── video.ts                      # Video details typings
│   ├── analytics.ts                  # Analytics results typings
│   └── report.ts                     # Report and gap analysis typings
│
└── tsconfig.json                     # Path-alias configured TypeScript configuration
```

---


## Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm or yarn

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd video-competitor-intelligence
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env.local` file in the root of the project and specify your YouTube Data API v3 key:
```env
YOUTUBE_API_KEY=your_youtube_data_api_v3_key_here
```

### Running the App Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production
Build the optimized production bundle:
```bash
npm run build
```
Start the production server:
```bash
npm run start
```

## Live Demo
https://video-competitor-intelligence.vercel.app/
