import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/orders`, {
          withCredentials: true,
        });

        setOrders(response.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading your orders...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <p className="text-gray-600">You haven't placed any orders yet.</p>
            <Link
              to="/products"
              className="inline-block mt-5 bg-black text-white px-5 py-3 rounded-lg"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium break-all">{order._id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Placed on</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Payment</p>
                    <p className="font-medium">{order.paymentStatus}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Order status</p>
                    <p className="font-medium">{order.status}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t mt-5 pt-4">
                  <Link
                    to={`/orders/${order._id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    View order details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
