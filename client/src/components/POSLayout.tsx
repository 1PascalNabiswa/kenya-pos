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
  CreditCard,
  Menu,
  X,
  FileCheck,
  Building2,
  Truck,
  LogIn,
  UtensilsCrossed,
  UserCheck,
  Activity,
  DollarSign,
  Shield,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { canAccessFeature } from "@/lib/rolePermissions";

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
      { label: "Transactions", href: "/sales/transactions", icon: <CreditCard size={14} /> },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 size={18} />,
    children: [
      { label: "Sales Report", href: "/reports/sales" },
      { label: "Inventory Report", href: "/reports/inventory" },
      { label: "Customer Spending", href: "/reports/customer-spending" },
    ],
  },
  { label: "Customer Wallet", icon: <Wallet size={18} />, href: "/wallet" },
  {
    label: "Operations",
    icon: <FileCheck size={18} />,
    children: [
      { label: "Group Feeding Forms", href: "/forms", icon: <FileCheck size={14} /> },
      { label: "Credit System", href: "/credit", icon: <CreditCard size={14} /> },
      { label: "Branches", href: "/branches", icon: <Building2 size={14} /> },
      { label: "Suppliers", href: "/suppliers", icon: <Truck size={14} /> },
    ],
  },
  { label: "Audit Trail", icon: <LogIn size={18} />, href: "/audit-logs" },
  {
    label: "Administration",
    icon: <UserCheck size={18} />,
    children: [
      { label: "User Management", href: "/users", icon: <Users size={14} /> },
      { label: "Role Permissions", href: "/role-permissions", icon: <Shield size={14} /> },
      { label: "Custom Roles", href: "/custom-roles", icon: <Shield size={14} /> },
      { label: "Audit Logs", href: "/audit-logs", icon: <LogIn size={14} /> },
      { label: "Staff Activity", href: "/staff-activity", icon: <Activity size={14} /> },
      { label: "Staff Management", href: "/staff-management", icon: <Users size={14} /> },
      { label: "Payroll", href: "/payroll", icon: <DollarSign size={14} /> },
    ],
  },
  { label: "Kitchen Display", icon: <UtensilsCrossed size={18} />, href: "/kitchen" },
  { label: "Serving Display", icon: <ShoppingBag size={18} />, href: "/serving" },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filter navigation items based on user role
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    if (!user?.role) return [];
    
    return items.filter(item => {
      // Check if user can access this item
      if (item.label === "Dashboard" && !canAccessFeature(user.role as any, 'canAccessDashboard')) return false;
      if (item.label === "Sales" && !canAccessFeature(user.role as any, 'canAccessSales')) return false;
      if (item.label === "Inventory" && !canAccessFeature(user.role as any, 'canAccessInventory')) return false;
      if (item.label === "Customers" && !canAccessFeature(user.role as any, 'canManageCustomers')) return false;
      if (item.label === "Reports" && !canAccessFeature(user.role as any, 'canViewReports')) return false;
      if (item.label === "Customer Wallet" && !canAccessFeature(user.role as any, 'canAccessWallet')) return false;
      if (item.label === "Operations" && !canAccessFeature(user.role as any, 'canAccessForms')) return false;
      if (item.label === "Audit Trail" && !canAccessFeature(user.role as any, 'canAccessAuditLogs')) return false;
      if (item.label === "Administration" && !canAccessFeature(user.role as any, 'canAccessUserManagement')) return false;
      if (item.label === "Kitchen Display" && !canAccessFeature(user.role as any, 'canAccessKitchenDisplay')) return false;
      if (item.label === "Serving Display" && !canAccessFeature(user.role as any, 'canAccessServingDisplay')) return false;
      if (item.label === "Settings" && !canAccessFeature(user.role as any, 'canAccessSettings')) return false;
      
      // Filter children items
      if (item.children) {
        item.children = item.children.filter(child => {
          if (child.label === "Products" && !canAccessFeature(user.role as any, 'canAccessInventory')) return false;
          if (child.label === "Categories" && !canAccessFeature(user.role as any, 'canAccessInventory')) return false;
          if (child.label === "Alerts" && !canAccessFeature(user.role as any, 'canAccessInventory')) return false;
          if (child.label === "Sales Transaction" && !canAccessFeature(user.role as any, 'canAccessSales')) return false;
          if (child.label === "Sales Orders" && !canAccessFeature(user.role as any, 'canAccessSales')) return false;
          if (child.label === "Invoices" && !canAccessFeature(user.role as any, 'canAccessSales')) return false;
          if (child.label === "Sales Reports" && !canAccessFeature(user.role as any, 'canViewReports')) return false;
          if (child.label === "Inventory Reports" && !canAccessFeature(user.role as any, 'canAccessInventory')) return false;
          if (child.label === "Branches" && !canAccessFeature(user.role as any, 'canAccessBranches')) return false;
          if (child.label === "Suppliers" && !canAccessFeature(user.role as any, 'canAccessSuppliers')) return false;
          if (child.label === "User Management" && !canAccessFeature(user.role as any, 'canAccessUserManagement')) return false;
          if (child.label === "Role Permissions" && !canAccessFeature(user.role as any, 'canAccessRolePermissions')) return false;
          if (child.label === "Staff Activity" && !canAccessFeature(user.role as any, 'canAccessStaffManagement')) return false;
          if (child.label === "Staff Management" && !canAccessFeature(user.role as any, 'canAccessStaffManagement')) return false;
          if (child.label === "Payroll" && !canAccessFeature(user.role as any, 'canAccessPayroll')) return false;
          return true;
        });
        return item.children.length > 0;
      }
      return true;
    });
  };

  const visibleNavItems = filterNavItems(navItems);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
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
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:static flex-shrink-0 flex flex-col h-full overflow-y-auto z-50 transform transition-all duration-300 ${
          sidebarCollapsed ? "hidden lg:hidden" : ""
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          sidebarCollapsed ? "lg:w-0" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">KenPOS</div>
              <div className="text-[10px] text-white/50">Point of Sale</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>
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
          {visibleNavItems.map((item) => {
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
                  onClick={() => setSidebarOpen(false)}
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
        </nav>

        {/* Alerts */}
        {dashboard?.lowStockCount && dashboard.lowStockCount > 0 && (
          <div className="px-3 py-2 mx-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <Link href="/inventory/alerts">
              <div className="flex items-center gap-2 text-yellow-600 hover:text-yellow-500 cursor-pointer">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">{dashboard.lowStockCount} Low Stock</span>
              </div>
            </Link>
          </div>
         )}

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-white/50 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu size={24} />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block text-muted-foreground hover:text-foreground transition-colors"
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              <PanelLeft size={20} />
            </button>
          </div>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
