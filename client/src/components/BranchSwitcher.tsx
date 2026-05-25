import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBranch } from "@/contexts/BranchContext";

export function BranchSwitcher() {
  const { selectedBranch, branches, setSelectedBranch, setBranches, isLoading, setIsLoading } = useBranch();
  const { data: myBranches } = trpc.branches.getMyBranches.useQuery();

  useEffect(() => {
    if (myBranches && myBranches.length > 0) {
      setBranches(myBranches);
      
      // Set primary branch as default if not already selected
      if (!selectedBranch) {
        const primaryBranch = myBranches.find(b => b.isPrimary);
        if (primaryBranch) {
          setSelectedBranch(primaryBranch);
        } else if (myBranches.length > 0) {
          setSelectedBranch(myBranches[0]);
        }
      }
    }
  }, [myBranches, selectedBranch, setBranches, setSelectedBranch]);

  if (!selectedBranch || branches.length === 0) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Building2 className="h-4 w-4" />
        <span>No Branches</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedBranch.branchName}</span>
          <span className="sm:hidden">{selectedBranch.branchName?.substring(0, 3)}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setSelectedBranch(branch)}
            className={selectedBranch.id === branch.id ? "bg-accent" : ""}
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{branch.branchName}</span>
              {branch.branchLocation && (
                <span className="text-xs text-muted-foreground">{branch.branchLocation}</span>
              )}
              {branch.isPrimary && (
                <span className="text-xs text-blue-600 font-semibold">Primary</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
