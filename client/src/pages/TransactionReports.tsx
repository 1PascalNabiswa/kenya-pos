import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function TransactionReports() {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [customerName, setCustomerName] = useState<string>("");

  // Quick filter buttons
  const setQuickFilter = (days: number | null) => {
    const today = new Date();
    if (days === null) {
      // All time
      setStartDate("2020-01-01");
      setEndDate(today.toISOString().split("T")[0]);
    } else if (days === 0) {
      // Today
      const dateStr = today.toISOString().split("T")[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else {
      const start = new Date(today);
      start.setDate(start.getDate() - days);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    }
  };

  // Fetch transaction logs
  const { data: logs = [], isLoading: logsLoading } = trpc.reports.transactionLogs.useQuery({
    startDate,
    endDate,
    customerName: customerName || undefined,
  });

  // Fetch payment totals
  const { data: totals, isLoading: totalsLoading } = trpc.reports.paymentTotals.useQuery({
    startDate,
    endDate,
  });

  // Calculate payment method breakdown
  const paymentBreakdown = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        cash: 0,
        card: 0,
        mpesa: 0,
        wallet: 0,
        check: 0,
        total: 0,
      };
    }

    const breakdown = {
      cash: 0,
      card: 0,
      mpesa: 0,
      wallet: 0,
      check: 0,
      total: 0,
    };

    for (const log of logs) {
      breakdown.cash += Number(log.cash || 0);
      breakdown.card += Number(log.card || 0);
      breakdown.mpesa += Number(log.mpesa || 0);
      breakdown.wallet += Number(log.wallet || 0);
      breakdown.check += Number(log.check || 0);
      breakdown.total += Number(log.totalAmount || 0);
    }

    return breakdown;
  }, [logs]);

  const isLoading = logsLoading || totalsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
        <p className="text-muted-foreground mt-2">View all transactions with detailed payment breakdown</p>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {paymentBreakdown.total.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{logs.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {paymentBreakdown.cash.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{((paymentBreakdown.cash / paymentBreakdown.total) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {paymentBreakdown.card.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{((paymentBreakdown.card / paymentBreakdown.total) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">M-Pesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {paymentBreakdown.mpesa.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{((paymentBreakdown.mpesa / paymentBreakdown.total) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {paymentBreakdown.wallet.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{((paymentBreakdown.wallet / paymentBreakdown.total) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {paymentBreakdown.check.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{((paymentBreakdown.check / paymentBreakdown.total) * 100 || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Filters */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Filters</label>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(0)}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(90)}>
                Last 90 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter(null)}>
                All Time
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Customer Name Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Customer Name</label>
            <Input
              placeholder="Search by customer name..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            {logs.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for the selected date range and filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Card</TableHead>
                    <TableHead className="text-right">M-Pesa</TableHead>
                    <TableHead className="text-right">Wallet</TableHead>
                    <TableHead className="text-right">Check</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {format(new Date(log.time), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{log.customerName}</TableCell>
                      <TableCell className="text-right">
                        {Number(log.cash) > 0 ? `KES ${Number(log.cash).toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(log.card) > 0 ? `KES ${Number(log.card).toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(log.mpesa) > 0 ? `KES ${Number(log.mpesa).toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(log.wallet) > 0 ? `KES ${Number(log.wallet).toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(log.check) > 0 ? `KES ${Number(log.check).toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        KES {Number(log.totalAmount).toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
