import React, { useState, useEffect } from "react";
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

  const phrases = [
    "No cookies.",
    "No ads.",
    "Secure end-to-end encryption.",
    "No moderation or manipulation.",
    "100% open source — nothing to hide.",
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (typing) {
      if (displayedText.length < phrases[currentPhraseIndex].length) {
        timeoutId = setTimeout(() => {
          setDisplayedText(
            phrases[currentPhraseIndex].slice(0, displayedText.length + 1)
          );
        }, 100);
      } else {
        timeoutId = setTimeout(() => {
          setTyping(false);
        }, 2000);
      }
    } else {
      if (displayedText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayedText(
            phrases[currentPhraseIndex].slice(0, displayedText.length - 1)
          );
        }, 50);
      } else {
        setTyping(true);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [displayedText, typing, currentPhraseIndex, phrases]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        setError("Please verify your email before logging in.");
        return;
      }

      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem(
        "userId",
        userCredential.user.email || userCredential.user.uid
      );
      localStorage.setItem(
        "displayName",
        userCredential.user.displayName || userCredential.user.email || ""
      );

      onLogin(token);
      navigate("/chat");
    } catch (err: any) {
      const firebaseError = err.message || "Login error.";
      setError(firebaseError);
    }
  };

  return (
<div className="min-h-screen bg-[#f9fafb] flex flex-col justify-between px-4 py-8">
  {/* Main container */}
  <div className="flex flex-col lg:flex-row items-center justify-center w-full flex-1 max-w-5xl mx-auto gap-y-10 lg:gap-x-12 lg:gap-y-0">
    
    {/* Left block — Logo + Texte */}
    <div className="w-full max-w-sm text-center lg:text-left">
      <img
        src="/logo.png"
        alt="Privora Logo"
          className="w-36 h-36 lg:w-40 lg:h-40 mb-4 mx-auto lg:mx-0"
      />
      <div className="h-16">
        <p className="text-md text-gray-700 font-mono tracking-wide whitespace-pre">
          {displayedText}
          <span className="blinking-cursor">|</span>
        </p>
      </div>
    </div>

    {/* Login form */}
    <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 text-center">Login</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Login
        </button>
      </form>

      <p className="text-sm text-center text-gray-600">
        Don’t have an account?{" "}
        <Link
          to="/register"
          className="text-blue-500 hover:underline font-medium"
        >
          Register here
        </Link>
      </p>
    </div>
  </div>

  {/* Footer */}
  <p className="mt-10 text-xs text-gray-400 text-center">
    Made with ❤️ by MedBenMoussa &nbsp;|&nbsp;
    <a
      href="https://github.com/med1001/Privora"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:underline"
    >
      View on GitHub
    </a>
  </p>

  {/* Blinking cursor animation */}
  <style>
    {`
      .blinking-cursor {
        font-weight: 100;
        font-size: 24px;
        color: #666;
        animation: blink 1s step-start infinite;
      }
      @keyframes blink {
        50% {
          opacity: 0;
        }
      }
    `}
  </style>
</div>

  );
};

export default Login;
