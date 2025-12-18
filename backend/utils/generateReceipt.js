import PDFDocument from "pdfkit";

export const generateReceiptPDF = (res, data) => {
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=receipt.pdf");

  doc.pipe(res);

  doc.fontSize(18).text("Karnataka Govt. Polytechnic", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Student Name: ${data.name}`);
  doc.text(`USN: ${data.usn}`);
  doc.text(`Semester: ${data.semester}`);
  doc.text(`Amount Paid: ₹${data.amount}`);
  doc.text(`Payment Date: ${new Date().toLocaleDateString()}`);

  doc.end();
};
