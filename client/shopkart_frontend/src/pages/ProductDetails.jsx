import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, addingProductId } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`);

        setProduct(response.data.product);
      } catch (error) {
        setError("Something went wrong while loading the product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const result = await addToCart(product._id);

    if (result.success) {
      console.log("Added to cart");
    }
  };

  if (loading) {
    return <div>Loading product...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div
          className="bg-white rounded-2xl shadow-sm p-6
                                grid grid-cols-1 md:grid-cols-2 gap-10"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-96 object-cover rounded-xl"
          />

          <div>
            <p className="text-gray-500 mb-2">{product.category}</p>

            <h1 className="text-3xl font-bold">{product.name}</h1>

            <p className="text-2xl font-semibold mt-5">₹{product.price}</p>

            <p className="text-gray-600 mt-6">{product.description}</p>

            <p className="mt-6 font-medium">
              {product.stock > 0
                ? `In Stock (${product.stock} available)`
                : "Out of Stock"}
            </p>

            <button
              className="mt-6 w-full bg-black text-white
                                       py-3 rounded-lg
                                       hover:bg-gray-800 transition"
              onClick={() => handleAddToCart(product._id)}
              disabled={addingProductId === product._id}
            >
              {addingProductId === product._id ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;
