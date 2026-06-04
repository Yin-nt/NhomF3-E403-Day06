import { MapPin, Bell, User, Globe, ChevronDown, Compass } from "lucide-react";

interface NavbarProps {
  onNewTrip: () => void;
}

export function Navbar({ onNewTrip }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="text-orange-500 font-bold text-lg">VietTravel</span>
        </div>

        {/* Destination input */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 flex-1 max-w-xs cursor-pointer hover:border-orange-300 transition-colors">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">Nhập điểm đến...</span>
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {["Điểm đến", "My Travel Map", "Tra cứu đơn hàng", "Viết ngay"].map((item) => (
            <button
              key={item}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
            >
              {item}
            </button>
          ))}
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
            Du Lịch <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewTrip}
            className="hidden md:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          >
            <Globe className="w-4 h-4" />
            Lên kế hoạch
          </button>
          <button className="relative p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
