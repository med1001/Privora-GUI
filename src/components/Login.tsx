import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

interface LoginProps {
  onLogin: (token: string) => void; // Function to update authentication state
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[INFO] Attempting login with username:", username);

    try {
      const response = await fetch("http://13.48.55.91:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log("[DEBUG] Server responded with status:", response.status);
      const data = await response.json();
      console.log("[DEBUG] Server response JSON:", data);

      if (response.ok && data.token) {
        console.log("[SUCCESS] Login successful. Storing token and username, navigating to chat.");

        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username); // Store username

        // Optionally, log the username here as well
        console.log("[DEBUG] Username stored:", localStorage.getItem('username'));

        onLogin(data.token); // Notify App.tsx about successful login
        navigate("/chat");   // Navigate to chat after updating authentication state
      } else {
        console.error("[ERROR] Login failed:", data.error);
        setError(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("[ERROR] Server error:", error);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            console.log("[DEBUG] Username input changed:", e.target.value);
            setUsername(e.target.value);
          }}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            console.log("[DEBUG] Password input changed:", "(hidden)");
            setPassword(e.target.value);
          }}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-800"
        >
          Login
        </button>

        <p className="mt-4 text-sm text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
