import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: number;
  userId: number;
  action: string;
  module: string;
  entityType?: string;
  entityId?: number;
  beforeValue?: any;
  afterValue?: any;
  deviceId?: string;
  ipAddress?: string;
  timestamp: Date;
  user?: { name: string; email: string };
}

// Mock data - in production this would come from tRPC
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 1,
    userId: 1,
    action: 'ROLE_ASSIGNED',
    module: 'USER_MANAGEMENT',
    entityType: 'USER_ROLE',
    entityId: 5,
    beforeValue: { role: 'waiter' },
    afterValue: { role: 'supervisor' },
    ipAddress: '192.168.1.100',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    user: { name: 'Pascal Nabiswa', email: 'pascalnabiswa@gmail.com' },
  },
  {
    id: 2,
    userId: 1,
    action: 'USER_CREATED',
    module: 'USER_MANAGEMENT',
    entityType: 'USER',
    entityId: 6,
    beforeValue: null,
    afterValue: { name: 'John Doe', email: 'john@example.com', role: 'cashier' },
    ipAddress: '192.168.1.100',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    user: { name: 'Pascal Nabiswa', email: 'pascalnabiswa@gmail.com' },
  },
  {
    id: 3,
    userId: 1,
    action: 'ROLE_ASSIGNED',
    module: 'USER_MANAGEMENT',
    entityType: 'USER_ROLE',
    entityId: 3,
    beforeValue: { role: 'manager' },
    afterValue: { role: 'admin' },
    ipAddress: '192.168.1.100',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    user: { name: 'Pascal Nabiswa', email: 'pascalnabiswa@gmail.com' },
  },
  {
    id: 4,
    userId: 1,
    action: 'ROLE_PERMISSIONS_MODIFIED',
    module: 'ROLE_MANAGEMENT',
    entityType: 'ROLE',
    entityId: 0,
    beforeValue: { role: 'manager', permissions: { canAccessPayroll: false } },
    afterValue: { role: 'manager', permissions: { canAccessPayroll: true } },
    ipAddress: '192.168.1.100',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    user: { name: 'Pascal Nabiswa', email: 'pascalnabiswa@gmail.com' },
  },
];

const ACTION_COLORS: Record<string, string> = {
  'ROLE_ASSIGNED': 'bg-blue-100 text-blue-800',
  'USER_CREATED': 'bg-green-100 text-green-800',
  'USER_DELETED': 'bg-red-100 text-red-800',
  'ROLE_PERMISSIONS_MODIFIED': 'bg-purple-100 text-purple-800',
  'CUSTOM_ROLE_CREATED': 'bg-green-100 text-green-800',
  'CUSTOM_ROLE_DELETED': 'bg-red-100 text-red-800',
  'ACCESS_DENIED': 'bg-orange-100 text-orange-800',
};

export default function AuditLogViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter(log => {
      const matchesSearch =
        log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesModule = filterModule === 'all' || log.module === filterModule;

      const logDate = new Date(log.timestamp);
      const matchesStartDate = !startDate || logDate >= new Date(startDate);
      const matchesEndDate = !endDate || logDate <= new Date(endDate);

      return matchesSearch && matchesAction && matchesModule && matchesStartDate && matchesEndDate;
    });
  }, [searchTerm, filterAction, filterModule, startDate, endDate]);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Module', 'Entity Type', 'Entity ID', 'IP Address'],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.user?.name || 'Unknown',
        log.action,
        log.module,
        log.entityType || '-',
        log.entityId || '-',
        log.ipAddress || '-',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const uniqueActions = Array.from(new Set(mockAuditLogs.map(log => log.action)));
  const uniqueModules = Array.from(new Set(mockAuditLogs.map(log => log.module)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log Viewer</h1>
          <p className="text-muted-foreground">Track all role assignments, user management, and permission changes</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={18} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by user, action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Module</label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {uniqueModules.map(module => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {mockAuditLogs.length} audit logs
        </p>

        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No audit logs found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map(log => (
            <Card key={log.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.module}</span>
                      {log.entityType && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{log.entityType}</span>
                      )}
                    </div>

                    <div className="text-sm">
                      <p className="font-medium">{log.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                    </div>

                    {(log.beforeValue || log.afterValue) && (
                      <div className="mt-2 text-xs bg-gray-50 p-2 rounded space-y-1">
                        {log.beforeValue && (
                          <p>
                            <span className="font-medium">Before:</span> {JSON.stringify(log.beforeValue)}
                          </p>
                        )}
                        {log.afterValue && (
                          <p>
                            <span className="font-medium">After:</span> {JSON.stringify(log.afterValue)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Calendar size={12} />
                      {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                    </div>
                    <p>{format(new Date(log.timestamp), 'HH:mm:ss')}</p>
                    {log.ipAddress && <p className="text-xs">IP: {log.ipAddress}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
