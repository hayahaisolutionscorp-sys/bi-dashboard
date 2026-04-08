"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { expensesService } from "@/services/expenses.service";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/components/providers/tenant-provider";

interface ExpensesImportRow {
  vessel: string;
  voyage: string;
  route: string;
  tripDate: string;
  tripTime: string;
  category: string;
  type: string;
  qty: number;
  unit: string;
  amount: number;
  remarks: string;
  status: string;
  resolved_category_id?: string;
  resolved_trip_id?: string;
}

interface ExpensesImportPreview {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
  rows: ExpensesImportRow[];
}

interface ExpensesImportPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  preview: ExpensesImportPreview | null;
  onSuccess: () => void;
}

export function ExpensesImportPreviewModal({
  isOpen,
  onOpenChange,
  file,
  preview: initialPreview,
  onSuccess,
}: ExpensesImportPreviewModalProps) {
  const { activeTenant } = useTenant();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [rows, setRows] = useState<ExpensesImportRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (initialPreview) {
      setRows(initialPreview.rows || []);
      setTotal(initialPreview.total || 0);
    }
  }, [initialPreview]);

  if (!initialPreview || !file) return null;

  const handleConfirm = async () => {
    if (!activeTenant?.api_base_url || !file) return;
    setIsConfirming(true);
    try {
      const result = await expensesService.confirmExpensesImport(
        activeTenant.api_base_url, 
        file, 
        activeTenant.service_key
      );
      toast.success("Import successful", {
        description: `${result.created} expenses recorded successfully.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Import failed", {
        description: error?.message || "An unexpected error occurred during confirmation.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const revalidate = async (updatedRows: ExpensesImportRow[]) => {
    if (!activeTenant?.api_base_url) return;
    setIsValidating(true);
    try {
      const result = await expensesService.previewExpensesImportJson(
        activeTenant.api_base_url, 
        updatedRows, 
        activeTenant.service_key
      );
      setRows(result.rows);
    } catch (error: any) {
      toast.error("Validation failed", {
        description: "Failed to re-validate updated entries.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCellEdit = (index: number, field: keyof ExpensesImportRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const readyCount = rows.filter(r => r.status.startsWith('ready')).length;
  const errorCount = rows.filter(r => r.status.startsWith('error')).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[75vw] max-h-[90vh] flex flex-col gap-4 p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-medium text-slate-800">
            Preview Expenses Import
            {isValidating && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-normal">
            Review and correct the data before committing. Click any cell to edit. All rows must be valid (Ready) to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Summary:</span>
            <Badge className="bg-green-50 text-green-500 border-green-100/50 hover:bg-green-50 font-bold px-3 py-1">
              {readyCount} ready
            </Badge>
            {errorCount > 0 && (
              <Badge className="bg-rose-50 text-rose-500 border-rose-100/50 hover:bg-rose-50 font-bold px-3 py-1">
                {errorCount} invalid
              </Badge>
            )}
            <Badge className="bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-50 font-bold px-3 py-1">
              {total} total
            </Badge>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => revalidate(rows)} 
            disabled={isValidating}
            className="h-8 gap-2 hover:bg-slate-50 transition-all font-medium text-xs text-slate-600"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
            Re-validate
          </Button>
        </div>

        <div className="overflow-auto flex-1 border rounded-lg shadow-sm bg-slate-50/10">
          <table className="w-full border-collapse text-xs min-w-[1700px]">
            <thead className="sticky top-0 bg-slate-100/80 backdrop-blur-sm z-20 shadow-sm border-b">
              <tr>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Vessel</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Voyage</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Route</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Trip Date</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Trip Time</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Category</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Type</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Qty</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Unit</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Amount (₱)</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Remarks</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-widest last:pr-6 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 transition-all bg-white dark:bg-slate-950">
              {rows.map((row, i) => (
                <tr key={i} className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  row.status.startsWith('error') ? "bg-rose-50/10" : ""
                )}>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-600 transition-all outline-none"
                      value={row.vessel}
                      onChange={(e) => handleCellEdit(i, 'vessel', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-mono text-slate-600 transition-all outline-none"
                      value={row.voyage}
                      onChange={(e) => handleCellEdit(i, 'voyage', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-mono text-slate-600 transition-all outline-none"
                      value={row.route}
                      onChange={(e) => handleCellEdit(i, 'route', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40 group/cell">
                    <input 
                      type="date"
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-600 transition-all outline-none h-[40px]"
                      value={row.tripDate}
                      onChange={(e) => handleCellEdit(i, 'tripDate', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40 group/cell">
                    <input 
                      type="time"
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-600 transition-all outline-none h-[40px]"
                      value={row.tripTime}
                      onChange={(e) => handleCellEdit(i, 'tripTime', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-700 transition-all outline-none"
                      value={row.category}
                      onChange={(e) => handleCellEdit(i, 'category', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-600 transition-all outline-none"
                      value={row.type}
                      onChange={(e) => handleCellEdit(i, 'type', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      type="number"
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-mono text-slate-600 text-right transition-all outline-none"
                      value={row.qty}
                      onChange={(e) => handleCellEdit(i, 'qty', parseFloat(e.target.value) || 0)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-600 transition-all outline-none"
                      value={row.unit}
                      onChange={(e) => handleCellEdit(i, 'unit', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      type="number"
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs font-normal text-slate-800 text-right transition-all outline-none"
                      value={row.amount}
                      onChange={(e) => handleCellEdit(i, 'amount', parseFloat(e.target.value) || 0)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100/40">
                    <input 
                      className="w-full h-10 border-none bg-transparent focus:ring-1 focus:ring-slate-300 px-4 text-xs text-slate-400 placeholder:text-slate-300 transition-all outline-none"
                      value={row.remarks}
                      placeholder="Remarks..."
                      onChange={(e) => handleCellEdit(i, 'remarks', e.target.value)}
                      onBlur={() => revalidate(rows)}
                    />
                  </td>
                  <td className="px-4 py-2 last:pr-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 min-w-[150px]">
                      {row.status.startsWith('ready') ? (
                        <div className="text-green-600 font-medium uppercase tracking-tight text-[10px]">
                          Ready
                        </div>
                      ) : (
                        <div className="text-rose-600 font-medium uppercase tracking-tight text-[10px]">
                          Error
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {initialPreview.errors.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Import Notifications
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 list-none pl-0">
              {initialPreview.errors.map((err, i) => (
                <li key={i} className="text-[11px] text-slate-500 flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-4 p-0 pt-2 border-t mt-auto">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isConfirming || isValidating}
            className="text-slate-600 font-medium hover:bg-slate-100 text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={errorCount > 0 || readyCount === 0 || isConfirming || isValidating}
            className={cn(
              "h-10 px-8 rounded-lg font-medium uppercase tracking-wider text-[11px] shadow-sm transition-all active:scale-95 gap-3",
              readyCount > 0 ? "bg-slate-800 hover:bg-slate-950 text-white" : "bg-slate-200 text-slate-400 border-none shadow-none"
            )}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Import ({readyCount} new)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
