import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Shield, Trash2, AlertCircle, CheckCircle } from "lucide-react";

type UserRole = "admin" | "manager" | "supervisor" | "cashier" | "waiter" | "inventory_manager" | "kitchen_staff";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "manager", label: "Manager", description: "Operational oversight" },
  { value: "supervisor", label: "Supervisor", description: "Team lead" },
  { value: "cashier", label: "Cashier", description: "Payment processing" },
  { value: "waiter", label: "Waiter", description: "Order taking & service" },
  { value: "inventory_manager", label: "Inventory Manager", description: "Stock management" },
  { value: "kitchen_staff", label: "Kitchen Staff", description: "Food preparation" },
];

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-purple-100 text-purple-800",
  supervisor: "bg-blue-100 text-blue-800",
  cashier: "bg-green-100 text-green-800",
  waiter: "bg-yellow-100 text-yellow-800",
  inventory_manager: "bg-orange-100 text-orange-800",
  kitchen_staff: "bg-pink-100 text-pink-800",
};

export function UserManagement() {
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("waiter");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Fetch users list
  const { data: users, isLoading, refetch } = trpc.user.list.useQuery({
    search: search || undefined,
  });

  // Create user mutation
  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setFormData({ name: "", email: "" });
      setSelectedRole("waiter");
      setCreateError(null);
      refetch();
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to create user";
      setCreateError(errorMessage);
    },
  });

  // Update user role mutation
  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      setUpdateError(null);
      refetch();
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to update user role";
      setUpdateError(errorMessage);
    },
  });

  // Delete user mutation
  const deleteUserMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      setDeleteError(null);
      refetch();
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to delete user";
      setDeleteError(errorMessage);
    },
  });

  const handleCreateSubmit = () => {
    if (!formData.name || !formData.email) {
      setCreateError("Name and email are required");
      return;
    }

    createUserMutation.mutate({
      name: formData.name,
      email: formData.email,
      role: selectedRole,
    });
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setDeleteError(null);
      deleteUserMutation.mutate({ id });
    }
  };

  const handleChangeRole = (userId: number, newRole: UserRole) => {
    setUpdateError(null);
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const getRoleLabel = (role: UserRole) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Create users and manage their roles and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system and assign a role</DialogDescription>
            </DialogHeader>
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateSubmit} 
                className="w-full" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <div key={role.value} className="border rounded-lg p-3">
                <Badge className={roleColors[role.value]}>{role.label}</Badge>
                <p className="text-sm text-gray-600 mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {(deleteError || updateError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError || updateError}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {users?.length || 0} user{users?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Joined</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{user.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email || "-"}</td>
                      <td className="py-3 px-4">
                        <Select 
                          value={user.role} 
                          onValueChange={(newRole) => handleChangeRole(user.id, newRole as UserRole)}
                        >
                          <SelectTrigger className="w-40">
                            <Badge className={roleColors[user.role as UserRole]}>
                              {getRoleLabel(user.role as UserRole)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
