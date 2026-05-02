import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
};

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    module: "all",
    action: "all",
    limit: 100,
    search: "",
    startDate: "",
    endDate: "",
  });

  const startDateMs = filters.startDate ? new Date(filters.startDate).getTime() : undefined;
  const endDateMs = filters.endDate ? new Date(filters.endDate).getTime() : undefined;

  const { data: logsData } = trpc.audit.list.useQuery({
    module: filters.module !== "all" ? filters.module : undefined,
    action: filters.action !== "all" ? filters.action : undefined,
    limit: filters.limit,
    search: filters.search || undefined,
    startDate: startDateMs,
    endDate: endDateMs,
  });

  const { data: topUsersData } = trpc.audit.topUsers.useQuery({
    limit: 5,
    startDate: startDateMs,
    endDate: endDateMs,
  });

  const logs = logsData ?? [];
  const topUsers = topUsersData ?? [];

  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Module", "Entity", "Details"],
      ...logs.map((log: any) => [
        new Date(log.timestamp).toLocaleString("en-KE", {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false,
        }),
        log.userId || "-",
        log.action,
        log.module,
        log.entityType || "-",
        JSON.stringify(log.afterValue || {}),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">System activity log for compliance and troubleshooting</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Top Users Widget */}
      {topUsers.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Top 5 Most Active Users</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            {topUsers.map((user: any, idx: number) => (
              <div key={idx} className="bg-background p-3 rounded border border-border">
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="text-lg font-semibold">{user.userId}</div>
                <div className="text-xs text-muted-foreground mt-1">{user.actionCount} actions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Module</label>
          <Select value={filters.module} onValueChange={(value) => setFilters({ ...filters, module: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="POS">POS</SelectItem>
              <SelectItem value="Forms">Forms</SelectItem>
              <SelectItem value="Credit">Credit</SelectItem>
              <SelectItem value="Inventory">Inventory</SelectItem>
              <SelectItem value="Users">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Action</label>
          <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Limit</label>
          <Select value={filters.limit.toString()} onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Last 50</SelectItem>
              <SelectItem value="100">Last 100</SelectItem>
              <SelectItem value="500">Last 500</SelectItem>
              <SelectItem value="1000">Last 1000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Timestamp</th>
              <th className="px-4 py-2 text-left font-semibold">User</th>
              <th className="px-4 py-2 text-left font-semibold">Action</th>
              <th className="px-4 py-2 text-left font-semibold">Module</th>
              <th className="px-4 py-2 text-left font-semibold">Entity</th>
              <th className="px-4 py-2 text-left font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log: any, idx: number) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString("en-KE", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                    hour12: false,
                  })}</td>
                  <td className="px-4 py-2 font-mono text-xs">{log.userId || "-"}</td>
                  <td className="px-4 py-2">
                    <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-800"}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{log.module}</td>
                  <td className="px-4 py-2">{log.entityType} {log.entityId ? `#${log.entityId}` : ""}</td>
                  <td className="px-4 py-2 text-xs font-mono">
                    {log.afterValue ? JSON.stringify(log.afterValue).substring(0, 50) + "..." : "{}"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
