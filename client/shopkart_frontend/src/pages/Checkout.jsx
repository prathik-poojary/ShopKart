import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

function Checkout() {
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let orderId = null;
    let releaseRequestStarted = false;
    let paymentVerificationStarted = false;

    const releaseReservation = async () => {
      if (!orderId || releaseRequestStarted || paymentVerificationStarted) {
        return;
      }

      releaseRequestStarted = true;

      try {
        await axios.post(
          `${API_URL}/orders/release-reservation`,
          { orderId },
          { withCredentials: true },
        );

        console.log("Stock reservation released.");
      } catch (err) {
        console.error("Could not release stock reservation:", err);
        releaseRequestStarted = false;
      }
    };

    try {
      // Create the ShopKart order and reserve stock on the backend.
      const response = await axios.post(
        `${API_URL}/orders/create-payment-order`,
        { shippingAddress },
        { withCredentials: true },
      );

      const {
        orderId: createdOrderId,
        amount,
        currency,
        razorpayOrderId,
        keyId,
      } = response.data;

      orderId = createdOrderId;

      // Load Razorpay Checkout.
      const scriptLoaded = await new Promise((resolve) => {
        const existingScript = document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
        );

        if (existingScript) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay Checkout");
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "ShopKart",
        description: "ShopKart purchase",
        order_id: razorpayOrderId,

        handler: async (paymentResponse) => {
          paymentVerificationStarted = true;

          try {
            // Verify payment on the backend.
            await axios.post(
              `${API_URL}/orders/verify-payment`,
              {
                orderId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              { withCredentials: true },
            );

            navigate(`/order-success/${orderId}`);
          } catch (err) {
            console.error("Payment verification error:", err);

            setError(
              "Payment verification failed. Do not retry payment immediately; check your order status first.",
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: async () => {
            await releaseReservation();
            setLoading(false);
          },
        },

        theme: {
          color: "#111827",
        },
      };

      const razorpayCheckout = new window.Razorpay(options);

      razorpayCheckout.on("payment.failed", async (paymentFailure) => {
        console.error("Payment failed:", paymentFailure.error);

        await releaseReservation();

        setError(
          "Payment failed. Your cart has not been cleared. Please try again.",
        );

        setLoading(false);
      });

      razorpayCheckout.open();
    } catch (err) {
      // If checkout setup fails after stock was reserved, release it.
      await releaseReservation();

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not start checkout",
      );

      setLoading(false);
    }
  };

  const fields = [
    ["fullName", "Full name"],
    ["phone", "10-digit phone number"],
    ["addressLine1", "Address"],
    ["city", "City"],
    ["state", "State"],
    ["pincode", "6-digit PIN code"],
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>

        <p className="text-gray-500 mb-8">
          Enter your shipping details to continue to payment.
        </p>

        <form
          onSubmit={handleCheckout}
          className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5"
        >
          {fields.map(([name, label]) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {label}
              </label>

              <input
                id={name}
                name={name}
                value={shippingAddress[name]}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Continue to payment"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
