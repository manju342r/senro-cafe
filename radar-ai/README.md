# Senro.AI

### AI-Powered Competitive Intelligence That Remembers

Live web application link : https://senroai.vercel.app/

AI-Powered Competitive Intelligence That Remembers

Senro.AI is an AI-powered competitive intelligence platform that monitors competitor websites, detects meaningful changes, and uses AI memory to understand what those changes mean over time.

Traditional competitive tracking tools mostly tell you what changes have been implemented.

Senro.AI tries to answer questions like what changed, why does it matter, and what should we pay attention to next?

The Problem

Companies continuously change their:

* Pricing
* Products
* Features
* Landing pages
* Calls to action
* Positioning
* Messaging

A simple website difference can detect a change, but it does not understand the context behind repeated changes.

This creates a problem where team receive alerts, but still have to manually connect today’s change with what happened before.

Our Approach

Senro.AI combines website monitoring, AI analysis, and persistent memory.

Competitor Website
        ↓
Change Detection
        ↓
AI Analysis
        ↓
Memory of Previous Changes
        ↓
Strategic Insight
        ↓
Alerts & Dashboard

Instead of treating every website update as an isolated event, Senro.AI keeps relevant historical context.

For example:

Previous:
Competitor changed pricing
→ Analysis: aggressive pricing move
Later:
Competitor adds a new CTA
→ Senro.AI recalls the previous pricing change
→ Connects the events
→ Identifies a broader strategic pattern

The goal is to make the system more useful as it accumulates experience.

Key Features

🔍 Competitor Monitoring

Track competitor websites and identify important changes.

🧠 AI-Powered Analysis

Analyze changes beyond simple text differences and extract meaningful signals.

💾 Persistent Memory

Store previous observations and use them when analyzing future changes.

📈 Competitive Signals

Turn individual websites into higher-level competitive insights.

🚨 Alerts

Surface important competitor activity so teams do not have to constantly monitor websites manually.

📊 Dashboard

View competitors, detected changes, signals, and historical activity in one place.

Why Memory Matters

Without memory:

Change → Analyze → Forget

With memory:

Change
   ↓
Analyze
   ↓
Remember
   ↓
New Change
   ↓
Recall Previous Context
   ↓
Better Analysis

This is the core idea behind Senro.AI.

The agent does not simply process the latest page. It can use relevant previous observations to provide more contextual analysis.

Technology

* Frontend: React + TypeScript
* Backend: API services
* Database: Supabase
* AI: LLM-based analysis
* Memory: Hindsight
* Deployment: Vercel

Project Structure

Senro.AI/
├── api/          # Backend/API logic
├── src/          # Frontend application
├── supabase/     # Database configuration
├── public/       # Public assets
└── README.md

Senro.AI was built around the idea of AI agents that learn using hindsight.

The key concept is simple:

An AI agent becomes more useful when it can remember relevant past experiences and use them when facing new situations.

Senro.AI applies this idea to competitive intelligence.
