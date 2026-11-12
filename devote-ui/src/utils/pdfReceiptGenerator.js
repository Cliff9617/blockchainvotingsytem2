/**
 * PDF Receipt Generator
 * 
 * Generates a professional PDF receipt for vote verification.
 * The receipt contains verification data but NEVER reveals candidate selection.
 */
import { jsPDF } from 'jspdf';

/**
 * Generate a professional PDF vote receipt
 * @param {Object} receipt - The vote receipt object
 * @param {string} receipt.verificationId - Cryptographic verification ID
 * @param {string} receipt.transactionHash - Blockchain transaction hash
 * @param {number} receipt.blockNumber - Block number
 * @param {string} receipt.timestamp - ISO timestamp
 * @param {string} receipt.electionName - Election name
 * @param {string} receipt.constituency - Constituency
 * @param {string} receipt.pollingStation - Polling station
 * @param {string} receipt.walletAddressMasked - Masked wallet address
 * @returns {jsPDF} - The generated PDF document
 */
export const generateReceiptPDF = (receipt) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  // Colors
  const primaryColor = [0, 82, 204]; // Deep blue
  const accentColor = [16, 185, 129]; // Green
  const textColor = [31, 41, 55]; // Dark gray
  const mutedColor = [107, 114, 128]; // Gray
  
  let y = margin;

  // ===== Header Section =====
  // Top decoration bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  // Logo / Title
  y += 10;
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DeVote', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Blockchain Voting System', pageWidth / 2, y, { align: 'center' });
  
  // Divider
  y += 6;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  // ===== Title Section =====
  y += 8;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('VOTE RECEIPT', pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Official Confirmation of Blockchain Vote Recording', pageWidth / 2, y, { align: 'center' });
  
  // ===== Verification Badge =====
  y += 10;
  doc.setFillColor(...accentColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  // Rounded badge
  const badgeWidth = 60;
  const badgeX = pageWidth / 2 - badgeWidth / 2;
  doc.roundedRect(badgeX, y, badgeWidth, 10, 5, 5, 'F');
  doc.text('✓ VERIFIED', pageWidth / 2, y + 7, { align: 'center' });
  
  y += 16;
  
  // ===== Receipt Details =====
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentWidth, 70, 3, 3, 'F');
  
  const detailItems = [
    { label: 'Vote Verification ID', value: receipt.verificationId },
    { label: 'Transaction Hash', value: receipt.transactionHash },
    { label: 'Block Number', value: `#${receipt.blockNumber}` },
    { label: 'Date & Time', value: formatDate(receipt.timestamp) },
    { label: 'Election', value: receipt.electionName || 'General Election' },
  ];
  
  let detailY = y + 8;
  doc.setFontSize(8);
  
  detailItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xPos = margin + 10 + col * (contentWidth / 2 - 15);
    const yPos = detailY + row * 20;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedColor);
    doc.text(item.label, xPos, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    
    // Truncate if too long
    let value = item.value || '';
    if (value.length > 30) {
      value = value.substring(0, 12) + '...' + value.substring(value.length - 8);
    }
    doc.text(value, xPos, yPos + 5);
  });
  
  // Wallet address
  const walletY = detailY + 40;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('Wallet Address', margin + 10, walletY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.text(receipt.walletAddressMasked || 'N/A', margin + 10, walletY + 5);
  
  y += 80;
  
  // ===== Verification QR Code Placeholder =====
  // Note: We generate the QR code inline on the canvas
  y += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Verification QR Code', margin, y);
  
  y += 5;
  
  // Draw QR code using the generated data URL
  try {
    // We'll draw the QR as an image if it was provided
    const qrSize = 50;
    const qrX = pageWidth / 2 - qrSize / 2;
    
    // QR Border
    doc.setDrawColor(...mutedColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX - 2, y - 2, qrSize + 4, qrSize + 4, 2, 2, 'S');
    
    // Instructions
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...mutedColor);
    doc.text('Scan QR code to verify your vote', pageWidth / 2, y + qrSize + 6, { align: 'center' });
    doc.text(`/verify-vote?id=${receipt.verificationId?.substring(0, 16)}...`, pageWidth / 2, y + qrSize + 12, { align: 'center' });
  } catch (e) {
    // If QR generation fails, show the verification URL
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('Visit: /verify-vote with your Verification ID', pageWidth / 2, y + 15, { align: 'center' });
  }
  
  y += 30;
  
  // ===== Blockchain Status =====
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('✓ Recorded on Blockchain (Sepolia Testnet)', margin, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(`Transaction confirmed in block #${receipt.blockNumber}`, margin, y);
  
  // ===== Disclaimer =====
  y += 10;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...mutedColor);
  const disclaimer = 'This receipt confirms that your vote was securely recorded on the blockchain. It does not reveal your voting choice.';
  const lines = doc.splitTextToSize(disclaimer, contentWidth);
  lines.forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });
  
  // ===== Footer =====
  doc.setFillColor(249, 250, 251);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('DeVote Blockchain Voting System | Secure | Transparent | Verifiable', pageWidth / 2, pageHeight - 6, { align: 'center' });
  
  return doc;
};

/**
 * Format ISO timestamp to readable date/time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted date/time
 */
const formatDate = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch (e) {
    return timestamp || 'N/A';
  }
};

/**
 * Download the receipt as a PDF
 * @param {Object} receipt - The vote receipt object
 */
export const downloadReceiptPDF = (receipt) => {
  try {
    const doc = generateReceiptPDF(receipt);
    const filename = `DeVote-Receipt-${receipt.verificationId?.substring(2, 10) || 'vote'}.pdf`;
    doc.save(filename);
    console.log('[PDFReceipt] Receipt downloaded:', filename);
    return true;
  } catch (error) {
    console.error('[PDFReceipt] Failed to generate PDF:', error);
    return false;
  }
};

/**
 * Generate QR code data URL for the verification URL
 * @param {string} verificationId - The vote verification ID
 * @returns {Promise<string>} - QR code data URL
 */
export const generateQRCodeDataUrl = async (verificationId) => {
  try {
    const QRCode = await import('qrcode');
    const url = `${window.location.origin}/verify-vote?id=${encodeURIComponent(verificationId)}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a202c',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('[PDFReceipt] QR code generation error:', error);
    return null;
  }
};

export default {
  generateReceiptPDF,
  downloadReceiptPDF,
  generateQRCodeDataUrl,
};