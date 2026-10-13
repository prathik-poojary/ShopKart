import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/cart");

      setCartItems(response.data.cart);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId) => {
    try {
      setAddingProductId(productId);
      setError("");

      const response = await api.post(`/cart/${productId}`);

      await fetchCart();

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add to cart";

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setAddingProductId(null);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setError("");

      const response = await api.delete(`/cart/${productId}`);

      await fetchCart();

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to remove from cart";

      setError(message);

      return {
        success: false,
        message,
      };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      setError("");

      const response = await api.patch(`/cart/${productId}`, {
        quantity,
      });

      await fetchCart();

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update quantity";

      setError(message);

      return {
        success: false,
        message,
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        fetchCart,
        addToCart,
        addingProductId,
        removeFromCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
