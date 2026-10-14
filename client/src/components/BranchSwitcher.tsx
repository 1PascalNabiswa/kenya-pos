import React, { useEffect, useMemo } from "react";
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
import { useAuth } from "@/_core/hooks/useAuth";

export function BranchSwitcher() {
  const { user } = useAuth();
  const {
    selectedBranch,
    branches,
    setSelectedBranch,
    setBranches,
    isLoading,
    setIsLoading,
  } = useBranch();
  const { data: myBranches } = trpc.branches.getMyBranches.useQuery();
  const { data: allBranches } = trpc.branches.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const availableBranches = useMemo(
    () =>
      user?.role === "admin"
        ? (allBranches ?? []).map(branch => ({
            id: branch.id,
            branchId: branch.id,
            branchName: branch.name,
            branchLocation: branch.location ?? undefined,
            isPrimary: false,
          }))
        : (myBranches ?? []),
    [allBranches, myBranches, user?.role]
  );

  useEffect(() => {
    if (availableBranches.length > 0) {
      setBranches(availableBranches);

      const selectedStillAvailable = selectedBranch
        ? availableBranches.some(
            branch => branch.branchId === selectedBranch.branchId
          )
        : false;

      // Set primary branch as default, or repair a stale localStorage value.
      if (!selectedStillAvailable) {
        const primaryBranch = availableBranches.find(b => b.isPrimary);
        if (primaryBranch) {
          setSelectedBranch(primaryBranch);
        } else if (availableBranches.length > 0) {
          setSelectedBranch(availableBranches[0]);
        }
      }
    }
  }, [availableBranches, selectedBranch, setBranches, setSelectedBranch]);

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
          <span className="sm:hidden">
            {selectedBranch.branchName?.substring(0, 3)}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map(branch => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setSelectedBranch(branch)}
            className={selectedBranch.id === branch.id ? "bg-accent" : ""}
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{branch.branchName}</span>
              {branch.branchLocation && (
                <span className="text-xs text-muted-foreground">
                  {branch.branchLocation}
                </span>
              )}
              {branch.isPrimary && (
                <span className="text-xs text-blue-600 font-semibold">
                  Primary
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
