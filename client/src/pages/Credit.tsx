import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CreditAccountModal } from "@/components/CreditAccountModal";

import { Plus, Edit2 } from "lucide-react";

interface CreditAccount {
  id: number;
  studentName: string;
  studentId: string;
  balance: number | string;
  totalCredit: number | string;
  totalPaid: number | string;
  status: "active" | "settled" | "suspended";
}

function toNumber(value: number | string): number {
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
}

export function Credit() {

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");

  const { data: accounts, refetch } = trpc.credit.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const createMutation = trpc.credit.create.useMutation();

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(
      (account) =>
        account.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) {
alert("Please enter a student name");
      return;
    }

    try {
      await createMutation.mutateAsync({
        studentName: newStudentName,
        studentId: newStudentId,
      });

alert("Student added to credit system");

      setNewStudentName("");
      setNewStudentId("");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
alert("Error: " + (error instanceof Error ? error.message : "Failed to add student"));
    }
  };

  const handleEditClick = (account: CreditAccount) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "settled":
        return <Badge className="bg-blue-500">Settled</Badge>;
      case "suspended":
        return <Badge className="bg-red-500">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit System</h1>
          <p className="text-gray-500">Manage student credit accounts</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Add Student Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add Student to Credit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Student Name
                </label>
                <Input
                  placeholder="John Doe"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Student ID
                </label>
                <Input
                  placeholder="STU-001"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddStudent}>Add Student</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Search</label>
          <Input
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium mb-2">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {accounts?.filter((a) => a.status === "active").length || 0}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Settled</p>
          <p className="text-2xl font-bold text-blue-600">
            {accounts?.filter((a) => a.status === "settled").length || 0}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600">Suspended</p>
          <p className="text-2xl font-bold text-red-600">
            {accounts?.filter((a) => a.status === "suspended").length || 0}
          </p>
        </div>
      </div>

      {/* Credit Accounts Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Total Credit</TableHead>
              <TableHead>Total Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  {account.studentName}
                </TableCell>
                <TableCell>{account.studentId}</TableCell>
                <TableCell>KES {toNumber(account.balance).toFixed(2)}</TableCell>
                <TableCell>KES {toNumber(account.totalCredit).toFixed(2)}</TableCell>
                <TableCell>KES {toNumber(account.totalPaid).toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(account.status)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(account)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Credit Account Modal */}
      <CreditAccountModal
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Credit;
