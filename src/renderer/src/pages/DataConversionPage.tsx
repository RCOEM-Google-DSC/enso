import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileJson,
  FileSpreadsheet,
  ArrowRight,
  Trash2,
  Copy,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

import {
  getSupportedFormat,
  parseFileText,
  convertData,
  FileFormat,
  ParsedFileResult,
} from "../lib/fileConversion";
import DataTable from "../components/Common/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function ConversionPanel() {
  const [sourceFormat, setSourceFormat] = useState<FileFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<FileFormat>("json");
  const [file, setFile] = useState<File | null>(null);
  const [convertedData, setConvertedData] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [fileStats, setFileStats] = useState<{ rows: number; columns: number } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Validate extension using shared helper in fileConversion
    const supported = getSupportedFormat(uploadedFile.name);
    if (!supported) {
      toast.error("Unsupported file type. Please upload CSV, JSON, or Excel files only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      setSourceFormat(null);
      setPreviewData(null);
      setFileStats(null);
      return;
    }

    setFile(uploadedFile);
    setSourceFormat(supported);

    try {
      const text = await uploadedFile.text();

      const { previewData, fileStats }: ParsedFileResult = parseFileText(
        text,
        supported
      );

      setPreviewData(previewData);
      setFileStats(fileStats);

      toast.success(`${supported.toUpperCase()} file detected and uploaded successfully`);
    } catch (error) {
      toast.error("Error parsing file");
      console.error(error);
    }
  };

  const handleConvert = () => {
    if (!previewData) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      const converted = convertData(previewData, targetFormat);
      setConvertedData(converted);
      toast.success("Conversion successful");
    } catch (error) {
      toast.error("Error converting file");
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (!convertedData) {
      toast.error("No converted data to download");
      return;
    }

    const blob = new Blob([convertedData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const extension = targetFormat === "json" ? "json" : "csv";
    a.download = `converted.${extension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("File downloaded");
  };

  const handleCopyToClipboard = () => {
    if (!convertedData) {
      toast.error("No converted data to copy");
      return;
    }
    navigator.clipboard.writeText(convertedData);
    toast.success("Copied to clipboard");
  };

  const handleClear = () => {
    setFile(null);
    setPreviewData(null);
    setConvertedData(null);
    setFileStats(null);
    setSourceFormat(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatButtons = [
    { id: "excel", label: "Excel", icon: FileSpreadsheet },
    { id: "csv", label: "CSV", icon: FileSpreadsheet },
    { id: "json", label: "JSON", icon: FileJson },
  ] as const;

  const tableColumns: ColumnDef<any, any>[] =
    previewData && Array.isArray(previewData) && previewData.length > 0
      ? (Object.keys(previewData[0]) as string[]).map((key) => ({
        accessorKey: key,
        header: key,
        cell: (info: any) => String(info.getValue() ?? ""),
      }))
      : ([] as ColumnDef<any, any>[]);

  return (
    <div className="h-full bg-background">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl mb-1">Data Conversion</h1>
            <p className="text-sm text-muted-foreground">
              Convert your data between Excel, CSV, and JSON formats
            </p>
          </div>

        </div>

        {/* Main Conversion Interface */}
        <div className="flex flex-row items-center justify-center gap-8">
          {/* Source File Upload */}
          <Card className="p-6  h-[335.962px] w-[344.5px]">
            <div className="space-y-4">
              <div>
                <label className="block mb-3">Upload Source File</label>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="mb-1">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports CSV, JSON, and Excel files
                    </p>
                  </div>
                </label>
              </div>

              {sourceFormat && (
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Detected format: </span>

                    <Badge variant="default" className="uppercase">
                      {sourceFormat === "excel" || sourceFormat === "csv" && (
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                      )}
                      {sourceFormat === "json" && <FileJson className="w-3 h-3 mr-1" />}
                      {sourceFormat}
                    </Badge>
                  </div>
                </div>
              )}

              {fileStats && (
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary">{fileStats.rows} rows</Badge>
                  <Badge variant="secondary">{fileStats.columns} columns</Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Conversion Arrow */}
          <div className="flex flex-col items-center justify-center md:h-[400px] h-auto gap-5">
            <Button onClick={handleConvert} disabled={!previewData} size="lg" className="hover:bg-black cursor-pointer transition-all duration-300 hover:scale-102 flex items-center justify-center text-white">
              Convert <ArrowRight />
            </Button>


            <Button variant="outline" size="sm" onClick={handleClear} className="hover:bg-black hover:text-white cursor-pointer transition-all duration-300 hover:scale-102">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Files
            </Button>
          </div>

          {/* Target Format Selection */}
          <Card className="p-6  h-[335.962px] w-[344.5px]">
            <div className="space-y-4">
              <div>
                <label className="block mb-3">Target Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {formatButtons.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTargetFormat(id as FileFormat)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${targetFormat === id
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border hover:border-primary/50 cursor-pointer"
                        }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                {convertedData && (
                  <>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleDownload} size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={handleCopyToClipboard}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Data Preview */}
        {(previewData || convertedData) && (
          <Card className="p-6">
            <Tabs defaultValue="source" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="source" className="cursor-pointer">Source Data</TabsTrigger>
                  <TabsTrigger value="table" disabled={!previewData} className="cursor-pointer">
                    Table View
                  </TabsTrigger>
                  <TabsTrigger value="converted" disabled={!convertedData} className="cursor-pointer">
                    Converted Data
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="source" className="mt-0">
                <div className="bg-muted rounded-lg p-4 h-[500px] overflow-auto">
                  {previewData ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground text-sm text-center py-8">
                      No data to preview
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="converted" className="mt-0">
                <div className="bg-muted rounded-lg p-4 h-[500px] overflow-auto">
                  {convertedData ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {convertedData}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground text-sm text-center py-8">
                      Convert data to see preview
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="table" className="mt-0">
                <div className="bg-muted rounded-lg p-4 h-[500px] overflow-auto">
                  {previewData && Array.isArray(previewData) && previewData.length > 0 ? (
                    <div>
                      {/* uses a resuable DataTable component */}
                      <DataTable columns={tableColumns} data={previewData} />
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm text-center py-8">
                      No data to display in table format
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}
