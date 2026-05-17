import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // 🚀 UPDATED NEW API URL HERE
  const API = "https://finalsemester-1.onrender.com";

  const [candidates, setCandidates] = useState([]);

  const [candidateData, setCandidateData] = useState({
    name: "",
    email: "",
    skills: "",
    experience: "",
    projects: "",
  });

  const [jobData, setJobData] = useState({
    requiredSkills: "",
    minExperience: "",
  });

  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [aiResult, setAiResult] = useState([]);

  // Fetch Candidates
  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/api/candidates`);
      setCandidates(res.data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Add Candidate
  const addCandidate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/candidates`, {
        ...candidateData,
        experience: Number(candidateData.experience),
        skills: candidateData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== ""),
      });

      alert("✅ Candidate Added Successfully");

      setCandidateData({
        name: "",
        email: "",
        skills: "",
        experience: "",
        projects: "",
      });

      fetchCandidates();
    } catch (error) {
      console.error("Error adding candidate:", error);
      alert("❌ Failed to add candidate");
    }
  };

  // Match Candidates (Basic Logic)
  const matchCandidates = async () => {
    try {
      const res = await axios.post(`${API}/api/match`, {
        requiredSkills: jobData.requiredSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== ""),
        minExperience: Number(jobData.minExperience),
      });

      setMatchedCandidates(res.data);
    } catch (error) {
      console.error("Error matching candidates:", error);
    }
  };

  // AI Shortlisting
  const aiShortlisting = async () => {
    try {
      const res = await axios.post(`${API}/api/ai/shortlist`, {
        requiredSkills: jobData.requiredSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== ""),
        minExperience: Number(jobData.minExperience),
      });

      if (res.data && res.data.ranking) {
        setAiResult(res.data.ranking);
        alert("✅ AI Shortlisting Completed!");
      }
    } catch (error) {
      console.error("AI Shortlisting Error:", error);
      alert("❌ AI Shortlisting Failed");
    }
  };

  return (
    <div className="container">
      <h1>🚀 AI Candidate Shortlisting System</h1>

      {/* Add Candidate Form */}
      <div className="card">
        <h2>Add Candidate</h2>
        <form onSubmit={addCandidate}>
          <input
            type="text"
            placeholder="Enter Name"
            required
            value={candidateData.name}
            onChange={(e) =>
              setCandidateData({ ...candidateData, name: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Enter Email"
            required
            value={candidateData.email}
            onChange={(e) =>
              setCandidateData({ ...candidateData, email: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Skills (React, Node.js, MongoDB)"
            required
            value={candidateData.skills}
            onChange={(e) =>
              setCandidateData({ ...candidateData, skills: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Experience (Years)"
            required
            value={candidateData.experience}
            onChange={(e) =>
              setCandidateData({ ...candidateData, experience: e.target.value })
            }
          />

          <textarea
            placeholder="Projects / Bio"
            value={candidateData.projects}
            onChange={(e) =>
              setCandidateData({ ...candidateData, projects: e.target.value })
            }
          ></textarea>

          <div className="button-group">
            <button type="submit">Add Candidate</button>
          </div>
        </form>
      </div>

      {/* Job Requirement Input */}
      <div className="card">
        <h2>Job Requirement</h2>
        <input
          type="text"
          placeholder="Required Skills (comma separated)"
          value={jobData.requiredSkills}
          onChange={(e) =>
            setJobData({ ...jobData, requiredSkills: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Minimum Experience"
          value={jobData.minExperience}
          onChange={(e) =>
            setJobData({ ...jobData, minExperience: e.target.value })
          }
        />

        <div className="button-group">
          <button onClick={matchCandidates}>Match Candidates</button>
          <button onClick={aiShortlisting} style={{ backgroundColor: "#6200ea", color: "white" }}>
            AI Shortlisting
          </button>
        </div>
      </div>

      {/* All Candidates Display */}
      <div className="card">
        <h2>All Candidates</h2>
        {candidates.length === 0 ? (
          <p>No Candidates Found</p>
        ) : (
          candidates.map((candidate) => (
            <div className="candidate" key={candidate._id}>
              <h3>{candidate.name}</h3>
              <p><strong>Email:</strong> {candidate.email}</p>
              <p><strong>Skills:</strong> {candidate.skills.join(", ")}</p>
              <p><strong>Experience:</strong> {candidate.experience} years</p>
              {candidate.projects && <p><strong>Projects:</strong> {candidate.projects}</p>}
            </div>
          ))
        )}
      </div>

      {/* Matched Candidates Display */}
      <div className="card">
        <h2>Matched Candidates (Basic Filter)</h2>
        {matchedCandidates.length === 0 ? (
          <p>No Matched Candidates Yet</p>
        ) : (
          matchedCandidates.map((candidate, index) => (
            <div className="candidate" key={candidate._id || index}>
              <h3>{candidate.name}</h3>
              <p><strong>Match Score:</strong> {candidate.matchScore}%</p>
              <p><strong>Matched Skills:</strong> {candidate.matchedSkills?.join(", ") || "None"}</p>
              <p><strong>Experience:</strong> {candidate.experience} years</p>
            </div>
          ))
        )}
      </div>

      {/* AI Recommendation Display */}
      <div className="card">
        <h2>🧠 AI Smart Recommendation</h2>
        {aiResult.length === 0 ? (
          <p>No AI Recommendation Yet. Click "AI Shortlisting" to evaluate.</p>
        ) : (
          aiResult.map((item, index) => (
            <div className="candidate ai-highlight" key={index} style={{ borderLeft: "4px solid #6200ea" }}>
              <h3>Rank #{index + 1}: {item.name}</h3>
              {item.matchScore && <p><strong>AI Fit Score:</strong> {item.matchScore}%</p>}
              <p style={{ fontStyle: "italic", color: "#333", backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
                <strong>AI Explanation:</strong> {item.aiExplanation}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;