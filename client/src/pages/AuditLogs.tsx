import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
};

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    module: "",
    action: "",
    limit: 100,
  });

  const { data: logsData } = trpc.audit.list.useQuery({
    module: filters.module || undefined,
    action: filters.action || undefined,
    limit: filters.limit,
  });

  const logs = logsData ?? [];

  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Module", "Entity", "Details"],
      ...logs.map((log: any) => [
        new Date(log.timestamp).toLocaleString(),
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

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Module</label>
          <Select value={filters.module} onValueChange={(val) => setFilters({ ...filters, module: val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Modules</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Inventory">Inventory</SelectItem>
              <SelectItem value="Forms">Forms</SelectItem>
              <SelectItem value="Credit">Credit</SelectItem>
              <SelectItem value="Users">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Action</label>
          <Select value={filters.action} onValueChange={(val) => setFilters({ ...filters, action: val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Limit</label>
          <Select value={String(filters.limit)} onValueChange={(val) => setFilters({ ...filters, limit: parseInt(val) })}>
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
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Module</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Entity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">{log.userId || "-"}</td>
                    <td className="px-6 py-4">
                      <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-800"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">{log.module}</td>
                    <td className="px-6 py-4 text-sm">
                      {log.entityType} {log.entityId ? `#${log.entityId}` : ""}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.afterValue || {}).substring(0, 50)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
