import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders/${id}`, {
          withCredentials: true,
        });

        setOrder(response.data.order);
      } catch (err) {
        setError(
          err.response?.data?.message || "Could not load order details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600">{error || "Order not found."}</p>
        <Link to="/orders" className="inline-block mt-4 underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <Link to="/orders" className="text-sm text-blue-700 hover:underline">
          ← Back to My Orders
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-5 mb-2">
          Order Details
        </h1>

        <p className="text-sm text-gray-500 break-all">Order ID: {order._id}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <section className="bg-white border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Order Status</h2>
            <p>
              <span className="text-gray-500">Payment: </span>
              {order.paymentStatus}
            </p>
            <p className="mt-2">
              <span className="text-gray-500">Order: </span>
              {order.status}
            </p>
            <p className="mt-2">
              <span className="text-gray-500">Date: </span>
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </section>

          <section className="bg-white border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Shipping Address</h2>
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
            <p>{order.shippingAddress.pincode}</p>
          </section>
        </div>

        <section className="bg-white border rounded-2xl p-6 mt-6">
          <h2 className="text-lg font-bold mb-5">Items Ordered</h2>

          <div className="space-y-5">
            {order.items.map((item, index) => (
              <div
                key={item.product || index}
                className="flex items-center gap-4"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                  />
                )}

                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ₹{Number(item.price).toFixed(2)} × {item.quantity}
                  </p>
                </div>

                <p className="font-semibold">
                  ₹{(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t mt-6 pt-5 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OrderDetails;
