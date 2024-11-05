const admin = require("../../models/admin");
const Order = require("../../models/Order");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");
const path = require("path");
const { log } = require("console");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});


exports.renderSalesReportPage = async (req, res) => {
    try {
      const adminData = await admin.find();
      res.render("admin/salesreport", { admin: adminData });
    } catch (error) {
      
    }
  };
  
  exports.getSalesReport = async (req, res) => {
    try {
      const { reportType, startDate, endDate } = req.body;
      let filter = {};
  
      if (reportType === "daily") {
        filter = { placedAt: { $gte: new Date().setHours(0, 0, 0, 0) } };
      } else if (reportType === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filter = { placedAt: { $gte: weekAgo } };
      } else if (reportType === "monthly") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filter = { placedAt: { $gte: monthAgo } };
      } else if (reportType === "yearly") {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filter = { placedAt: { $gte: yearAgo } };
      } else if (reportType === "custom" && startDate && endDate) {
        filter = {
          placedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      }
  
      const orders = await Order.find(filter);
  
      const overallSalesCount = orders.length;
      const paymentTotal = orders.reduce(
        (acc, order) => acc + order.paymentTotal,
        0
      );
      const overallDiscount = orders.reduce(
        (acc, order) => acc + order.totalAfterDiscount,
        0
      );
      const overallCouponDeductions = orders.reduce(
        (acc, order) => acc + (order.discountAmount || 0),
        0
      );
  
      res.json({
        orders,
        overallSalesCount,
        paymentTotal,
        overallDiscount,
        overallCouponDeductions,
      });
    } catch (error) {
      console.error("Error generating sales report:", error);
      res.status(500).json({ message: "Error generating sales report" });
    }
  };
  
  exports.downloadSalesReportCSV = async (req, res) => {
    try {
      const { orders } = req.body;
       
  
      const fields = [
        { label: "Order ID", value: "_id" },
        { label: "Offer Discount", value: "afteroffer" },
        { label: "Coupon Discount", value: "discountAmount" },
        { label: "Total Discount", value: "totalAfterDiscount" },
        { label: "Total Amount", value: "paymentTotal" },
        { label: "Status", value: "status" },
      ];
  
      const parser = new Parser({ fields });
      const csv = parser.parse(orders);
  
      res.header("Content-Type", "text/csv");
      res.attachment("sales_report.csv");
      return res.send(csv);
    } catch (error) {
      
      return res
        .status(500)
        .json({ message: "An error occurred while generating the CSV." });
    }
  };
  
  exports.downloadSalesReportPDF = async (req, res) => {
    try {
      const { orders } = req.body;
  
      // Check if the orders data is valid
      if (!Array.isArray(orders)) {
        console.error("Invalid orders data:", orders);
        return res.status(400).json({ message: "Invalid orders data." });
      }
  
      const doc = new PDFDocument();
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="sales_report.pdf"'
      );
      res.setHeader("Content-Type", "application/pdf");
  
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Sales Report", { align: "center" });
      doc.moveDown(2);
  
      const tableTop = 180;
      const cellHeight = 40;
      const columnWidths = [100, 80, 100, 80, 80, 80]; 
      const columns = [
        "Order ID",
        "Offer Discount",
        "Coupon Discount",
        "Total Discount",
        "Total Amount",
        "Status",
      ];
  
      const drawRow = (y, rowValues, isHeader = false) => {
        doc.lineWidth(0.5);
        let x = 30; // Starting x position for the first column
  
        rowValues.forEach((text, i) => {
          if (isHeader) {
            doc.font("Helvetica-Bold").fontSize(10); // Larger text for headers
          } else {
            doc.font("Helvetica").fontSize(8); // Smaller text for content rows
          }
  
          doc.rect(x, y, columnWidths[i], cellHeight).stroke(); // Draw cell border
          doc.text(text, x + 5, y + 7, {
            width: columnWidths[i] - 5,
            align: "left",
          }); // Add text inside the cell
          x += columnWidths[i]; // Move to the next column
        });
      };
  
      drawRow(tableTop, columns, true);
  
      let yPos = tableTop + cellHeight;
  
      orders.forEach((order) => {
        const orderId = order._id || "N/A"; // Fallback to "N/A" if order ID is missing
        const offerDiscount = order.afteroffer || 0; // Offer Discount
        const couponDiscount = order.discountAmount || 0; // Coupon Discount
        const totalDiscount = order.totalAfterDiscount || 0; // Total Discount
        const totalAmount = parseFloat(order.paymentTotal).toFixed(2); // Total Amount
        const status = order.status || "N/A"; // Status fallback
  
        const row = [
          `${orderId}`, // Order ID
          `${offerDiscount}`, // Offer Discount
          `${couponDiscount}`, // Coupon Discount
          `${totalDiscount}`, // Total Discount
          `${totalAmount}`, // Total Amount (calculated)
          `${status}`, // Status
        ];
  
        // Draw this row in the PDF table
        drawRow(yPos, row);
        yPos += cellHeight; // Move to the next row position
      });
  
      // Finalize the PDF document and send it as a response
      doc.pipe(res);
      doc.end();
      
    } catch (error) {
      console.error("Error generating PDF:", error.message);
      return res
        .status(500)
        .json({ message: "An error occurred while generating the PDF." });
    }
  };
  