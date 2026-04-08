import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Users } from "lucide-react";

export default function StaffManagement() {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEmploymentDialogOpen, setIsEmploymentDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    employeeId: "",
    department: "",
    position: "",
    hireDate: new Date().toISOString().split("T")[0],
    branchId: 1,
  });

  const [employmentData, setEmploymentData] = useState({
    staffProfileId: 0,
    employmentTypeId: 1,
    baseSalary: 0,
    hourlyRate: 0,
    dailyRate: 0,
    bankAccount: "",
    bankName: "",
    nssf: "",
    nhif: "",
    kra: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  // Queries
  const { data: staffList, isLoading: staffLoading, refetch: refetchStaff } = trpc.staff.list.useQuery({});
  const { data: employmentList, refetch: refetchEmployment } = trpc.payroll.listEmployment.useQuery({});

  // Mutations
  const createStaffMutation = trpc.staff.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Staff profile created successfully");
      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        employeeId: "",
        department: "",
        position: "",
        hireDate: new Date().toISOString().split("T")[0],
        branchId: 1,
      });
      setIsCreateDialogOpen(false);
      refetchStaff();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const createEmploymentMutation = trpc.payroll.createEmployment.useMutation({
    onSuccess: () => {
      toast.success("Employment record created successfully");
      setEmploymentData({
        staffProfileId: 0,
        employmentTypeId: 1,
        baseSalary: 0,
        hourlyRate: 0,
        dailyRate: 0,
        bankAccount: "",
        bankName: "",
        nssf: "",
        nhif: "",
        kra: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      setIsEmploymentDialogOpen(false);
      refetchEmployment();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreateStaff = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }

    createStaffMutation.mutate({
      ...formData,
      hireDate: new Date(formData.hireDate),
      branchId: parseInt(formData.branchId.toString()),
    });
  };

  const handleCreateEmployment = () => {
    if (!selectedStaff) {
      toast.error("Please select a staff member first");
      return;
    }

    createEmploymentMutation.mutate({
      ...employmentData,
      staffProfileId: selectedStaff.id,
      employmentTypeId: parseInt(employmentData.employmentTypeId.toString()),
      baseSalary: parseFloat(employmentData.baseSalary.toString()),
      hourlyRate: parseFloat(employmentData.hourlyRate.toString()),
      dailyRate: parseFloat(employmentData.dailyRate.toString()),
      startDate: new Date(employmentData.startDate),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage employee profiles and employment records</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Staff Profile</DialogTitle>
              <DialogDescription>Add a new staff member to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+254712345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="EMP001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Kitchen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Chef"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>

              <Button
                onClick={handleCreateStaff}
                disabled={createStaffMutation.isPending}
                className="w-full"
              >
                {createStaffMutation.isPending ? "Creating..." : "Create Staff"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">Staff Profiles</TabsTrigger>
          <TabsTrigger value="employment">Employment Records</TabsTrigger>
        </TabsList>

        {/* Staff Profiles Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Profiles</CardTitle>
              <CardDescription>All registered staff members</CardDescription>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading staff profiles...</p>
                </div>
              ) : staffList && staffList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff: any) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">
                          {staff.firstName} {staff.lastName}
                        </TableCell>
                        <TableCell>{staff.employeeId || "-"}</TableCell>
                        <TableCell>{staff.position || "-"}</TableCell>
                        <TableCell>{staff.department || "-"}</TableCell>
                        <TableCell>{staff.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            staff.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {staff.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setIsEmploymentDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            Add Employment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No staff profiles yet</p>
                  <p className="text-sm text-muted-foreground">Create your first staff member to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Records Tab */}
        <TabsContent value="employment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment Records</CardTitle>
              <CardDescription>Staff employment details and compensation</CardDescription>
            </CardHeader>
            <CardContent>
              {employmentList && employmentList.length > 0 ? (
                <div className="space-y-4">
                  {employmentList.map((emp: any) => (
                    <Card key={emp.id} className="border">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Staff Member</p>
                            <p className="text-sm font-semibold">
                              {emp.staffProfileId}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                            <p className="text-sm font-semibold">{emp.employmentTypeName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Base Salary</p>
                            <p className="text-sm font-semibold">
                              KES {emp.baseSalary?.toLocaleString() || "0"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <p className={`text-sm font-semibold ${emp.isActive ? "text-green-600" : "text-red-600"}`}>
                              {emp.isActive ? "Active" : "Inactive"}
                            </p>
                          </div>
                          {emp.hourlyRate > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                              <p className="text-sm font-semibold">
                                KES {emp.hourlyRate?.toLocaleString() || "0"}
                              </p>
                            </div>
                          )}
                          {emp.dailyRate > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Daily Rate</p>
                              <p className="text-sm font-semibold">
                                KES {emp.dailyRate?.toLocaleString() || "0"}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                            <p className="text-sm font-semibold">
                              {emp.startDate ? new Date(emp.startDate).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Bank Account</p>
                            <p className="text-sm font-semibold">{emp.bankAccount || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No employment records yet</p>
                  <p className="text-sm text-muted-foreground">Create a staff profile first, then add employment details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Employment Dialog */}
      <Dialog open={isEmploymentDialogOpen} onOpenChange={setIsEmploymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employment Record</DialogTitle>
            <DialogDescription>
              {selectedStaff && `For: ${selectedStaff.firstName} ${selectedStaff.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select
                value={employmentData.employmentTypeId.toString()}
                onValueChange={(value) =>
                  setEmploymentData({ ...employmentData, employmentTypeId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Permanent</SelectItem>
                  <SelectItem value="2">Casual</SelectItem>
                  <SelectItem value="3">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseSalary">Base Salary (Monthly)</Label>
              <Input
                id="baseSalary"
                type="number"
                value={employmentData.baseSalary}
                onChange={(e) =>
                  setEmploymentData({ ...employmentData, baseSalary: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={employmentData.hourlyRate}
                  onChange={(e) =>
                    setEmploymentData({ ...employmentData, hourlyRate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={employmentData.dailyRate}
                  onChange={(e) =>
                    setEmploymentData({ ...employmentData, dailyRate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Input
                id="bankAccount"
                value={employmentData.bankAccount}
                onChange={(e) => setEmploymentData({ ...employmentData, bankAccount: e.target.value })}
                placeholder="Account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={employmentData.bankName}
                onChange={(e) => setEmploymentData({ ...employmentData, bankName: e.target.value })}
                placeholder="Bank name"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="nssf">NSSF</Label>
                <Input
                  id="nssf"
                  value={employmentData.nssf}
                  onChange={(e) => setEmploymentData({ ...employmentData, nssf: e.target.value })}
                  placeholder="NSSF #"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nhif">NHIF</Label>
                <Input
                  id="nhif"
                  value={employmentData.nhif}
                  onChange={(e) => setEmploymentData({ ...employmentData, nhif: e.target.value })}
                  placeholder="NHIF #"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kra">KRA PIN</Label>
                <Input
                  id="kra"
                  value={employmentData.kra}
                  onChange={(e) => setEmploymentData({ ...employmentData, kra: e.target.value })}
                  placeholder="KRA PIN"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={employmentData.startDate}
                onChange={(e) => setEmploymentData({ ...employmentData, startDate: e.target.value })}
              />
            </div>

            <Button
              onClick={handleCreateEmployment}
              disabled={createEmploymentMutation.isPending}
              className="w-full"
            >
              {createEmploymentMutation.isPending ? "Creating..." : "Create Employment Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
