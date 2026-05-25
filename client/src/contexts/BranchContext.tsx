import React, { createContext, useContext, useState, useEffect } from "react";

export interface Branch {
  id: number;
  branchId: number;
  branchName: string;
  branchLocation?: string;
  isPrimary: boolean;
}

interface BranchContextType {
  selectedBranch: Branch | null;
  branches: Branch[];
  setSelectedBranch: (branch: Branch | null) => void;
  setBranches: (branches: Branch[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load selected branch from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedBranch");
    if (saved) {
      try {
        setSelectedBranch(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved branch:", e);
      }
    }
  }, []);

  // Save selected branch to localStorage
  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem("selectedBranch", JSON.stringify(selectedBranch));
    }
  }, [selectedBranch]);

  return (
    <BranchContext.Provider value={{ selectedBranch, branches, setSelectedBranch, setBranches, isLoading, setIsLoading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within BranchProvider");
  }
  return context;
}
