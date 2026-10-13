import { Link, useParams } from "react-router-dom";

function OrderSuccess() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-4">✓</div>

        <h1 className="text-2xl font-bold text-gray-900">Order placed!</h1>

        <p className="text-gray-600 mt-3">
          Your payment was verified. Thank you for shopping with ShopKart.
        </p>

        <p className="text-sm text-gray-500 mt-5 break-all">Order ID: {id}</p>

        <Link
          to="/orders"
          className="inline-block mt-7 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;
