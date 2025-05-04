import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Explicitly type state and event parameter
const Register = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null); // Type as string | null
  const navigate = useNavigate();

  // Explicitly type event as React.FormEvent
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      const response = await fetch("http://13.48.55.91:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Registration successful! Check your email for verification.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(data.error); // Corrected message state handling
      }
    } catch (error) {
      setMessage("Server error. Try again later."); // Corrected message state handling
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">Register</h2>
        {message && <p className="text-red-500">{message}</p>} {/* Conditionally render message */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-800">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
