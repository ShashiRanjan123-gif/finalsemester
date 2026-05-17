const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. DATABASE SCHEMA & MODEL (MongoDB) [cite: 107]
// ----------------------------------------------------
const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true }, // [cite: 109]
    email: { type: String, required: true, unique: true }, // [cite: 110]
    skills: { type: [String], required: true }, // [cite: 111]
    experience: { type: Number, required: true }, // [cite: 112]
    createdAt: { type: Date, default: Date.now } // [cite: 113]
});

const Candidate = mongoose.model('Candidate', CandidateSchema);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/candidateDB')
    .then(() => console.log('✓ MongoDB Connected Successfully'))
    .catch((err) => console.error('✗ MongoDB Connection Error:', err));


// ----------------------------------------------------
// 2. REQUIRED API ENDPOINTS [cite: 33]
// ----------------------------------------------------

/**
 * Endpoint 1: Add Candidate (POST /api/candidates) [cite: 35, 36]
 */
app.post('/api/candidates', async (req, res) => {
    try {
        const { name, email, skills, experience } = req.body; // [cite: 40, 41, 42, 43]
        
        if (!name || !email || !skills || !experience) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newCandidate = new Candidate({ name, email, skills, experience });
        await newCandidate.save();
        
        res.status(201).json({ message: "Candidate added successfully!", candidate: newCandidate });
    } catch (error) {
        res.status(500).json({ message: "Error adding candidate", error: error.message });
    }
});

/**
 * Endpoint 2: Get All Candidates (GET /api/candidates) [cite: 44, 45]
 */
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: "Error fetching candidates", error: error.message });
    }
});

/**
 * Endpoint 3: Shortlist Candidates - Basic Logic (POST /api/match) [cite: 47, 48]
 */
app.post('/api/match', async (req, res) => {
    try {
        const { requiredSkills, minExperience } = req.body; // [cite: 52, 53]

        if (!requiredSkills || !Array.isArray(requiredSkills)) {
            return res.status(400).json({ message: "requiredSkills must be an array." });
        }

        const candidates = await Candidate.find();

        // Backend Matching Logic [cite: 81]
        const matchedCandidates = candidates.map(candidate => {
            const matchedSkills = candidate.skills.filter(skill =>
                requiredSkills.some(reqSkill => reqSkill.toLowerCase() === skill.toLowerCase()) // [cite: 84, 86]
            );

            const score = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) : 0; // [cite: 88]

            return {
                _id: candidate._id,
                name: candidate.name, // [cite: 102]
                email: candidate.email,
                skills: candidate.skills,
                experience: candidate.experience,
                matchedSkills: matchedSkills, // [cite: 104]
                matchScore: Math.round(score * 100) // [cite: 103]
            };
        });

        // Filter and Sort [cite: 93]
        const filteredAndSorted = matchedCandidates
            .filter(c => c.experience >= (minExperience || 0))
            .sort((a, b) => b.matchScore - a.matchScore);

        res.status(200).json(filteredAndSorted);
    } catch (error) {
        res.status(500).json({ message: "Error performing basic match", error: error.message });
    }
});

/**
 * Endpoint 4: AI-Based Candidate Suggestion (POST /api/ai/shortlist) [cite: 54, 55]
 */
app.post('/api/ai/shortlist', async (req, res) => {
    try {
        const { requiredSkills, minExperience } = req.body;

        const candidates = await Candidate.find();
        if (candidates.length === 0) {
            return res.status(400).json({ message: "No candidates available to shortlist." });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({ message: "OpenRouter API Key is missing." });
        }

        // Prompt formatting [cite: 58]
        const jobDescriptionText = `Job requires: ${requiredSkills.join(', ')} (${minExperience}+ years experience)`; // [cite: 71]
        const candidatesText = candidates.map((c, index) => 
            `${index + 1}. ${c.name} - ${c.skills.join(', ')} - ${c.experience} years` // [cite: 73]
        ).join('\n');

        const promptContent = `${jobDescriptionText}\nCandidates:\n${candidatesText}\n\nRank candidates and explain why. Return output strictly as a JSON array of objects with keys: "name", "matchScore", "aiExplanation".`; // [cite: 80]

        // Dynamic import for node-fetch (CommonJS compatible)
        const { default: fetch } = await import('node-fetch');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { // [cite: 59]
            method: "POST", // [cite: 60]
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`, // [cite: 63]
                "Content-Type": "application/json" // [cite: 64]
            },
            body: JSON.stringify({ // [cite: 65]
                model: "openai/gpt-5.2", // [cite: 66]
                messages: [ // [cite: 67]
                    { role: "user", content: promptContent } // [cite: 69, 70]
                ]
            })
        });

        const aiData = await response.json();
        if (!response.ok) {
            throw new Error(aiData.error?.message || "OpenRouter error");
        }

        const aiMessageContent = aiData.choices[0].message.content;
        const cleanJsonString = aiMessageContent.replace(/```json|```/g, '').trim();
        const structuredAiRanking = JSON.parse(cleanJsonString);

        res.status(200).json({
            message: "AI Shortlisting completed successfully",
            ranking: structuredAiRanking
        });

    } catch (error) {
        res.status(500).json({ message: "Error performing AI match", error: error.message });
    }
});

// Server Listen
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
});