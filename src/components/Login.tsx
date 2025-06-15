import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase-config";

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setError("⚠️ Vérifie ton email avant de te connecter.");
        return;
      }

      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userCredential.user.email || userCredential.user.uid);
      localStorage.setItem("displayName", userCredential.user.displayName || userCredential.user.email || "");

      onLogin(token);
      navigate("/chat");
    } catch (err: any) {
      const firebaseError = err.message || "Erreur lors de la connexion.";
      setError(firebaseError);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
        <p className="text-sm text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </form>

      {/* Made with love + GitHub link */}
      <p className="mt-4 text-gray-500 text-xs text-center">
        Made with ❤️ by MedBenMoussa &nbsp;|&nbsp;
        <a
          href="https://github.com/med1001/Privora" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          View on GitHub
        </a>
      </p>
    </div>
  );
};

export default Login;
