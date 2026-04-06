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
import { Plus, Search, Edit2, Trash2, AlertCircle } from "lucide-react";

export function UserManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    employeeId: "",
    department: "",
    position: "",
  });

  // Fetch staff list
  const { data: staffList, isLoading, refetch } = trpc.staff.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  // Create staff profile
  const createStaffMutation = trpc.staff.createProfile.useMutation({
    onSuccess: () => {
      console.log("Staff profile created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        employeeId: "",
        department: "",
        position: "",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Error:", error.message);
    },
  });

  // Update staff profile
  const updateStaffMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      console.log("Staff profile updated successfully");
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      refetch();
    },
    onError: (error) => {
      console.error("Error:", error.message);
    },
  });

  // Delete staff profile
  const deleteStaffMutation = trpc.staff.delete.useMutation({
    onSuccess: () => {
      console.log("Staff profile deleted successfully");
      refetch();
    },
    onError: (error) => {
      console.error("Error:", error.message);
    },
  });

  const handleCreateSubmit = () => {
    if (!formData.firstName || !formData.lastName) {
      console.error("First and last names are required");
      return;
    }

    createStaffMutation.mutate({
      userId: 1, // TODO: Get from context
      ...formData,
    });
  };

  const handleEditSubmit = () => {
    if (!selectedStaff) return;

    updateStaffMutation.mutate({
      id: selectedStaff.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this staff profile?")) {
      deleteStaffMutation.mutate({ id });
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    suspended: "bg-red-100 text-red-800",
    on_leave: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage staff profiles and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Staff Profile</DialogTitle>
              <DialogDescription>Add a new staff member to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <Input
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <Input
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
              <Input
                placeholder="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
              <Input
                placeholder="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                placeholder="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              <Button onClick={handleCreateSubmit} className="w-full" disabled={createStaffMutation.isPending}>
                {createStaffMutation.isPending ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, employee ID, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            {staffList?.length || 0} staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading staff members...</div>
          ) : !staffList || staffList.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Employee ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Position</th>
                    <th className="text-left py-3 px-4 font-semibold">Department</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff: any) => (
                    <tr key={staff.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{staff.employeeId || "-"}</td>
                      <td className="py-3 px-4 text-sm">{staff.position || "-"}</td>
                      <td className="py-3 px-4 text-sm">{staff.department || "-"}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{staff.phoneNumber || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[staff.status] || "bg-gray-100"}>
                          {staff.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={isEditDialogOpen && selectedStaff?.id === staff.id} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setFormData({
                                    firstName: staff.firstName,
                                    lastName: staff.lastName,
                                    phoneNumber: staff.phoneNumber || "",
                                    employeeId: staff.employeeId || "",
                                    department: staff.department || "",
                                    position: staff.position || "",
                                  });
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Staff Profile</DialogTitle>
                                <DialogDescription>Update staff member information</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Input
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                  />
                                  <Input
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                  />
                                </div>
                                <Input
                                  placeholder="Phone Number"
                                  value={formData.phoneNumber}
                                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                                <Input
                                  placeholder="Employee ID"
                                  value={formData.employeeId}
                                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                />
                                <Input
                                  placeholder="Department"
                                  value={formData.department}
                                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                                <Input
                                  placeholder="Position"
                                  value={formData.position}
                                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                                <Button onClick={handleEditSubmit} className="w-full" disabled={updateStaffMutation.isPending}>
                                  {updateStaffMutation.isPending ? "Updating..." : "Update Profile"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(staff.id)}
                            disabled={deleteStaffMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
