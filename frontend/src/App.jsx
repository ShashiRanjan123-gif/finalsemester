import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
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

  const [aiResult, setAiResult] = useState("");

  // Fetch Candidates
  const fetchCandidates = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/candidates"
      );

      setCandidates(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Add Candidate
  const addCandidate = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/candidates",
        {
          ...candidateData,
          skills: candidateData.skills
            .split(",")
            .map((skill) => skill.trim()),
        }
      );

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
      console.log(error);
    }
  };

  // Match Candidates
  const matchCandidates = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/match",
        {
          requiredSkills: jobData.requiredSkills
            .split(",")
            .map((skill) => skill.trim()),

          minExperience: Number(jobData.minExperience),
        }
      );

      setMatchedCandidates(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // AI Shortlisting
  const aiShortlisting = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/ai/shortlist",
        {
          requiredSkills: jobData.requiredSkills
            .split(",")
            .map((skill) => skill.trim()),

          minExperience: Number(jobData.minExperience),
        }
      );

      setAiResult(res.data.aiResponse);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">
      <h1>🚀 AI Candidate Shortlisting System</h1>

      {/* Add Candidate */}
      <div className="card">
        <h2>Add Candidate</h2>

        <form onSubmit={addCandidate}>
          <input
            type="text"
            placeholder="Enter Name"
            value={candidateData.name}
            onChange={(e) =>
              setCandidateData({
                ...candidateData,
                name: e.target.value,
              })
            }
          />

          <input
            type="email"
            placeholder="Enter Email"
            value={candidateData.email}
            onChange={(e) =>
              setCandidateData({
                ...candidateData,
                email: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Skills (React, Node.js, MongoDB)"
            value={candidateData.skills}
            onChange={(e) =>
              setCandidateData({
                ...candidateData,
                skills: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Experience (Years)"
            value={candidateData.experience}
            onChange={(e) =>
              setCandidateData({
                ...candidateData,
                experience: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Projects / Bio"
            value={candidateData.projects}
            onChange={(e) =>
              setCandidateData({
                ...candidateData,
                projects: e.target.value,
              })
            }
          ></textarea>

          <div className="button-group">
            <button type="submit">
              Add Candidate
            </button>
          </div>
        </form>
      </div>

      {/* Job Requirement */}
      <div className="card">
        <h2>Job Requirement</h2>

        <input
          type="text"
          placeholder="Required Skills"
          value={jobData.requiredSkills}
          onChange={(e) =>
            setJobData({
              ...jobData,
              requiredSkills: e.target.value,
            })
          }
        />

        <input
          type="number"
          placeholder="Minimum Experience"
          value={jobData.minExperience}
          onChange={(e) =>
            setJobData({
              ...jobData,
              minExperience: e.target.value,
            })
          }
        />

        <div className="button-group">
          <button onClick={matchCandidates}>
            Match Candidates
          </button>

          <button onClick={aiShortlisting}>
            AI Shortlisting
          </button>
        </div>
      </div>

      {/* All Candidates */}
      <div className="card">
        <h2>All Candidates</h2>

        {candidates.length === 0 ? (
          <p>No Candidates Found</p>
        ) : (
          candidates.map((candidate) => (
            <div className="candidate" key={candidate._id}>
              <h3>{candidate.name}</h3>

              <p>
                <strong>Email:</strong> {candidate.email}
              </p>

              <p>
                <strong>Skills:</strong>{" "}
                {candidate.skills.join(", ")}
              </p>

              <p>
                <strong>Experience:</strong>{" "}
                {candidate.experience} years
              </p>

              <p>
                <strong>Projects:</strong>{" "}
                {candidate.projects}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Matched Candidates */}
      <div className="card">
        <h2>Matched Candidates</h2>

        {matchedCandidates.length === 0 ? (
          <p>No Matched Candidates Yet</p>
        ) : (
          matchedCandidates.map((candidate, index) => (
            <div className="candidate" key={index}>
              <h3>{candidate.name}</h3>

              <p>
                <strong>Match Score:</strong>{" "}
                {candidate.matchScore}%
              </p>

              <p>
                <strong>Matched Skills:</strong>{" "}
                {candidate.matchedSkills.join(", ")}
              </p>

              <p>
                <strong>Rank:</strong>{" "}
                {candidate.rank}
              </p>
            </div>
          ))
        )}
      </div>

      {/* AI Recommendation */}
      <div className="card">
        <h2>AI Recommendation</h2>

        {aiResult ? (
          <pre>{aiResult}</pre>
        ) : (
          <p>No AI Recommendation Yet</p>
        )}
      </div>
    </div>
  );
}

export default App;