import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { cartItems } = useCart();

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");

      setUser(null);

      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/home" className="text-xl font-bold text-gray-900">
          ShopKart
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/home" className="text-gray-700 hover:text-black">
            Home
          </Link>

          <Link to="/products" className="text-gray-700 hover:text-black">
            Products
          </Link>

          <Link to="/wishlist" className="text-gray-700 hover:text-black">
            Wishlist
          </Link>

          <Link to="/cart" className="text-gray-700 hover:text-black">
            Cart ({totalItems})
          </Link>

          <button
            onClick={handleLogout}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
