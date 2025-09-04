
"use client";

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserProfile } from '@/core/domain/types';

type ImportModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImport: (newTeachers: Omit<UserProfile, 'id'>[]) => void;
};

type ExcelRow = { [key: string]: string | number };

type ValidationResult = {
    rowIndex: number;
    data: { name: string; dni: string; email: string };
    isValid: boolean;
    errors: string[];
};

const PREVIEW_ROW_LIMIT = 5;

export function ImportDocentesModal({ isOpen, onOpenChange, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: ExcelRow[] }>({ headers: [], rows: [] });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || droppedFile.name.endsWith('.xlsx') || droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  };
  
  const processFile = (selectedFile: File) => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setValidationResults([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result;
        let workbook;
        if (selectedFile.name.endsWith('.csv')) {
             workbook = XLSX.read(fileContent as string, { type: 'string' });
        } else {
             const data = new Uint8Array(fileContent as ArrayBuffer);
             workbook = XLSX.read(data, { type: 'array' });
        }
       
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
        
        if (jsonData.length === 0) {
          setIsProcessing(false);
          return;
        }

        // Skip empty rows and find data rows
        const nonEmptyRows = jsonData.filter(row => {
            const rowValues = Object.values(row);
            return rowValues.some(value => value !== undefined && value !== null && value.toString().trim() !== '');
        });
        
        // Find the first row that looks like data (e.g., has a valid DNI in the second column)
        const firstDataRowIndex = nonEmptyRows.findIndex(row => {
            const rowValues = Object.values(row);
            const potentialDni = rowValues[1]?.toString().trim();
            return /^\d{8}$/.test(potentialDni);
        });
        
        // If no data row is found, assume no header and start from the first row.
        const dataStartIndex = firstDataRowIndex === -1 ? 0 : firstDataRowIndex;
        const dataRows = nonEmptyRows.slice(dataStartIndex);
        
        console.log('Total rows in Excel:', jsonData.length);
        console.log('Non-empty rows:', nonEmptyRows.length);
        console.log('Data rows after processing:', dataRows.length);
        
        const columnCount = Math.max(...dataRows.map(row => Object.values(row).length));
        const fileHeaders = Array.from({ length: columnCount }, (_, i) => `Columna ${String.fromCharCode(65 + i)}`);

        const previewRows = dataRows.slice(0, 5).map(row => {
            const rowData: ExcelRow = {};
            const rowValues = Object.values(row);
            fileHeaders.forEach((header, index) => {
                rowData[header] = rowValues[index];
            });
            return rowData;
        });
        setPreviewData({ headers: fileHeaders, rows: previewRows });

        const results = dataRows.map((row, index) => {
            let errors: string[] = [];
            const rowValues = Object.values(row);
            const name = rowValues[0]?.toString().trim() || '';
            const dni = rowValues[1]?.toString().trim() || '';
            const email = rowValues[2]?.toString().trim() || '';
            
            if (!name) errors.push('Nombre falta.');
            if (!dni) errors.push('DNI falta.');
            else if (!/^\d{8}$/.test(dni)) errors.push('DNI inválido.');
            if (!email) errors.push('Email falta.');
            else if (!/\S+@\S+\.\S+/.test(email)) errors.push('Email inválido.');
    
            return {
                rowIndex: index,
                data: { name, dni, email },
                isValid: errors.length === 0,
                errors,
            };
        });
        setValidationResults(results);

      } catch (error) {
          console.error("Error processing file:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    if (selectedFile.name.endsWith('.csv')) {
        reader.readAsText(selectedFile);
    } else {
        reader.readAsArrayBuffer(selectedFile);
    }
  };

  const validRows = useMemo(() => validationResults.filter(r => r.isValid), [validationResults]);
  const previewValidationResults = useMemo(() => validationResults.slice(0, PREVIEW_ROW_LIMIT), [validationResults]);

  const handleReset = () => {
    setFile(null);
    setValidationResults([]);
    setPreviewData({ headers: [], rows: [] });
    setIsProcessing(false);
  };
  
  const handleModalClose = (open: boolean) => {
    if (!open) {
        handleReset();
    }
    onOpenChange(open);
  };
  
  const handleConfirmImport = async () => {
    const newTeachers = validRows.map(row => ({
      ...row.data,
      role: 'Docente' as const
    }) as Omit<UserProfile, 'id'>);
    
    console.log('📋 Modal: About to call onImport with teachers:', newTeachers.length);
    console.log('📋 Modal: Teachers data:', newTeachers);
    
    setIsImporting(true);
    
    try {
      // Call onImport and close modal immediately
      await onImport(newTeachers);
      console.log('📋 Modal: Import completed, closing modal');
      handleModalClose(false);
    } catch (error) {
      console.error('📋 Modal: Import failed:', error);
      setIsImporting(false);
      // Don't close modal on error, let user see the error
    }
  }

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={handleModalClose}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Importar Docentes</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
             Cargue un archivo .xlsx o .csv para importar una lista de docentes. Las filas con errores serán ignoradas.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 py-4">
            {!file ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <label 
                        htmlFor="file-upload"
                        className="w-full h-52 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer bg-muted/50 hover:bg-muted"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Arrastre y suelte un archivo .xlsx o .csv aquí</p>
                        <p className="text-sm text-muted-foreground">o</p>
                         <span className="mt-1 text-primary underline-offset-4 hover:underline">seleccione un archivo</span>
                        <input id="file-upload" type="file" className="hidden" accept=".xlsx, .csv" onChange={handleFileChange} />
                    </label>
                </div>
            ) : (
                <div className="space-y-4">
                     <div className="w-full p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{file.name}</span>
                            </div>
                             <Button size="sm" variant="ghost" onClick={handleReset}>Cambiar archivo</Button>
                        </div>
                    </div>
                    {isProcessing ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : validationResults.length > 0 ? (
                         <ScrollArea className="h-[300px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">Estado</TableHead>
                                        <TableHead>Nombre Completo</TableHead>
                                        <TableHead>DNI</TableHead>
                                        <TableHead>Correo</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewValidationResults.map(res => (
                                        <TableRow key={res.rowIndex} className={!res.isValid ? 'bg-destructive/10' : ''}>
                                            <TableCell>
                                                {res.isValid 
                                                    ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                                                    : <AlertCircle className="h-5 w-5 text-destructive" />
                                                }
                                            </TableCell>
                                            <TableCell>{res.data.name}</TableCell>
                                            <TableCell>{res.data.dni}</TableCell>
                                            <TableCell>{res.data.email}</TableCell>
                                            <TableCell>
                                                {res.errors.length > 0 && <span className="text-xs text-destructive">{res.errors.join(', ')}</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <TableIcon className="h-4 w-4" />
                                <span>Vista Previa del Archivo (primeras 5 filas)</span>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {previewData.headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {previewData.headers.map(header => <TableCell key={`${header}-${rowIndex}`}>{row[header]}</TableCell>)}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        <ResponsiveDialogFooter className="border-t pt-4 flex justify-between items-center w-full">
            <div>
                 {validationResults.length > 0 && (
                     <p className="text-sm text-muted-foreground">
                         <span className="font-semibold text-green-600">{validRows.length}</span> filas válidas, <span className="font-semibold text-destructive">{validationResults.length - validRows.length}</span> filas con errores.
                         {validationResults.length > PREVIEW_ROW_LIMIT && ` Mostrando las primeras ${PREVIEW_ROW_LIMIT}.`}
                     </p>
                 )}
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={() => handleModalClose(false)}>Cancelar</Button>
                 <Button onClick={handleConfirmImport} disabled={isProcessing || isImporting || validRows.length === 0}>
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      `Importar ${validRows.length > 0 ? `${validRows.length} Docente(s)` : ''}`
                    )}
                </Button>
            </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
