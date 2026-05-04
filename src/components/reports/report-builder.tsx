'use client';

import { useState, useMemo } from 'react';
import {
  IconFileAnalytics,
  IconDownload,
  IconFilter,
  IconCalendar,
  IconRefresh,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypeCsv,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { exportData, type ExportFormat } from '@/lib/export';
import { formatDate, cn } from '@/lib/utils';

interface ReportField {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: ReportField[];
  supportedFormats: ExportFormat[];
}

interface ReportBuilderProps {
  templates: ReportTemplate[];
  onGenerateReport: (
    templateId: string,
    params: {
      startDate: string;
      endDate: string;
      fields: string[];
      format: ExportFormat;
    }
  ) => Promise<{ data: Record<string, unknown>[]; columns: string[] }>;
  className?: string;
}

/**
 * Interactive report builder for generating 401(k) compliance reports
 */
export function ReportBuilder({
  templates,
  onGenerateReport,
  className,
}: ReportBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isGenerating, setIsGenerating] = useState(false);

  const template = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplate);
  }, [templates, selectedTemplate]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const newTemplate = templates.find((t) => t.id === templateId);
    if (newTemplate) {
      // Select required fields by default
      const requiredFields = newTemplate.fields
        .filter((f) => f.required)
        .map((f) => f.id);
      setSelectedFields(requiredFields);
      // Set default format
      setExportFormat(newTemplate.supportedFormats[0] || 'csv');
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSelectAllFields = () => {
    if (template) {
      setSelectedFields(template.fields.map((f) => f.id));
    }
  };

  const handleClearFields = () => {
    if (template) {
      // Keep only required fields
      const requiredFields = template.fields
        .filter((f) => f.required)
        .map((f) => f.id);
      setSelectedFields(requiredFields);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !startDate || !endDate) return;

    setIsGenerating(true);
    try {
      const result = await onGenerateReport(selectedTemplate, {
        startDate,
        endDate,
        fields: selectedFields,
        format: exportFormat,
      });

      // Export the data
      const fileName = `${template?.name.replace(/\s+/g, '_')}_${startDate}_${endDate}`;
      const exportColumns = result.columns.map((col) => ({
        key: col,
        header: col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1'),
      }));
      await exportData(exportFormat, result.data, exportColumns, fileName);
    } finally {
      setIsGenerating(false);
    }
  };

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ReportTemplate[]> = {};
    templates.forEach((t) => {
      if (!groups[t.category]) {
        groups[t.category] = [];
      }
      groups[t.category]!.push(t);
    });
    return groups;
  }, [templates]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconFileAnalytics className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Report Builder</CardTitle>
        </div>
        <CardDescription>
          Generate customized 401(k) compliance and administrative reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Report Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a report template" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {categoryTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {template && (
            <p className="text-xs text-muted-foreground">{template.description}</p>
          )}
        </div>

        {template && (
          <>
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Field Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Report Fields</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllFields}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFields}
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                {template.fields.map((field) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => handleFieldToggle(field.id)}
                      disabled={field.required}
                    />
                    <div className="space-y-0.5">
                      <label
                        htmlFor={field.id}
                        className="text-sm cursor-pointer flex items-center gap-1"
                      >
                        {field.label}
                        {field.required && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            Required
                          </Badge>
                        )}
                      </label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex gap-2">
                {template.supportedFormats.map((format) => (
                  <Button
                    key={format}
                    variant={exportFormat === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat(format)}
                    className="flex-1"
                  >
                    {format === 'csv' && <IconFileTypeCsv className="mr-2 h-4 w-4" />}
                    {format === 'excel' && <IconFileSpreadsheet className="mr-2 h-4 w-4" />}
                    {format === 'pdf' && <IconFileTypePdf className="mr-2 h-4 w-4" />}
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={handleGenerateReport}
              disabled={isGenerating || !startDate || !endDate || selectedFields.length === 0}
            >
              {isGenerating ? (
                <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IconDownload className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
