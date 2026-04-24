import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import POSLayout from "./components/POSLayout";
import Dashboard from "./pages/Dashboard";
import SalesTransaction from "./pages/SalesTransaction";
import SalesOrders from "./pages/SalesOrders";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import InventoryReport from "./pages/InventoryReport";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import Wallet from "./pages/Wallet";
import Forms from "./pages/Forms";
import Credit from "./pages/Credit";
import AuditLogs from "./pages/AuditLogs";
import Branches from "./pages/Branches";
import Suppliers from "@/pages/Suppliers";
import KitchenDisplay from "@/pages/KitchenDisplay";
import ServingDisplay from "@/pages/ServingDisplay";
import { UserManagement } from "@/pages/UserManagement";
import { StaffActivityLogs } from "@/pages/StaffActivityLogs";
import CustomerSpendingReports from "@/pages/CustomerSpendingReports";
import StaffManagement from "@/pages/StaffManagement";
import PayrollManagement from "@/pages/PayrollManagement";
import { RolePermissionsMatrix } from "@/pages/RolePermissionsMatrix";
import CustomRoleBuilder from "@/pages/CustomRoleBuilder";
import AuditLogViewer from "@/pages/AuditLogViewer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <POSLayout>
          <Dashboard />
        </POSLayout>
      )} />
      <Route path="/dashboard" component={() => (
        <POSLayout>
          <Dashboard />
        </POSLayout>
      )} />
      <Route path="/sales/pos" component={() => (
        <POSLayout>
          <SalesTransaction />
        </POSLayout>
      )} />
      <Route path="/sales/orders" component={() => (
        <POSLayout>
          <SalesOrders />
        </POSLayout>
      )} />
      <Route path="/inventory/products" component={() => (
        <POSLayout>
          <Inventory tab="products" />
        </POSLayout>
      )} />
      <Route path="/inventory" component={() => (
        <POSLayout>
          <Inventory />
        </POSLayout>
      )} />
      <Route path="/inventory/alerts" component={() => (
        <POSLayout>
          <Inventory tab="alerts" />
        </POSLayout>
      )} />
      <Route path="/inventory/categories" component={() => (
        <POSLayout>
          <Inventory tab="categories" />
        </POSLayout>
      )} />
      <Route path="/sales/customers" component={() => (
        <POSLayout>
          <Customers />
        </POSLayout>
      )} />
      <Route path="/sales/invoices" component={() => (
        <POSLayout>
          <SalesOrders />
        </POSLayout>
      )} />
      <Route path="/customers" component={() => (
        <POSLayout>
          <Customers />
        </POSLayout>
      )} />
      <Route path="/reports/sales" component={() => (
        <POSLayout>
          <Reports />
        </POSLayout>
      )} />
      <Route path="/reports/inventory" component={() => (
        <POSLayout>
          <InventoryReport />
        </POSLayout>
      )} />
      <Route path="/reports" component={() => (
        <POSLayout>
          <Reports />
        </POSLayout>
      )} />
      <Route path="/reports/customer-spending" component={() => (
        <POSLayout>
          <CustomerSpendingReports />
        </POSLayout>
      )} />
      <Route path="/settings" component={() => (
        <POSLayout>
          <Settings />
        </POSLayout>
      )} />
      <Route path="/transactions" component={() => (
        <POSLayout>
          <Transactions />
        </POSLayout>
      )} />
      <Route path="/sales/transactions" component={() => (
        <POSLayout>
          <Transactions />
        </POSLayout>
      )} />
      <Route path="/wallet" component={() => (
        <POSLayout>
          <Wallet />
        </POSLayout>
      )} />
      <Route path="/customers/wallet" component={() => (
        <POSLayout>
          <Wallet />
        </POSLayout>
      )} />
      <Route path="/forms" component={() => (
        <POSLayout>
          <Forms />
        </POSLayout>
      )} />
      <Route path="/credit" component={() => (
        <POSLayout>
          <Credit />
        </POSLayout>
      )} />
      <Route path="/audit-logs" component={() => (
        <POSLayout>
          <AuditLogs />
        </POSLayout>
      )} />
      <Route path="/branches" component={() => (
        <POSLayout>
          <Branches />
        </POSLayout>
      )} />
      <Route path="/suppliers" component={() => (
        <POSLayout>
          <Suppliers />
        </POSLayout>
      )} />
      <Route path="/users" component={() => (
        <POSLayout>
          <UserManagement />
        </POSLayout>
      )} />
      <Route path="/staff-activity" component={() => (
        <POSLayout>
          <StaffActivityLogs />
        </POSLayout>
      )} />
      <Route path="/staff-management" component={() => (
        <POSLayout>
          <StaffManagement />
        </POSLayout>
      )} />
      <Route path="/payroll" component={() => (
        <POSLayout>
          <PayrollManagement />
        </POSLayout>
      )} />
      <Route path="/role-permissions" component={() => (
        <POSLayout>
          <RolePermissionsMatrix />
        </POSLayout>
      )} />
      <Route path="/custom-roles" component={() => (
        <POSLayout>
          <CustomRoleBuilder />
        </POSLayout>
      )} />
      <Route path="/audit-logs" component={() => (
        <POSLayout>
          <AuditLogViewer />
        </POSLayout>
      )} />
      <Route path="/kitchen" component={KitchenDisplay} />
      <Route path="/serving" component={ServingDisplay} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
