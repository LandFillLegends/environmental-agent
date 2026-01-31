# Landfill Legends
♻️ Landfill Legends

Agentic assistant for correct, location-aware household waste disposal.

🚀 Overview

Landfill Legends helps users quickly figure out how to dispose of household items correctly based on item type, condition, and local rules.

Users can type or scan an item, and the agent returns clear disposal instructions, including drop-off locations and scheduling when needed.

Built as part of Break Through Tech AI – Maker Track.

🧠 Why an Agent?

This problem requires:

Location-specific reasoning

Multiple decision paths (curbside vs drop-off)

External actions (maps, calendar)

Clarifying questions for ambiguous items

A static LLM response isn’t sufficient.

🔑 Core Features (MVP)

Text & image item input

Item identification (Gemini)

Local disposal rule lookup

Drop-off detection + location search

Basic scheduling suggestions

Clear, step-by-step instructions

🛠️ Tech Stack

Frontend: React Native

Backend: Python

Database: Neon + PostgreSQL

AI: Gemini API

Tools/APIs:

Web Search

Google Places

Google Calendar

Maps API

🧩 Agent Flow
User Input (Text/Image)
        ↓
Item Identification
        ↓
Local Policy Lookup (Web / Cache)
        ↓
Drop-Off Required?
   ├─ No → Curbside Instructions
   └─ Yes → Location + Time + Map

📆 Roadmap

February (MVP):

Item identification

Local rules lookup

Drop-off logic

Basic mobile UI

March:

Agentic looping

Calendar + map integration

April:

UI polish

Sustainable alternatives

Final demo

👥 Team

Anour Ibrahim

Joseann Boneo

Archie Goli

Tran Vo

🔧 Dev Notes

API keys required (Gemini, Google APIs)

Disposal rules cached when possible

Focus on reliability over feature breadth

📌 Status

🟡 In active development
