import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/wishlist");

      setWishlist(response.data.wishlist);
    } catch (error) {
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);

      setWishlist((current) =>
        current.filter((product) => product._id !== productId),
      );
    } catch (error) {
      alert("Failed to remove product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>

          <p className="text-gray-500 mt-2">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Your wishlist is empty
            </h2>

            <p className="text-gray-500 mt-2 mb-6">
              Save products you want to come back to later.
            </p>

            <Link
              to="/products"
              className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Products */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <div
                key={product._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Image */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover"
                />

                {/* Content */}
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-1">
                    {product.category}
                  </p>

                  <h2 className="text-lg font-semibold text-gray-900">
                    {product.name}
                  </h2>

                  <p className="text-xl font-bold text-gray-900 mt-2">
                    ₹{product.price}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-5">
                    <Link
                      to={`/products/${product._id}`}
                      className="flex-1 text-center border border-gray-300 text-gray-900 py-2 rounded-md hover:bg-gray-100"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
