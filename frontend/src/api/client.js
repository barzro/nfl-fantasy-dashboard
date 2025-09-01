import axios from "axios";

// Use backend from Vercel env, or fallback to local dev
const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export default client;

