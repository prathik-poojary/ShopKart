import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

function Cart() {
  const {
    cartItems = [],
    loading,
    error,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const navigate = useNavigate();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>

          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mb-6">
              Add some products to your cart to see them here.
            </p>

            <a
              href="/products"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Browse Products
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Helper getters to support both nested (item.product.price) and flat (item.price) API structures
  const getItemProduct = (item) => item.product || item;
  const getItemId = (item) =>
    item.product?._id || item.product?.id || item._id || item.id;

  // Derived data safely calculated
  const totalItems = cartItems.reduce(
    (total, item) => total + (item.quantity || 0),
    0,
  );

  const subtotal = cartItems.reduce((total, item) => {
    const product = getItemProduct(item);
    const price = Number(product?.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return total + price * quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>

          <p className="text-gray-500 mt-1">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const product = getItemProduct(item);
              const productId = getItemId(item);
              const price = Number(product?.price) || 0;
              const quantity = Number(item.quantity) || 1;
              const stock = product?.stock ?? 99;

              return (
                <div
                  key={productId || index}
                  className="bg-white border border-gray-200 rounded-2xl p-5"
                >
                  <div className="flex gap-5">
                    {/* Product Image */}
                    <img
                      src={product?.image}
                      alt={product?.name || "Product image"}
                      className="w-28 h-28 object-cover rounded-xl bg-gray-100"
                    />

                    {/* Product Information */}
                    <div className="flex-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {product?.name || "Unnamed Product"}
                          </h2>

                          <p className="text-sm text-gray-500 mt-1">
                            {product?.category}
                          </p>
                        </div>

                        <p className="font-semibold text-gray-900">₹{price}</p>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(productId, quantity - 1)
                            }
                            disabled={quantity <= 1}
                            className="px-4 py-2 text-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            −
                          </button>

                          <span className="px-5 py-2 border-x border-gray-300 font-medium">
                            {quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(productId, quantity + 1)
                            }
                            disabled={quantity >= stock}
                            className="px-4 py-2 text-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(productId)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Item Total */}
                      <p className="text-sm text-gray-500 mt-4">
                        Item total:{" "}
                        <span className="font-semibold text-gray-900">
                          ₹{price * quantity}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>

                  <span className="text-xl font-bold text-gray-900">
                    ₹{subtotal}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
