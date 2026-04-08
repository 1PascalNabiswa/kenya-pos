// This file contains all payroll-related database functions using Drizzle ORM
// To be integrated into db.ts

import { and, between, eq, isNull, sql } from "drizzle-orm";
import {
  employmentTypes,
  staffEmployment,
  deductionTypes,
  payrollDeductions,
  bonusTypes,
  payrollBonuses,
  attendanceRecords,
  payrollRecords,
  payslips,
  payrollSettings,
  staffProfiles,
} from "../drizzle/schema";

export async function createEmploymentRecord(db: any, data: {
  staffProfileId: number;
  employmentTypeId: number;
  baseSalary: number;
  hourlyRate: number;
  dailyRate: number;
  bankAccount?: string;
  bankName?: string;
  nssf?: string;
  nhif?: string;
  kra?: string;
  startDate: Date;
}) {
  const result = await db.insert(staffEmployment).values({
    staffProfileId: data.staffProfileId,
    employmentTypeId: data.employmentTypeId,
    baseSalary: data.baseSalary,
    hourlyRate: data.hourlyRate,
    dailyRate: data.dailyRate,
    bankAccount: data.bankAccount || null,
    bankName: data.bankName || null,
    nssf: data.nssf || null,
    nhif: data.nhif || null,
    kra: data.kra || null,
    startDate: data.startDate,
  });
  return result;
}

export async function getStaffEmployment(db: any, staffProfileId: number) {
  const result = await db.select().from(staffEmployment)
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(and(
      eq(staffEmployment.staffProfileId, staffProfileId),
      eq(staffEmployment.isActive, true)
    ))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    ...row.staff_employment,
    employmentTypeName: row.employment_types?.name,
  };
}

export async function getAllStaffEmployment(db: any) {
  const result = await db.select().from(staffEmployment)
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(staffEmployment.isActive, true))
    .orderBy(staffProfiles.firstName, staffProfiles.lastName);
  
  return result.map((row: any) => ({
    ...row.staff_employment,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
    employmentTypeName: row.employment_types?.name,
  }));
}

export async function recordAttendance(db: any, data: {
  staffProfileId: number;
  date: Date;
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  notes?: string;
}) {
  const result = await db.insert(attendanceRecords).values({
    staffProfileId: data.staffProfileId,
    date: data.date,
    hoursWorked: data.hoursWorked,
    status: data.status,
    notes: data.notes || null,
  });
  return result;
}

export async function getAttendanceRecords(db: any, staffProfileId: number, startDate: Date, endDate: Date) {
  const result = await db.select().from(attendanceRecords)
    .leftJoin(staffProfiles, eq(attendanceRecords.staffProfileId, staffProfiles.id))
    .where(and(
      eq(attendanceRecords.staffProfileId, staffProfileId),
      between(attendanceRecords.date, startDate, endDate)
    ))
    .orderBy(sql`${attendanceRecords.date} DESC`);
  
  return result.map((row: any) => ({
    ...row.attendance_records,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
  }));
}

export async function addPayrollDeduction(db: any, data: {
  staffEmploymentId: number;
  deductionTypeId: number;
  amount?: number;
  percentage?: number;
  startDate: Date;
  endDate?: Date;
}) {
  const result = await db.insert(payrollDeductions).values({
    staffEmploymentId: data.staffEmploymentId,
    deductionTypeId: data.deductionTypeId,
    amount: data.amount || null,
    percentage: data.percentage || null,
    startDate: data.startDate,
    endDate: data.endDate || null,
  });
  return result;
}

export async function getPayrollDeductions(db: any, staffEmploymentId: number) {
  const result = await db.select().from(payrollDeductions)
    .leftJoin(deductionTypes, eq(payrollDeductions.deductionTypeId, deductionTypes.id))
    .where(and(
      eq(payrollDeductions.staffEmploymentId, staffEmploymentId),
      eq(payrollDeductions.isActive, true)
    ))
    .orderBy(deductionTypes.name);
  
  return result.map((row: any) => ({
    ...row.payroll_deductions,
    deductionTypeName: row.deduction_types?.name,
    isStatutory: row.deduction_types?.isStatutory,
  }));
}

export async function addPayrollBonus(db: any, data: {
  staffEmploymentId: number;
  bonusTypeId: number;
  amount: number;
  paymentDate: Date;
  reason?: string;
  approvedBy?: number;
}) {
  const result = await db.insert(payrollBonuses).values({
    staffEmploymentId: data.staffEmploymentId,
    bonusTypeId: data.bonusTypeId,
    amount: data.amount,
    paymentDate: data.paymentDate,
    reason: data.reason || null,
    approvedBy: data.approvedBy || null,
  });
  return result;
}

export async function getPayrollBonuses(db: any, staffEmploymentId: number, startDate?: Date, endDate?: Date) {
  let query = db.select().from(payrollBonuses)
    .leftJoin(bonusTypes, eq(payrollBonuses.bonusTypeId, bonusTypes.id))
    .where(eq(payrollBonuses.staffEmploymentId, staffEmploymentId));
  
  if (startDate && endDate) {
    query = query.where(between(payrollBonuses.paymentDate, startDate, endDate));
  }
  
  const result = await query.orderBy(sql`${payrollBonuses.paymentDate} DESC`);
  
  return result.map((row: any) => ({
    ...row.payroll_bonuses,
    bonusTypeName: row.bonus_types?.name,
  }));
}

export async function createPayrollRecord(db: any, data: {
  staffEmploymentId: number;
  payrollPeriodStart: Date;
  payrollPeriodEnd: Date;
  grossSalary: number;
  totalDeductions: number;
  totalBonuses: number;
  netPay: number;
  paymentMethod?: 'bank_transfer' | 'cash' | 'mpesa' | 'check';
  notes?: string;
}) {
  const result = await db.insert(payrollRecords).values({
    staffEmploymentId: data.staffEmploymentId,
    payrollPeriodStart: data.payrollPeriodStart,
    payrollPeriodEnd: data.payrollPeriodEnd,
    grossSalary: data.grossSalary,
    totalDeductions: data.totalDeductions,
    totalBonuses: data.totalBonuses,
    netPay: data.netPay,
    paymentMethod: data.paymentMethod || 'bank_transfer',
    notes: data.notes || null,
  });
  return result;
}

export async function getPayrollRecords(db: any, staffEmploymentId: number, limit: number = 12) {
  const result = await db.select().from(payrollRecords)
    .leftJoin(staffEmployment, eq(payrollRecords.staffEmploymentId, staffEmployment.id))
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(payrollRecords.staffEmploymentId, staffEmploymentId))
    .orderBy(sql`${payrollRecords.payrollPeriodEnd} DESC`)
    .limit(limit);
  
  return result.map((row: any) => ({
    ...row.payroll_records,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
    employmentTypeName: row.employment_types?.name,
  }));
}

export async function updatePayrollRecordStatus(db: any, payrollRecordId: number, status: 'pending' | 'paid' | 'failed' | 'cancelled', paymentDate?: Date) {
  const result = await db.update(payrollRecords)
    .set({
      paymentStatus: status,
      paymentDate: paymentDate || null,
    })
    .where(eq(payrollRecords.id, payrollRecordId));
  
  return result;
}

export async function generatePayslip(db: any, payrollRecordId: number, payslipNumber: string, payslipUrl?: string) {
  const payrollRecord = await db.select().from(payrollRecords)
    .where(eq(payrollRecords.id, payrollRecordId))
    .limit(1);
  
  if (payrollRecord.length === 0) return null;
  
  const pr = payrollRecord[0];
  
  const result = await db.insert(payslips).values({
    payrollRecordId: pr.id,
    staffEmploymentId: pr.staffEmploymentId,
    payslipNumber,
    payrollPeriodStart: pr.payrollPeriodStart,
    payrollPeriodEnd: pr.payrollPeriodEnd,
    grossSalary: pr.grossSalary,
    totalDeductions: pr.totalDeductions,
    totalBonuses: pr.totalBonuses,
    netPay: pr.netPay,
    payslipUrl: payslipUrl || null,
  });
  
  return result;
}

export async function getPayslips(db: any, staffEmploymentId: number, limit: number = 12) {
  const result = await db.select().from(payslips)
    .leftJoin(staffEmployment, eq(payslips.staffEmploymentId, staffEmployment.id))
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .where(eq(payslips.staffEmploymentId, staffEmploymentId))
    .orderBy(sql`${payslips.payrollPeriodEnd} DESC`)
    .limit(limit);
  
  return result.map((row: any) => ({
    ...row.payslips,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
  }));
}

export async function getPayslipById(db: any, payslipId: number) {
  const result = await db.select().from(payslips)
    .leftJoin(staffEmployment, eq(payslips.staffEmploymentId, staffEmployment.id))
    .leftJoin(staffProfiles, eq(staffEmployment.staffProfileId, staffProfiles.id))
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(payslips.id, payslipId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  return {
    ...row.payslips,
    firstName: row.staff_profiles?.firstName,
    lastName: row.staff_profiles?.lastName,
    phoneNumber: row.staff_profiles?.phoneNumber,
    employeeId: row.staff_profiles?.employeeId,
    baseSalary: row.staff_employment?.baseSalary,
    hourlyRate: row.staff_employment?.hourlyRate,
    dailyRate: row.staff_employment?.dailyRate,
    bankAccount: row.staff_employment?.bankAccount,
    bankName: row.staff_employment?.bankName,
    employmentTypeName: row.employment_types?.name,
  };
}

export async function getPayrollSettings(db: any, branchId?: number) {
  let query = db.select().from(payrollSettings);
  
  if (branchId) {
    query = query.where(eq(payrollSettings.branchId, branchId));
  } else {
    query = query.where(isNull(payrollSettings.branchId));
  }
  
  const result = await query.limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePayrollSettings(db: any, data: {
  branchId?: number;
  nssfRate?: number;
  nhifRate?: number;
  payeTaxThreshold?: number;
  payeRate?: number;
  payrollCycle?: 'weekly' | 'biweekly' | 'monthly';
  paymentDay?: number;
}) {
  const existing = await getPayrollSettings(db, data.branchId);
  
  if (existing) {
    const updateData: any = {};
    if (data.nssfRate !== undefined) updateData.nssfRate = data.nssfRate;
    if (data.nhifRate !== undefined) updateData.nhifRate = data.nhifRate;
    if (data.payeTaxThreshold !== undefined) updateData.payeTaxThreshold = data.payeTaxThreshold;
    if (data.payeRate !== undefined) updateData.payeRate = data.payeRate;
    if (data.payrollCycle !== undefined) updateData.payrollCycle = data.payrollCycle;
    if (data.paymentDay !== undefined) updateData.paymentDay = data.paymentDay;
    
    const result = await db.update(payrollSettings)
      .set(updateData)
      .where(data.branchId ? eq(payrollSettings.branchId, data.branchId) : isNull(payrollSettings.branchId));
    
    return result;
  } else {
    const result = await db.insert(payrollSettings).values({
      branchId: data.branchId || null,
      nssfRate: data.nssfRate || 6,
      nhifRate: data.nhifRate || 2.75,
      payeTaxThreshold: data.payeTaxThreshold || 24000,
      payeRate: data.payeRate || 30,
      payrollCycle: data.payrollCycle || 'monthly',
      paymentDay: data.paymentDay || 28,
    });
    
    return result;
  }
}

export async function calculateCasualLaborerPay(db: any, staffEmploymentId: number, startDate: Date, endDate: Date) {
  const employment = await db.select().from(staffEmployment)
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(staffEmployment.id, staffEmploymentId))
    .limit(1);
  
  if (employment.length === 0) return null;
  
  const emp = employment[0].staff_employment;
  
  // Get attendance records
  const attendance = await db.select({
    totalHours: sql<number>`SUM(${attendanceRecords.hoursWorked})`,
    daysWorked: sql<number>`COUNT(*)`,
  }).from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.staffProfileId, emp.staffProfileId),
      between(attendanceRecords.date, startDate, endDate),
      sql`${attendanceRecords.status} IN ('present', 'late', 'half_day')`
    ));
  
  const att = attendance[0] || { totalHours: 0, daysWorked: 0 };
  const totalHours = Number(att.totalHours) || 0;
  const daysWorked = Number(att.daysWorked) || 0;
  
  // Calculate gross salary based on hourly or daily rate
  let grossSalary = 0;
  if (emp.hourlyRate > 0) {
    grossSalary = totalHours * Number(emp.hourlyRate);
  } else if (emp.dailyRate > 0) {
    grossSalary = daysWorked * Number(emp.dailyRate);
  }
  
  return {
    staffEmploymentId,
    grossSalary,
    totalHours,
    daysWorked,
    hourlyRate: emp.hourlyRate,
    dailyRate: emp.dailyRate
  };
}

export async function calculatePermanentEmployeePay(db: any, staffEmploymentId: number, payrollSettings: any) {
  const employment = await db.select().from(staffEmployment)
    .leftJoin(employmentTypes, eq(staffEmployment.employmentTypeId, employmentTypes.id))
    .where(eq(staffEmployment.id, staffEmploymentId))
    .limit(1);
  
  if (employment.length === 0) return null;
  
  const emp = employment[0].staff_employment;
  
  // Get active deductions
  const deductions = await db.select().from(payrollDeductions)
    .leftJoin(deductionTypes, eq(payrollDeductions.deductionTypeId, deductionTypes.id))
    .where(and(
      eq(payrollDeductions.staffEmploymentId, staffEmploymentId),
      eq(payrollDeductions.isActive, true)
    ));
  
  // Calculate total deductions
  let totalDeductions = 0;
  const deductionDetails: any[] = [];
  
  for (const row of deductions) {
    const ded = row.payroll_deductions;
    let deductionAmount = 0;
    if (ded.amount) {
      deductionAmount = Number(ded.amount);
    } else if (ded.percentage) {
      deductionAmount = (Number(emp.baseSalary) * Number(ded.percentage)) / 100;
    }
    totalDeductions += deductionAmount;
    deductionDetails.push({
      name: row.deduction_types?.name,
      amount: deductionAmount,
      isStatutory: row.deduction_types?.isStatutory
    });
  }
  
  // Calculate PAYE if applicable
  if (Number(emp.baseSalary) > payrollSettings.payeTaxThreshold) {
    const taxableIncome = Number(emp.baseSalary) - totalDeductions;
    const payeAmount = (taxableIncome * payrollSettings.payeRate) / 100;
    totalDeductions += payeAmount;
    deductionDetails.push({
      name: 'PAYE',
      amount: payeAmount,
      isStatutory: true
    });
  }
  
  return {
    staffEmploymentId,
    grossSalary: Number(emp.baseSalary),
    totalDeductions,
    deductionDetails,
    netPay: Number(emp.baseSalary) - totalDeductions
  };
}
