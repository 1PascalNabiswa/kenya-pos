import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { rolePermissionsMap } from "@/lib/rolePermissions";

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  isBuiltIn: boolean;
}

const PERMISSION_CATEGORIES = {
  Dashboard: ['canAccessDashboard'],
  Sales: ['canAccessSales', 'canProcessPayments'],
  Inventory: ['canAccessInventory'],
  Customers: ['canManageCustomers'],
  Reports: ['canViewReports'],
  Wallet: ['canAccessWallet'],
  Operations: ['canAccessForms', 'canAccessCredit'],
  Kitchen: ['canAccessKitchenDisplay'],
  Serving: ['canAccessServingDisplay'],
  Staff: ['canAccessStaffManagement', 'canAccessPayroll'],
  Administration: ['canAccessUserManagement', 'canAccessRolePermissions', 'canAccessAuditLogs'],
  Settings: ['canAccessSettings'],
  Branches: ['canAccessBranches'],
  Suppliers: ['canAccessSuppliers'],
};

const PERMISSION_LABELS: Record<string, string> = {
  canAccessDashboard: 'View Dashboard',
  canAccessSales: 'Access Sales',
  canProcessPayments: 'Process Payments',
  canAccessInventory: 'Manage Inventory',
  canManageCustomers: 'Manage Customers',
  canViewReports: 'View Reports',
  canAccessWallet: 'Access Wallet',
  canAccessForms: 'Manage Forms',
  canAccessCredit: 'Manage Credit',
  canAccessKitchenDisplay: 'Kitchen Display',
  canAccessServingDisplay: 'Serving Display',
  canAccessStaffManagement: 'Staff Management',
  canAccessPayroll: 'Payroll Management',
  canAccessUserManagement: 'User Management',
  canAccessRolePermissions: 'Role Permissions',
  canAccessAuditLogs: 'Audit Logs',
  canAccessSettings: 'Settings',
  canAccessBranches: 'Branches',
  canAccessSuppliers: 'Suppliers',
};

export default function CustomRoleBuilder() {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    {
      id: '1',
      name: 'admin',
      description: 'Full system access',
      permissions: rolePermissionsMap.admin,
      isBuiltIn: true,
    },
    {
      id: '2',
      name: 'manager',
      description: 'Operational oversight',
      permissions: rolePermissionsMap.manager,
      isBuiltIn: true,
    },
    {
      id: '3',
      name: 'supervisor',
      description: 'Team lead',
      permissions: rolePermissionsMap.supervisor,
      isBuiltIn: true,
    },
    {
      id: '4',
      name: 'cashier',
      description: 'Front-line operations',
      permissions: rolePermissionsMap.cashier,
      isBuiltIn: true,
    },
    {
      id: '5',
      name: 'waiter',
      description: 'Order taking',
      permissions: rolePermissionsMap.waiter,
      isBuiltIn: true,
    },
    {
      id: '6',
      name: 'inventory_manager',
      description: 'Stock management',
      permissions: rolePermissionsMap.inventory_manager,
      isBuiltIn: true,
    },
    {
      id: '7',
      name: 'kitchen_staff',
      description: 'Food preparation',
      permissions: rolePermissionsMap.kitchen_staff,
      isBuiltIn: true,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>,
  });

  const handleNewRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: Object.keys(PERMISSION_LABELS).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
    });
    setIsOpen(true);
  };

  const handleEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: { ...role.permissions },
    });
    setIsOpen(true);
  };

  const handleSaveRole = () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (editingRole) {
      setCustomRoles(customRoles.map(r =>
        r.id === editingRole.id
          ? { ...r, name: formData.name, description: formData.description, permissions: formData.permissions }
          : r
      ));
      toast.success('Role updated successfully');
    } else {
      const newRole: CustomRole = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        isBuiltIn: false,
      };
      setCustomRoles([...customRoles, newRole]);
      toast.success('Role created successfully');
    }

    setIsOpen(false);
  };

  const handleDeleteRole = (id: string) => {
    const role = customRoles.find(r => r.id === id);
    if (role?.isBuiltIn) {
      toast.error('Cannot delete built-in roles');
      return;
    }
    setCustomRoles(customRoles.filter(r => r.id !== id));
    toast.success('Role deleted successfully');
  };

  const handleDuplicateRole = (role: CustomRole) => {
    const newRole: CustomRole = {
      id: Date.now().toString(),
      name: `${role.name} (Copy)`,
      description: role.description,
      permissions: { ...role.permissions },
      isBuiltIn: false,
    };
    setCustomRoles([...customRoles, newRole]);
    toast.success('Role duplicated successfully');
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Role Builder</h1>
          <p className="text-muted-foreground">Create and manage custom roles with specific permissions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewRole} className="gap-2">
              <Plus size={18} />
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
              <DialogDescription>
                {editingRole ? 'Modify the role permissions' : 'Define permissions for the new role'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Store Manager"
                  disabled={editingRole?.isBuiltIn}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Manages store operations and staff"
                  disabled={editingRole?.isBuiltIn}
                />
              </div>

              <div>
                <Label className="mb-3 block">Permissions</Label>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                    <div key={category} className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{category}</h4>
                      <div className="space-y-2 ml-2">
                        {permissions.map(perm => (
                          <div key={perm} className="flex items-center gap-2">
                            <Checkbox
                              id={perm}
                              checked={formData.permissions[perm] || false}
                              onCheckedChange={() => handlePermissionToggle(perm)}
                              disabled={editingRole?.isBuiltIn}
                            />
                            <label htmlFor={perm} className="text-sm cursor-pointer">
                              {PERMISSION_LABELS[perm]}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRole} disabled={editingRole?.isBuiltIn}>
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {customRoles.map(role => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="capitalize">{role.name}</CardTitle>
                    {role.isBuiltIn && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Built-in</span>
                    )}
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateRole(role)}
                    className="gap-2"
                  >
                    <Copy size={14} />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRole(role)}
                    disabled={role.isBuiltIn}
                    className="gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={role.isBuiltIn}
                    className="gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(role.permissions).map(([perm, hasAccess]) => (
                  hasAccess && (
                    <div key={perm} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {PERMISSION_LABELS[perm]}
                    </div>
                  )
                ))}
              </div>
              {Object.values(role.permissions).every(v => !v) && (
                <p className="text-xs text-muted-foreground">No permissions assigned</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
