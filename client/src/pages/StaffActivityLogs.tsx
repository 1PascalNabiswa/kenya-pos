import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTIVITY_TYPES = [
  "login",
  "logout",
  "create_order",
  "process_payment",
  "adjust_inventory",
  "manage_customer",
  "create_form",
  "manage_credit",
  "view_report",
  "manage_user",
  "change_password",
  "role_change",
  "status_change",
];

const activityColors: Record<string, string> = {
  login: "bg-blue-100 text-blue-800",
  logout: "bg-gray-100 text-gray-800",
  create_order: "bg-green-100 text-green-800",
  process_payment: "bg-purple-100 text-purple-800",
  adjust_inventory: "bg-orange-100 text-orange-800",
  manage_customer: "bg-cyan-100 text-cyan-800",
  create_form: "bg-indigo-100 text-indigo-800",
  manage_credit: "bg-pink-100 text-pink-800",
  view_report: "bg-yellow-100 text-yellow-800",
  manage_user: "bg-red-100 text-red-800",
  change_password: "bg-violet-100 text-violet-800",
  role_change: "bg-rose-100 text-rose-800",
  status_change: "bg-amber-100 text-amber-800",
};

export function StaffActivityLogs() {
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState(7);

  // Fetch activity logs
  const { data: logs, isLoading } = trpc.staff.getActivityLogs.useQuery({
    activityType: activityTypeFilter || undefined,
    days,
    limit: 500,
  });

  const handleExport = () => {
    if (!logs) return;

    const csv = [
      ["Date", "Time", "User ID", "Activity Type", "Description", "Entity Type", "Entity ID", "Status"],
      ...logs.map((log: any) => [
        new Date(log.createdAt).toLocaleDateString(),
        new Date(log.createdAt).toLocaleTimeString(),
        log.userId,
        log.activityType,
        log.description || "",
        log.entityType || "",
        log.entityId || "",
        log.status,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs?.filter((log: any) =>
    search === "" ||
    log.description?.toLowerCase().includes(search.toLowerCase()) ||
    log.userId.toString().includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Activity Logs</h1>
          <p className="text-gray-600 mt-1">Monitor staff activities and system events</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user ID or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Activities</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={days.toString()} onValueChange={(val) => setDays(parseInt(val))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            {filteredLogs.length} activities in the last {days} day{days !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading activity logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No activities found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={activityColors[log.activityType] || "bg-gray-100"}>
                        {log.activityType.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-sm font-medium">User ID: {log.userId}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {log.entityType && (
                      <span>{log.entityType} {log.entityId && `#${log.entityId}`}</span>
                    )}
                    <Badge variant="outline" className={log.status === "success" ? "bg-green-50" : "bg-red-50"}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
