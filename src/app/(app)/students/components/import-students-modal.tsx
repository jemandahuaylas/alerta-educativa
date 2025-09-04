
"use client";

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/core/domain/types';

type ImportModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImport: (newStudents: Omit<Student, 'id' | 'name' | 'grade' | 'section' | 'gradeId' | 'sectionId'>[]) => void;
};

type ExcelRow = (string | number | null)[];

type ValidationResult = {
    rowIndex: number;
    data: { firstName: string; lastName: string; dni: string };
    isValid: boolean;
    errors: string[];
};

const PREVIEW_ROW_LIMIT = 5;

const COLUMN_KEYWORDS = {
    dni: ['número de documento', 'numero de documento'],
    paternalLastName: ['apellido paterno'],
    maternalLastName: ['apellido materno'],
    names: ['nombres'],
};

export function ImportStudentsModal({ isOpen, onOpenChange, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  
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
             workbook = XLSX.read(fileContent as string, { type: 'string', raw: true });
        } else {
             const data = new Uint8Array(fileContent as ArrayBuffer);
             workbook = XLSX.read(data, { type: 'array', raw: true });
        }
       
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
        
        if (jsonData.length === 0) {
          setIsProcessing(false);
          return;
        }

        const columnMap: { [key: string]: number } = {};
        
        let headerRowIndex = -1;
        for(let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i].map(cell => String(cell || '').toLowerCase().trim());
            const matches = Object.keys(COLUMN_KEYWORDS).filter(key => {
                const keywords = COLUMN_KEYWORDS[key as keyof typeof COLUMN_KEYWORDS];
                return row.some(cell => keywords.some(kw => (cell || '').includes(kw)));
            });
            if (matches.length >= 3) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex !== -1) {
            const headerRow = jsonData[headerRowIndex].map(cell => String(cell || '').toLowerCase().trim());
            Object.keys(COLUMN_KEYWORDS).forEach(key => {
                const keywords = COLUMN_KEYWORDS[key as keyof typeof COLUMN_KEYWORDS];
                const foundIndex = headerRow.findIndex(cell => keywords.some(kw => (cell || '').includes(kw)));
                if(foundIndex !== -1) {
                    columnMap[key] = foundIndex;
                }
            });
        }
        
        const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => {
             const dniCell = columnMap.dni !== undefined ? String(row[columnMap.dni] || '').trim() : '';
             const namesCell = columnMap.names !== undefined ? String(row[columnMap.names] || '').trim() : '';
             const paternalLastNameCell = columnMap.paternalLastName !== undefined ? String(row[columnMap.paternalLastName] || '').trim() : '';
             return /^\d{8,}$/.test(dniCell) && (namesCell.length > 0 || paternalLastNameCell.length > 0);
        });

        const results = dataRows.map((row, index) => {
            let errors: string[] = [];
            const names = columnMap.names !== undefined ? String(row[columnMap.names] || '').trim() : '';
            const paternalLastName = columnMap.paternalLastName !== undefined ? String(row[columnMap.paternalLastName] || '').trim() : '';
            const maternalLastName = columnMap.maternalLastName !== undefined ? String(row[columnMap.maternalLastName] || '').trim() : '';
            const dni = columnMap.dni !== undefined ? String(row[columnMap.dni] || '').trim() : '';
            
            if (!names) errors.push('Nombres falta.');
            if (!paternalLastName) errors.push('Apellido Paterno falta.');
            if (!dni) errors.push('DNI falta.');
            else if (!/^\d{8}$/.test(dni)) errors.push('DNI inválido.');
    
            return {
                rowIndex: index,
                data: { 
                    firstName: names,
                    lastName: `${paternalLastName} ${maternalLastName}`.trim(), 
                    dni 
                },
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
    setIsProcessing(false);
  };
  
  const handleModalClose = (open: boolean) => {
    if (!open) {
        handleReset();
    }
    onOpenChange(open);
  };
  
  const handleConfirmImport = () => {
    const newStudents = validRows.map(row => row.data as Omit<Student, 'id' | 'name' | 'grade' | 'section' | 'gradeId' | 'sectionId'>);
    onImport(newStudents);
    handleModalClose(false);
  }

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={handleModalClose}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Importar Estudiantes</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
             Cargue un archivo .xlsx o .csv. El sistema detectará automáticamente las columnas DNI, Apellido Paterno, Apellido Materno y Nombres.
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
                                        <TableHead>Nombres</TableHead>
                                        <TableHead>Apellidos</TableHead>
                                        <TableHead>DNI</TableHead>
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
                                            <TableCell>{res.data.firstName}</TableCell>
                                            <TableCell>{res.data.lastName}</TableCell>
                                            <TableCell>{res.data.dni}</TableCell>
                                            <TableCell>
                                                {res.errors.length > 0 && <span className="text-xs text-destructive">{res.errors.join(', ')}</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No se encontraron datos de estudiantes válidos en el archivo.</p>
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
                 <Button onClick={handleConfirmImport} disabled={isProcessing || validRows.length === 0}>
                    Importar {validRows.length > 0 ? `${validRows.length} Estudiante(s)` : ''}
                </Button>
            </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
