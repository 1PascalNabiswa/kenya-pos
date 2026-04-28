import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Download } from "lucide-react";

interface CreditTransaction {
  id: number;
  creditAccountId: number;
  orderId: number | null;
  amount: number | string;
  type: "charge" | "payment" | "adjustment";
  description: string | null;
  createdAt: Date | string;
}

interface CreditTransactionLogProps {
  creditAccountId: number;
  studentName: string;
}

function toNumber(value: number | string): number {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-KE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getTransactionBadge(type: string) {
  switch (type) {
    case "charge":
      return <Badge className="bg-red-100 text-red-800">Charge</Badge>;
    case "payment":
      return <Badge className="bg-green-100 text-green-800">Payment</Badge>;
    case "adjustment":
      return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
}

export function CreditTransactionLog({
  creditAccountId,
  studentName,
}: CreditTransactionLogProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: transactions = [], refetch, isLoading } = trpc.credit.history.useQuery(
    { creditAccountId },
    { refetchInterval: 5000 } // Auto-refresh every 5 seconds
  );

  const filteredTransactions = (transactions as CreditTransaction[]).filter((tx) => {
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesSearch =
      searchTerm === "" ||
      (tx.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      tx.id.toString().includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "Amount (KES)",
      "Description",
      "Order ID",
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      formatDate(tx.createdAt),
      tx.type,
      toNumber(tx.amount).toFixed(2),
      tx.description || "-",
      tx.orderId || "-",
    ]);

    const csvContent = [
      `Credit Transaction Log - ${studentName}`,
      `Generated: ${new Date().toLocaleString("en-KE")}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-transactions-${studentName}-${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <p className="text-sm text-gray-600">
            All credit transactions for {studentName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by description or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="charge">Charge</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-600">
            {transactions.length === 0
              ? "No transactions yet"
              : "No transactions match your filters"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount (KES)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {tx.type === "charge" ? "-" : "+"}
                    KES {toNumber(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {tx.description || "-"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {tx.orderId ? `#${tx.orderId}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
        <div>
          <p className="font-medium">
            Total Transactions: {filteredTransactions.length}
          </p>
          <p className="text-gray-600">
            {isLoading ? "Loading..." : "Auto-refreshing every 5 seconds"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">
            Total Amount: KES{" "}
            {filteredTransactions
              .reduce((sum, tx) => {
                const amount = toNumber(tx.amount);
                return sum + (tx.type === "charge" ? -amount : amount);
              }, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
