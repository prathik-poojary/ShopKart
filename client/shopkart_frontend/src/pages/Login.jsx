import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag } from "lucide-react";

function Login() {
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    try {
      await api.post("/customers/login", formData);
      const response = await api.get("/customers/me");
      setUser(response.data.user || response.data);
      navigate("/home");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid Credentials");
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShoppingBag size={30} />
            <h1 className="text-3xl font-bold">ShopKart</h1>
          </div>

          <p className="text-gray-500">Welcome back</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Login</h2>

          <p className="text-gray-500 mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Email</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-lg
                                       outline-none
                                       focus:ring-2 focus:ring-black
                                       focus:border-black"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-lg
                                       outline-none
                                       focus:ring-2 focus:ring-black
                                       focus:border-black"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg
                                   font-medium
                                   hover:bg-gray-800
                                   transition"
            >
              Login
            </button>
          </form>

          {/* Register */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-black font-semibold hover:underline"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
