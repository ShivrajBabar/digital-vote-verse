
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Component for downloading table data in various formats
 * 
 * @param {Object} props Component props
 * @param {Array} props.data The data array to download
 * @param {string} props.filename The base filename without extension
 * @param {Array} props.columns Column definitions with title and key properties
 */
const DownloadButtons = ({ data, filename = 'download', columns }) => {
  // Function to download as Excel
  const downloadExcel = () => {
    try {
      // Create worksheet with data
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download as Excel. Please try again.');
    }
  };
  
  // Function to download as PDF
  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(filename, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      
      // Prepare table data
      const tableColumn = columns.map(col => col.title);
      const tableRows = data.map(item => 
        columns.map(col => item[col.key])
      );
      
      // Add current datetime in the document
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      // Add table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [78, 53, 73],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });
      
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download as PDF. Please try again.');
    }
  };

  // Function to download as CSV
  const downloadCSV = () => {
    try {
      // Convert data to CSV format
      const csvData = data.map(row => 
        columns.map(col => {
          // Handle commas and quotes in CSV
          const cellValue = row[col.key];
          const cellStr = cellValue !== null && cellValue !== undefined ? cellValue.toString() : '';
          return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
            ? `"${cellStr.replace(/"/g, '""')}"`
            : cellStr;
        }).join(',')
      );
      
      // Add header row
      const headerRow = columns.map(col => col.title).join(',');
      csvData.unshift(headerRow);
      
      // Create CSV content
      const csvContent = csvData.join('\n');
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download as CSV. Please try again.');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={downloadExcel} 
        variant="outline" 
        className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
        size="sm"
      >
        <FileSpreadsheet size={16} />
        <span>Excel</span>
      </Button>
      
      <Button 
        onClick={downloadPDF} 
        variant="outline" 
        className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
        size="sm"
      >
        <FileText size={16} />
        <span>PDF</span>
      </Button>
      
      <Button 
        onClick={downloadCSV}
        variant="outline"
        className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50"
        size="sm"
      >
        <Download size={16} />
        <span>CSV</span>
      </Button>
    </div>
  );
};

export default DownloadButtons;
