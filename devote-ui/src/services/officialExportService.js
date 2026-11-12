/**
 * officialExportService.js - Export Service for Election Officials
 * 
 * Supports exporting officials data to CSV, Excel-compatible format, and PDF.
 */

/**
 * Escape a CSV field value
 * @param {string} value 
 * @returns {string}
 */
const escapeCsvField = (value) => {
  const str = String(value || "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Convert officials array to CSV string
 * @param {Array} officials 
 * @returns {string} CSV content
 */
export const toCsv = (officials) => {
  const headers = [
    "Full Name",
    "National ID",
    "Email",
    "Phone Number",
    "Wallet Address",
    "Role",
    "County",
    "Constituency",
    "Ward",
    "Polling Station",
    "Status",
    "Blockchain Assigned",
    "Created At",
    "Created By",
  ];

  const rows = officials.map((o) => [
    o.fullName || "",
    o.nationalId || "",
    o.email || "",
    o.phoneNumber || "",
    o.walletAddress || "",
    o.roleLabel || o.role || "",
    o.county || "",
    o.constituency || "",
    o.ward || "",
    o.pollingStation || "",
    o.status || "",
    o.blockchainAssigned ? "Yes" : "No",
    o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : o.createdAt || "",
    o.createdBy || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  return csvContent;
};

/**
 * Convert officials to Excel-compatible XML format (SpreadsheetML)
 * @param {Array} officials 
 * @returns {string} XML content
 */
export const toExcelXml = (officials) => {
  const headers = [
    "Full Name", "National ID", "Email", "Phone Number", "Wallet Address",
    "Role", "County", "Constituency", "Ward", "Polling Station",
    "Status", "Blockchain Assigned", "Created At", "Created By",
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += ' <Worksheet ss:Name="Officials">\n';
  xml += '  <Table>\n';

  // Header row
  xml += '   <Row>\n';
  headers.forEach((h) => {
    xml += `    <Cell><Data ss:Type="String">${escapeCsvField(h)}</Data></Cell>\n`;
  });
  xml += '   </Row>\n';

  // Data rows
  officials.forEach((o) => {
    xml += '   <Row>\n';
    const values = [
      o.fullName || "",
      o.nationalId || "",
      o.email || "",
      o.phoneNumber || "",
      o.walletAddress || "",
      o.roleLabel || o.role || "",
      o.county || "",
      o.constituency || "",
      o.ward || "",
      o.pollingStation || "",
      o.status || "",
      o.blockchainAssigned ? "Yes" : "No",
      o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : o.createdAt || "",
      o.createdBy || "",
    ];
    values.forEach((v) => {
      xml += `    <Cell><Data ss:Type="String">${escapeCsvField(v)}</Data></Cell>\n`;
    });
    xml += '   </Row>\n';
  });

  xml += '  </Table>\n';
  xml += ' </Worksheet>\n';
  xml += '</Workbook>\n';

  return xml;
};

/**
 * Generate a simple HTML-based PDF printable document for officials
 * @param {Array} officials 
 * @param {string} title 
 * @returns {string} HTML content suitable for printing
 */
export const toPdfHtml = (officials, title = "Election Officials Report") => {
  const now = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let rows = "";
  officials.forEach((o, i) => {
    rows += `<tr>
      <td>${i + 1}</td>
      <td>${o.fullName || ""}</td>
      <td>${o.roleLabel || o.role || ""}</td>
      <td>${o.county || ""}</td>
      <td>${o.constituency || ""}</td>
      <td>${o.status || ""}</td>
      <td>${o.blockchainAssigned ? "Yes" : "No"}</td>
    </tr>`;
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  h1 { color: #1e3a5f; font-size: 20px; margin-bottom: 5px; }
  .subtitle { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; font-weight: 600; }
  td { padding: 6px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f9fafb; }
  .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
  .badge-active { background: #d1fae5; color: #065f46; }
  .badge-suspended { background: #fef3c7; color: #92400e; }
  .badge-disabled { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">Generated: ${now} | Total Officials: ${officials.length}</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Role</th>
        <th>County</th>
        <th>Constituency</th>
        <th>Status</th>
        <th>Blockchain</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="footer">DeVote National Elections Management System - Official Report</div>
  <script>window.print();</script>
</body>
</html>`;
};

/**
 * Download content as a file
 * @param {string} content - File content
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export officials to CSV and trigger download
 * @param {Array} officials 
 * @param {string} [filename] 
 */
export const exportToCsv = (officials, filename = "election_officials.csv") => {
  const csvContent = toCsv(officials);
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
};

/**
 * Export officials to Excel XML and trigger download
 * @param {Array} officials 
 * @param {string} [filename] 
 */
export const exportToExcel = (officials, filename = "election_officials.xls") => {
  const xmlContent = toExcelXml(officials);
  downloadFile(xmlContent, filename, "application/vnd.ms-excel;charset=utf-8;");
};

/**
 * Export officials to PDF (printable HTML) and open in new window
 * @param {Array} officials 
 * @param {string} [title] 
 */
export const exportToPdf = (officials, title) => {
  const htmlContent = toPdfHtml(officials, title);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export default {
  toCsv,
  toExcelXml,
  toPdfHtml,
  downloadFile,
  exportToCsv,
  exportToExcel,
  exportToPdf,
};