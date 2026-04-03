import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <Home size={18} />, href: "/" },
  {
    label: "Inventory",
    icon: <Package size={18} />,
    children: [
      { label: "Products", href: "/inventory/products" },
      { label: "Categories", href: "/inventory/categories" },
      { label: "Stock Alerts", href: "/inventory/alerts" },
    ],
  },
  {
    label: "Sales",
    icon: <ShoppingCart size={18} />,
    children: [
      { label: "Sales Transaction", href: "/sales/pos", icon: <ShoppingCart size={14} /> },
      { label: "Sales Orders", href: "/sales/orders", icon: <FileText size={14} /> },
      { label: "Invoices", href: "/sales/invoices", icon: <FileText size={14} /> },
      { label: "Customers", href: "/sales/customers", icon: <Users size={14} /> },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 size={18} />,
    children: [
      { label: "Sales Report", href: "/reports/sales" },
      { label: "Inventory Report", href: "/reports/inventory" },
    ],
  },
  { label: "Settings", icon: <Settings size={18} />, href: "/settings" },
];

function NavGroup({ item, isOpen, onToggle }: { item: NavItem; isOpen: boolean; onToggle: () => void }) {
  const [location] = useLocation();
  const isChildActive = item.children?.some((c) => location.startsWith(c.href));

  return (
    <div>
      <button
        onClick={onToggle}
        className={`sidebar-item w-full justify-between ${isChildActive ? "text-white" : ""}`}
      >
        <span className="flex items-center gap-3">
          {item.icon}
          <span>{item.label}</span>
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children?.map((child) => (
            <Link key={child.href} href={child.href}>
              <div
                className={`sidebar-item text-sm py-1.5 ${
                  location === child.href || location.startsWith(child.href)
                    ? "active"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                {child.icon && <span>{child.icon}</span>}
                {child.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();
  const logout = () => logoutMutation.mutate(undefined, { onSuccess: () => window.location.href = '/' });
  const [location] = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(["Sales"]);

  const { data: dashboard } = trpc.reports.dashboard.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">KenPOS</div>
          <p className="text-muted-foreground">Kenyan Point of Sale System</p>
        </div>
        <a
          href={getLoginUrl()}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Sign In to Continue
        </a>
      </div>
    );
  }

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="sidebar w-60 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">KenPOS</div>
              <div className="text-[10px] text-white/50">Point of Sale</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-white/40 text-xs">Search...</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 pb-4">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-2">Menu</p>
          {navItems.map((item) => {
            if (item.children) {
              return (
                <NavGroup
                  key={item.label}
                  item={item}
                  isOpen={openGroups.includes(item.label)}
                  onToggle={() => toggleGroup(item.label)}
                />
              );
            }
            return (
              <Link key={item.label} href={item.href!}>
                <div
                  className={`sidebar-item ${
                    location === item.href ? "active" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Low stock alert */}
          {dashboard && dashboard.lowStockCount > 0 && (
            <Link href="/inventory/alerts">
              <div className="sidebar-item mt-2 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30">
                <AlertTriangle size={16} />
                <span className="text-xs">Low Stock Alert</span>
                <Badge className="ml-auto bg-orange-500 text-white text-[10px]">
                  {dashboard.lowStockCount}
                </Badge>
              </div>
            </Link>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <Link href="/settings">
            <div className="sidebar-item text-sm">
              <Settings size={16} />
              <span>Settings</span>
            </div>
          </Link>
          <button onClick={logout} className="sidebar-item w-full text-sm text-red-400 hover:text-red-300">
            <LogOut size={16} />
            <span>Log out</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-white text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name ?? "User"}</p>
              <p className="text-white/40 text-[10px] capitalize">{user?.role ?? "staff"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
