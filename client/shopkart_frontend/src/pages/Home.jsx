import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Home() {
  const { user } = useAuth();
  console.log("USER:", user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to ShopKart
          </h1>

          <p className="text-gray-500 mt-4 text-lg">
            Find the products you want, save your favourites, and come back
            anytime.
          </p>

          <Link
            to="/products"
            className="inline-block mt-8 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
