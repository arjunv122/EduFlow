/**
 * Report Generator Utility
 * Generates attendance reports in CSV, Excel, and PDF formats.
 */

/**
 * Generate CSV string from data array
 * @param {Array} data - Array of objects
 * @param {Array} columns - Array of { header, key } 
 * @returns {string} CSV content
 */
const generateCSV = (data, columns) => {
  const headers = columns.map(c => `"${c.header}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      // Escape quotes in string values
      if (typeof val === 'string') {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
};

/**
 * Generate Excel buffer from data array (uses exceljs)
 * @param {Array} data - Array of objects
 * @param {Array} columns - Array of { header, key }
 * @param {string} title - Sheet title
 * @returns {Promise<Buffer>} Excel file buffer
 */
const generateExcel = async (data, columns, title = 'Report') => {
  let ExcelJS;
  try {
    ExcelJS = require('exceljs');
  } catch {
    // Fallback: if exceljs is not installed, return CSV as xlsx
    throw Object.assign(new Error('Excel export requires the exceljs package. Install with: npm install exceljs'), { statusCode: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduFlow';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title);

  // Define columns with width
  sheet.columns = columns.map(c => ({
    header: c.header,
    key: c.key,
    width: Math.max(c.header.length + 5, 15),
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };
  headerRow.alignment = { horizontal: 'center' };

  // Add data rows
  data.forEach(row => {
    const excelRow = sheet.addRow(
      columns.reduce((obj, c) => {
        obj[c.key] = row[c.key] ?? '';
        return obj;
      }, {})
    );

    // Color-code percentage cells
    if (row.percentage !== undefined) {
      const pctCell = excelRow.getCell('percentage');
      if (row.percentage < 60) {
        pctCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      } else if (row.percentage < 75) {
        pctCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      } else {
        pctCell.font = { color: { argb: 'FF10B981' }, bold: true };
      }
    }
  });

  // Add borders to all cells
  sheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Generate PDF buffer from data array (uses pdfkit)
 * @param {Array} data - Array of objects
 * @param {Array} columns - Array of { header, key }
 * @param {string} title - Report title
 * @returns {Promise<Buffer>} PDF file buffer
 */
const generatePDF = async (data, columns, title = 'Report') => {
  let PDFDocument;
  try {
    PDFDocument = require('pdfkit');
  } catch {
    throw Object.assign(new Error('PDF export requires the pdfkit package. Install with: npm install pdfkit'), { statusCode: 500 });
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text(`Generated on ${new Date().toLocaleDateString()} by EduFlow`, { align: 'center' });
    doc.moveDown(1);

    // Table setup
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidths = columns.map(c => {
      if (c.key === 'studentName' || c.key === 'courseName' || c.key === 'studentEmail') return 100;
      return 55;
    });
    const totalColWidth = colWidths.reduce((s, w) => s + w, 0);
    const scaleFactor = pageWidth / totalColWidth;
    const scaledWidths = colWidths.map(w => w * scaleFactor);

    const rowHeight = 20;
    let startX = doc.page.margins.left;
    let y = doc.y;

    // Draw header row
    doc.fillColor('#3B82F6');
    doc.rect(startX, y, pageWidth, rowHeight).fill();
    doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');

    let x = startX;
    columns.forEach((col, i) => {
      doc.text(col.header, x + 3, y + 5, { width: scaledWidths[i] - 6, height: rowHeight, ellipsis: true });
      x += scaledWidths[i];
    });
    y += rowHeight;

    // Draw data rows
    doc.font('Helvetica').fontSize(7);
    data.forEach((row, rowIdx) => {
      // Check if we need a new page
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      // Alternate row background
      if (rowIdx % 2 === 0) {
        doc.fillColor('#F8FAFC').rect(startX, y, pageWidth, rowHeight).fill();
      }

      x = startX;
      columns.forEach((col, i) => {
        let val = String(row[col.key] ?? '');
        
        // Color-code percentage
        if (col.key === 'percentage') {
          val = `${val}%`;
          const pct = parseFloat(row[col.key]) || 0;
          doc.fillColor(pct >= 75 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444');
        } else {
          doc.fillColor('#1E293B');
        }

        doc.text(val, x + 3, y + 5, { width: scaledWidths[i] - 6, height: rowHeight, ellipsis: true });
        x += scaledWidths[i];
      });
      y += rowHeight;
    });

    // Footer
    doc.moveDown(2);
    doc.fillColor('#94A3B8').fontSize(8).text(
      `Total Records: ${data.length} | EduFlow Attendance Report`,
      doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 15,
      { align: 'center', width: pageWidth }
    );

    doc.end();
  });
};

module.exports = { generateCSV, generateExcel, generatePDF };
