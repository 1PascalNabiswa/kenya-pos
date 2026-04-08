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
import { Plus, DollarSign, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function PayrollManagement() {
  const [selectedEmployment, setSelectedEmployment] = useState<any>(null);
  const [isCreatePayrollDialogOpen, setIsCreatePayrollDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<any>(null);

  const [payrollData, setPayrollData] = useState({
    payrollPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    payrollPeriodEnd: new Date().toISOString().split("T")[0],
    grossSalary: 0,
    totalDeductions: 0,
    totalBonuses: 0,
    netPay: 0,
    paymentMethod: "bank_transfer",
    notes: "",
  });

  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split("T")[0],
    hoursWorked: 8,
    status: "present",
    notes: "",
  });

  // Queries
  const { data: employmentList, isLoading: employmentLoading, refetch: refetchEmployment } = trpc.payroll.listEmployment.useQuery({});
  const { data: payrollRecords, refetch: refetchPayroll } = trpc.payroll.getPayroll.useQuery(
    selectedEmployment ? { staffEmploymentId: selectedEmployment.id } : undefined,
    { enabled: !!selectedEmployment }
  );
  const { data: payslips, refetch: refetchPayslips } = trpc.payroll.getPayslips.useQuery(
    selectedEmployment ? { staffEmploymentId: selectedEmployment.id } : undefined,
    { enabled: !!selectedEmployment }
  );

  // Mutations
  const createPayrollMutation = trpc.payroll.createPayroll.useMutation({
    onSuccess: () => {
      toast.success("Payroll record created successfully");
      setPayrollData({
        payrollPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
        payrollPeriodEnd: new Date().toISOString().split("T")[0],
        grossSalary: 0,
        totalDeductions: 0,
        totalBonuses: 0,
        netPay: 0,
        paymentMethod: "bank_transfer",
        notes: "",
      });
      setIsCreatePayrollDialogOpen(false);
      refetchPayroll();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const recordAttendanceMutation = trpc.payroll.recordAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance recorded successfully");
      setAttendanceData({
        date: new Date().toISOString().split("T")[0],
        hoursWorked: 8,
        status: "present",
        notes: "",
      });
      setIsAttendanceDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updatePayrollStatusMutation = trpc.payroll.updatePayrollStatus.useMutation({
    onSuccess: () => {
      toast.success("Payroll status updated successfully");
      refetchPayroll();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const calculateCasualPayMutation = trpc.payroll.calculateCasualPay.useQuery(
    selectedEmployment && selectedEmployment.employmentTypeName === "Casual"
      ? {
          staffEmploymentId: selectedEmployment.id,
          startDate: new Date(payrollData.payrollPeriodStart),
          endDate: new Date(payrollData.payrollPeriodEnd),
        }
      : undefined,
    { enabled: !!selectedEmployment && selectedEmployment.employmentTypeName === "Casual" }
  );

  const calculatePermanentPayMutation = trpc.payroll.calculatePermanentPay.useQuery(
    selectedEmployment && selectedEmployment.employmentTypeName === "Permanent"
      ? {
          staffEmploymentId: selectedEmployment.id,
        }
      : undefined,
    { enabled: !!selectedEmployment && selectedEmployment.employmentTypeName === "Permanent" }
  );

  const handleCreatePayroll = () => {
    if (!selectedEmployment) {
      toast.error("Please select an employment record");
      return;
    }

    createPayrollMutation.mutate({
      staffEmploymentId: selectedEmployment.id,
      payrollPeriodStart: new Date(payrollData.payrollPeriodStart),
      payrollPeriodEnd: new Date(payrollData.payrollPeriodEnd),
      grossSalary: parseFloat(payrollData.grossSalary.toString()),
      totalDeductions: parseFloat(payrollData.totalDeductions.toString()),
      totalBonuses: parseFloat(payrollData.totalBonuses.toString()),
      netPay: parseFloat(payrollData.netPay.toString()),
      paymentMethod: payrollData.paymentMethod as any,
      notes: payrollData.notes || undefined,
    });
  };

  const handleRecordAttendance = () => {
    if (!selectedStaffProfile) {
      toast.error("Please select a staff member");
      return;
    }

    recordAttendanceMutation.mutate({
      staffProfileId: selectedStaffProfile.staffProfileId,
      date: new Date(attendanceData.date),
      hoursWorked: parseFloat(attendanceData.hoursWorked.toString()),
      status: attendanceData.status as any,
      notes: attendanceData.notes || undefined,
    });
  };

  const handleMarkAsPaid = (payrollRecordId: number) => {
    updatePayrollStatusMutation.mutate({
      payrollRecordId,
      status: "paid",
      paymentDate: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">Process salaries and manage employee payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Attendance</DialogTitle>
                <DialogDescription>Record daily attendance for staff members</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Staff Member</Label>
                  <Select
                    value={selectedStaffProfile?.id?.toString() || ""}
                    onValueChange={(value) => {
                      const emp = employmentList?.find((e: any) => e.staffProfileId === parseInt(value));
                      setSelectedStaffProfile(emp);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentList?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.staffProfileId.toString()}>
                          Staff ID: {emp.staffProfileId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendanceDate">Date</Label>
                  <Input
                    id="attendanceDate"
                    type="date"
                    value={attendanceData.date}
                    onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    value={attendanceData.hoursWorked}
                    onChange={(e) =>
                      setAttendanceData({ ...attendanceData, hoursWorked: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={attendanceData.status}
                    onValueChange={(value) => setAttendanceData({ ...attendanceData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={attendanceData.notes}
                    onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>

                <Button
                  onClick={handleRecordAttendance}
                  disabled={recordAttendanceMutation.isPending}
                  className="w-full"
                >
                  {recordAttendanceMutation.isPending ? "Recording..." : "Record Attendance"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePayrollDialogOpen} onOpenChange={setIsCreatePayrollDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Payroll Record</DialogTitle>
                <DialogDescription>Process salary for selected employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select
                    value={selectedEmployment?.id?.toString() || ""}
                    onValueChange={(value) => {
                      const emp = employmentList?.find((e: any) => e.id === parseInt(value));
                      setSelectedEmployment(emp);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentList?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          Staff {emp.staffProfileId} - {emp.employmentTypeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={payrollData.payrollPeriodStart}
                      onChange={(e) =>
                        setPayrollData({ ...payrollData, payrollPeriodStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={payrollData.payrollPeriodEnd}
                      onChange={(e) =>
                        setPayrollData({ ...payrollData, payrollPeriodEnd: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grossSalary">Gross Salary</Label>
                  <Input
                    id="grossSalary"
                    type="number"
                    value={payrollData.grossSalary}
                    onChange={(e) =>
                      setPayrollData({ ...payrollData, grossSalary: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deductions">Total Deductions</Label>
                    <Input
                      id="deductions"
                      type="number"
                      value={payrollData.totalDeductions}
                      onChange={(e) =>
                        setPayrollData({ ...payrollData, totalDeductions: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonuses">Total Bonuses</Label>
                    <Input
                      id="bonuses"
                      type="number"
                      value={payrollData.totalBonuses}
                      onChange={(e) =>
                        setPayrollData({ ...payrollData, totalBonuses: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netPay">Net Pay</Label>
                  <Input
                    id="netPay"
                    type="number"
                    value={payrollData.netPay}
                    onChange={(e) =>
                      setPayrollData({ ...payrollData, netPay: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={payrollData.paymentMethod}
                    onValueChange={(value) => setPayrollData({ ...payrollData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={payrollData.notes}
                    onChange={(e) => setPayrollData({ ...payrollData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>

                <Button
                  onClick={handleCreatePayroll}
                  disabled={createPayrollMutation.isPending}
                  className="w-full"
                >
                  {createPayrollMutation.isPending ? "Creating..." : "Create Payroll Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Payroll Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>All payroll transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {employmentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading payroll records...</p>
                </div>
              ) : payrollRecords && payrollRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Bonuses</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.payrollPeriodStart).toLocaleDateString()} -{" "}
                          {new Date(record.payrollPeriodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>KES {record.grossSalary?.toLocaleString()}</TableCell>
                        <TableCell>KES {record.totalDeductions?.toLocaleString()}</TableCell>
                        <TableCell>KES {record.totalBonuses?.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">KES {record.netPay?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            record.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : record.paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {record.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.paymentStatus === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(record.id)}
                              disabled={updatePayrollStatusMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payroll records yet</p>
                  <p className="text-sm text-muted-foreground">Create your first payroll record to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payslips</CardTitle>
              <CardDescription>Generated payslips for employees</CardDescription>
            </CardHeader>
            <CardContent>
              {payslips && payslips.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payslip #</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((payslip: any) => (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">{payslip.payslipNumber}</TableCell>
                        <TableCell>
                          {new Date(payslip.payrollPeriodStart).toLocaleDateString()} -{" "}
                          {new Date(payslip.payrollPeriodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>KES {payslip.grossSalary?.toLocaleString()}</TableCell>
                        <TableCell>KES {payslip.totalDeductions?.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">KES {payslip.netPay?.toLocaleString()}</TableCell>
                        <TableCell>{new Date(payslip.generatedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payslips yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employmentList?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active employment records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payrollRecords?.filter((r: any) => r.paymentStatus === "pending").length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Payroll (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KES{" "}
                  {(
                    payrollRecords?.reduce((sum: number, r: any) => sum + (r.netPay || 0), 0) || 0
                  ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Net pay total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KES{" "}
                  {(
                    payrollRecords?.reduce((sum: number, r: any) => sum + (r.totalDeductions || 0), 0) || 0
                  ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All deductions this month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
