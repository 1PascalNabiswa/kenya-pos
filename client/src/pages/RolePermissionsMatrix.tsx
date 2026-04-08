import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

type UserRole = "admin" | "manager" | "supervisor" | "cashier" | "waiter" | "inventory_manager" | "kitchen_staff";

interface Capability {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface RolePermission {
  role: UserRole;
  label: string;
  color: string;
  permissions: Record<string, boolean>;
}

const CAPABILITIES: Capability[] = [
  // Dashboard & Analytics
  { id: "view_dashboard", name: "View Dashboard", category: "Dashboard", description: "Access main dashboard and analytics" },
  { id: "view_reports", name: "View Reports", category: "Dashboard", description: "View sales, inventory, and financial reports" },
  { id: "export_reports", name: "Export Reports", category: "Dashboard", description: "Export reports to PDF/Excel" },

  // Sales & Payments
  { id: "process_payment", name: "Process Payment", category: "Sales", description: "Handle cash, M-Pesa, card, and wallet payments" },
  { id: "create_order", name: "Create Order", category: "Sales", description: "Create new sales orders" },
  { id: "view_orders", name: "View Orders", category: "Sales", description: "View all orders and order history" },
  { id: "refund_payment", name: "Refund Payment", category: "Sales", description: "Process refunds and cancellations" },
  { id: "apply_discount", name: "Apply Discount", category: "Sales", description: "Apply discounts to orders" },

  // Inventory Management
  { id: "manage_products", name: "Manage Products", category: "Inventory", description: "Add, edit, delete products" },
  { id: "adjust_stock", name: "Adjust Stock", category: "Inventory", description: "Adjust inventory quantities" },
  { id: "view_inventory", name: "View Inventory", category: "Inventory", description: "View inventory levels and reports" },
  { id: "manage_suppliers", name: "Manage Suppliers", category: "Inventory", description: "Manage supplier information" },
  { id: "low_stock_alerts", name: "Low Stock Alerts", category: "Inventory", description: "Receive low stock notifications" },

  // Customer Management
  { id: "manage_customers", name: "Manage Customers", category: "Customers", description: "Add, edit, delete customer profiles" },
  { id: "view_customer_history", name: "View Customer History", category: "Customers", description: "View customer purchase history" },
  { id: "manage_wallet", name: "Manage Wallet", category: "Customers", description: "Load and manage customer wallets" },

  // Kitchen & Service
  { id: "view_kds", name: "View Kitchen Display", category: "Kitchen", description: "View orders in kitchen display system" },
  { id: "update_order_status", name: "Update Order Status", category: "Kitchen", description: "Update order preparation status" },
  { id: "view_serving_display", name: "View Serving Display", category: "Kitchen", description: "View ready orders for serving" },

  // Staff & Payroll
  { id: "manage_staff", name: "Manage Staff", category: "Staff", description: "Add, edit, delete staff profiles" },
  { id: "manage_payroll", name: "Manage Payroll", category: "Staff", description: "Process payroll and generate payslips" },
  { id: "record_attendance", name: "Record Attendance", category: "Staff", description: "Record staff attendance" },
  { id: "view_staff_activity", name: "View Staff Activity", category: "Staff", description: "View staff activity logs" },

  // Administration
  { id: "manage_users", name: "Manage Users", category: "Administration", description: "Create, edit, delete users and assign roles" },
  { id: "manage_settings", name: "Manage Settings", category: "Administration", description: "Configure system settings" },
  { id: "view_audit_trail", name: "View Audit Trail", category: "Administration", description: "View system audit logs" },
  { id: "manage_roles", name: "Manage Roles", category: "Administration", description: "Configure role permissions" },
];

const ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: "admin",
    label: "Admin",
    color: "bg-red-100 text-red-800",
    permissions: {
      view_dashboard: true,
      view_reports: true,
      export_reports: true,
      process_payment: true,
      create_order: true,
      view_orders: true,
      refund_payment: true,
      apply_discount: true,
      manage_products: true,
      adjust_stock: true,
      view_inventory: true,
      manage_suppliers: true,
      low_stock_alerts: true,
      manage_customers: true,
      view_customer_history: true,
      manage_wallet: true,
      view_kds: true,
      update_order_status: true,
      view_serving_display: true,
      manage_staff: true,
      manage_payroll: true,
      record_attendance: true,
      view_staff_activity: true,
      manage_users: true,
      manage_settings: true,
      view_audit_trail: true,
      manage_roles: true,
    },
  },
  {
    role: "manager",
    label: "Manager",
    color: "bg-purple-100 text-purple-800",
    permissions: {
      view_dashboard: true,
      view_reports: true,
      export_reports: true,
      process_payment: false,
      create_order: false,
      view_orders: true,
      refund_payment: true,
      apply_discount: true,
      manage_products: false,
      adjust_stock: false,
      view_inventory: true,
      manage_suppliers: false,
      low_stock_alerts: true,
      manage_customers: true,
      view_customer_history: true,
      manage_wallet: true,
      view_kds: true,
      update_order_status: false,
      view_serving_display: true,
      manage_staff: true,
      manage_payroll: true,
      record_attendance: false,
      view_staff_activity: true,
      manage_users: false,
      manage_settings: false,
      view_audit_trail: true,
      manage_roles: false,
    },
  },
  {
    role: "supervisor",
    label: "Supervisor",
    color: "bg-blue-100 text-blue-800",
    permissions: {
      view_dashboard: true,
      view_reports: true,
      export_reports: false,
      process_payment: true,
      create_order: true,
      view_orders: true,
      refund_payment: true,
      apply_discount: true,
      manage_products: false,
      adjust_stock: false,
      view_inventory: true,
      manage_suppliers: false,
      low_stock_alerts: false,
      manage_customers: true,
      view_customer_history: true,
      manage_wallet: false,
      view_kds: true,
      update_order_status: true,
      view_serving_display: true,
      manage_staff: true,
      manage_payroll: false,
      record_attendance: true,
      view_staff_activity: true,
      manage_users: false,
      manage_settings: false,
      view_audit_trail: false,
      manage_roles: false,
    },
  },
  {
    role: "cashier",
    label: "Cashier",
    color: "bg-green-100 text-green-800",
    permissions: {
      view_dashboard: false,
      view_reports: false,
      export_reports: false,
      process_payment: true,
      create_order: true,
      view_orders: true,
      refund_payment: true,
      apply_discount: true,
      manage_products: false,
      adjust_stock: false,
      view_inventory: false,
      manage_suppliers: false,
      low_stock_alerts: false,
      manage_customers: true,
      view_customer_history: true,
      manage_wallet: true,
      view_kds: false,
      update_order_status: false,
      view_serving_display: true,
      manage_staff: false,
      manage_payroll: false,
      record_attendance: false,
      view_staff_activity: false,
      manage_users: false,
      manage_settings: false,
      view_audit_trail: false,
      manage_roles: false,
    },
  },
  {
    role: "waiter",
    label: "Waiter",
    color: "bg-yellow-100 text-yellow-800",
    permissions: {
      view_dashboard: false,
      view_reports: false,
      export_reports: false,
      process_payment: false,
      create_order: true,
      view_orders: true,
      refund_payment: false,
      apply_discount: false,
      manage_products: false,
      adjust_stock: false,
      view_inventory: false,
      manage_suppliers: false,
      low_stock_alerts: false,
      manage_customers: true,
      view_customer_history: false,
      manage_wallet: false,
      view_kds: false,
      update_order_status: false,
      view_serving_display: true,
      manage_staff: false,
      manage_payroll: false,
      record_attendance: false,
      view_staff_activity: false,
      manage_users: false,
      manage_settings: false,
      view_audit_trail: false,
      manage_roles: false,
    },
  },
  {
    role: "inventory_manager",
    label: "Inventory Manager",
    color: "bg-orange-100 text-orange-800",
    permissions: {
      view_dashboard: true,
      view_reports: true,
      export_reports: true,
      process_payment: false,
      create_order: false,
      view_orders: false,
      refund_payment: false,
      apply_discount: false,
      manage_products: true,
      adjust_stock: true,
      view_inventory: true,
      manage_suppliers: true,
      low_stock_alerts: true,
      manage_customers: false,
      view_customer_history: false,
      manage_wallet: false,
      view_kds: false,
      update_order_status: false,
      view_serving_display: false,
      manage_staff: false,
      manage_payroll: false,
      record_attendance: false,
      view_staff_activity: false,
      manage_users: false,
      manage_settings: false,
      view_audit_trail: false,
      manage_roles: false,
    },
  },
  {
    role: "kitchen_staff",
    label: "Kitchen Staff",
    color: "bg-pink-100 text-pink-800",
    permissions: {
      view_dashboard: false,
      view_reports: false,
      export_reports: false,
      process_payment: false,
      create_order: false,
      view_orders: false,
      refund_payment: false,
      apply_discount: false,
      manage_products: false,
      adjust_stock: false,
      view_inventory: false,
      manage_suppliers: false,
      low_stock_alerts: false,
      manage_customers: false,
      view_customer_history: false,
      manage_wallet: false,
      view_kds: true,
      update_order_status: true,
      view_serving_display: false,
      manage_staff: false,
      manage_payroll: false,
      record_attendance: false,
      view_staff_activity: false,
      manage_users: false,
      manage_settings: false,
      view_audit_trail: false,
      manage_roles: false,
    },
  },
];

export function RolePermissionsMatrix() {
  // Group capabilities by category
  const categorizedCapabilities = CAPABILITIES.reduce((acc, cap) => {
    if (!acc[cap.category]) {
      acc[cap.category] = [];
    }
    acc[cap.category].push(cap);
    return acc;
  }, {} as Record<string, Capability[]>);

  const categories = Object.keys(categorizedCapabilities).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role Permissions Matrix</h1>
        <p className="text-gray-600 mt-1">View all roles and their assigned capabilities</p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_PERMISSIONS.map((role) => {
          const permissionCount = Object.values(role.permissions).filter(Boolean).length;
          return (
            <Card key={role.role}>
              <CardContent className="pt-6">
                <Badge className={role.color}>{role.label}</Badge>
                <div className="mt-4">
                  <div className="text-3xl font-bold">{permissionCount}</div>
                  <div className="text-sm text-gray-600">capabilities</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
          <CardDescription>Detailed view of all capabilities and role access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Capability</th>
                  {ROLE_PERMISSIONS.map((role) => (
                    <th key={role.role} className="text-center py-3 px-2 font-semibold">
                      <Badge className={role.color}>{role.label}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <div key={category}>
                    {/* Category Header */}
                    <tr className="bg-gray-100">
                      <td colSpan={ROLE_PERMISSIONS.length + 1} className="py-2 px-4 font-bold text-gray-700">
                        {category}
                      </td>
                    </tr>
                    {/* Capabilities in this category */}
                    {categorizedCapabilities[category].map((capability) => (
                      <tr key={capability.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{capability.name}</div>
                          <div className="text-xs text-gray-500">{capability.description}</div>
                        </td>
                        {ROLE_PERMISSIONS.map((role) => (
                          <td key={`${role.role}-${capability.id}`} className="text-center py-3 px-2">
                            {role.permissions[capability.id] ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Permission Granted</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-gray-300" />
              <span>Permission Denied</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
