const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// =========================
// Candidate Schema
// =========================
const candidateSchema = new mongoose.Schema({
  name: String,
  email: String,
  skills: [String],
  experience: Number,
  projects: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Candidate = mongoose.model("Candidate", candidateSchema);

// =========================
// Home Route
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Candidate Shortlisting API Running");
});

// =========================
// Add Candidate API
// =========================
app.post("/api/candidates", async (req, res) => {
  try {
    const candidate = new Candidate(req.body);

    await candidate.save();

    res.status(201).json({
      message: "✅ Candidate Added Successfully",
      candidate,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// Get All Candidates API
// =========================
app.get("/api/candidates", async (req, res) => {
  try {
    const candidates = await Candidate.find();

    res.json(candidates);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// Basic Matching API
// =========================
app.post("/api/match", async (req, res) => {
  try {
    const { requiredSkills, minExperience } = req.body;

    const candidates = await Candidate.find();

    const matchedCandidates = candidates
      .map((candidate) => {
        const matchedSkills = candidate.skills.filter((skill) =>
          requiredSkills.includes(skill)
        );

        const score =
          (matchedSkills.length / requiredSkills.length) * 100;

        let rank = "Low";

        if (score >= 80) {
          rank = "High";
        } else if (score >= 50) {
          rank = "Medium";
        }

        return {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          skills: candidate.skills,
          experience: candidate.experience,
          matchedSkills,
          matchScore: score.toFixed(2),
          rank,
        };
      })
      .filter((candidate) => candidate.experience >= minExperience)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(matchedCandidates);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// AI Shortlisting API
// =========================
app.post("/api/ai/shortlist", async (req, res) => {
  try {
    const { requiredSkills, minExperience } = req.body;

    const candidates = await Candidate.find();

    let candidateText = "";

    candidates.forEach((candidate, index) => {
      candidateText += `
${index + 1}. ${candidate.name}
Skills: ${candidate.skills.join(", ")}
Experience: ${candidate.experience} years
Projects: ${candidate.projects}
`;
    });

    const prompt = `
Job Requirements:
Skills Required: ${requiredSkills.join(", ")}
Minimum Experience: ${minExperience} years

Candidates:
${candidateText}

Rank the best candidates and explain why they are suitable.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-5.2",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      aiResponse: response.data.choices[0].message.content,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "AI Shortlisting Failed",
    });
  }
});

// =========================
// Delete Candidate API
// =========================
app.delete("/api/candidates/:id", async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);

    res.json({
      message: "🗑️ Candidate Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// Server Start
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running on Port ${PORT}`);
});