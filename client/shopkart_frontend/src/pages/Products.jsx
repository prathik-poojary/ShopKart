import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [wishlistLoading, setWishlistLoading] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (search) {
          params.append("search", search);
        }

        if (category) {
          params.append("category", category);
        }

        const response = await api.get(`/products?${params.toString()}`);

        setProducts(response.data.products);
      } catch (error) {
        setError("Something went wrong while loading products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  const addToWishlist = async (productId) => {
    try {
      setWishlistLoading(productId);

      await api.post(`/wishlist/${productId}`);

      alert("Product added to wishlist");
    } catch (error) {
      if (error.response?.status === 409) {
        alert("Product already in wishlist");
      } else {
        alert("Failed to add product to wishlist");
      }
    } finally {
      setWishlistLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Products</h1>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchInput);
              }
            }}
            className="border border-gray-300 rounded-lg px-4 py-3
                                   flex-1 outline-none
                                   focus:ring-2 focus:ring-black"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3
                                   bg-white outline-none
                                   focus:ring-2 focus:ring-black"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Books">Books</option>
          </select>
        </div>

        {/* Loading */}
        {loading && <p>Loading products...</p>}

        {/* Error */}
        {error && <p>{error}</p>}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <p>No products found.</p>
        )}

        {/* Products */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl shadow-sm
                                           overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover"
                />

                <div className="p-5">
                  <h2 className="text-xl font-bold">{product.name}</h2>

                  <p className="text-gray-500 mt-1">{product.category}</p>

                  <p className="text-lg font-semibold mt-3">₹{product.price}</p>

                  <p className="mt-2">
                    {product.stock > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                  <button
                    onClick={() => addToWishlist(product._id)}
                    disabled={wishlistLoading === product._id}
                    className="w-full mt-3 border border-gray-300 text-gray-900 py-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    {wishlistLoading === product._id
                      ? "Saving..."
                      : "♡ Add to Wishlist"}
                  </button>
                  <button
                    onClick={() => navigate(`/products/${product._id}`)}
                    className="mt-4 w-full bg-black
                                                   text-white py-3 rounded-lg
                                                   hover:bg-gray-800 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;
