import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShoppingBag } from "lucide-react";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    try {
      const response = await api.post("/customers/register", formData);

      console.log(response.data);

      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
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

          <p className="text-gray-500">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Create Account</h2>

          <p className="text-gray-500 mb-6">Join ShopKart today</p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-lg
                                       outline-none
                                       focus:ring-2 focus:ring-black
                                       focus:border-black"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-lg
                                       outline-none
                                       focus:ring-2 focus:ring-black
                                       focus:border-black"
              />
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Phone Number
              </label>

              <input
                type="text"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-lg
                                       outline-none
                                       focus:ring-2 focus:ring-black
                                       focus:border-black"
              />
            </div>

            {/* Create Account */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg
                                   font-medium
                                   hover:bg-gray-800
                                   transition"
            >
              Create Account
            </button>
          </form>

          {/* Login */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-black font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
