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
import Settings from "./pages/Settings";

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
          <Reports />
        </POSLayout>
      )} />
      <Route path="/reports" component={() => (
        <POSLayout>
          <Reports />
        </POSLayout>
      )} />
      <Route path="/settings" component={() => (
        <POSLayout>
          <Settings />
        </POSLayout>
      )} />
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
