async function generateSalesReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (reportType === "custom" && (!startDate || !endDate)) {
      Swal.fire({
        icon: 'warning',
        text: 'Please provide both start and end dates for the custom date range.',
        confirmButtonText: 'Okay'
      });
      return;
    }

    try {
      const response = await fetch('/admin/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType, startDate, endDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching report: ${errorData.message}`);
      }

      const reportData = await response.json();
      


      const tbody = document.getElementById('salesReportTable').getElementsByTagName('tbody')[0];
      tbody.innerHTML = ''; // Clear existing rows

      reportData.orders.forEach(order => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = order._id;                                                    // Order ID
        row.insertCell(1).textContent = parseFloat(order.afteroffer).toFixed(2);                      // Offer Discount
        row.insertCell(2).textContent = parseFloat(order.discountAmount).toFixed(2);                  // Coupon Discount
        row.insertCell(3).textContent = parseFloat(order.totalAfterDiscount).toFixed(2);              // Total Discount
        row.insertCell(4).textContent = parseFloat(order.paymentTotal).toFixed(2);                    // Total Amount
        row.insertCell(5).textContent = order.status;                                                 // Status
      });

      // Update overall stats
      document.getElementById('overallSalesCount').textContent = `Overall Sales Count: ${reportData.overallSalesCount}`;
      document.getElementById('overallOrderAmount').textContent = `Overall Order Amount: $${parseFloat(reportData.paymentTotal).toFixed(2)}`;
      document.getElementById('overallDiscount').textContent = `Overall Discount: $${parseFloat(reportData.overallDiscount).toFixed(2)}`;
      document.getElementById('overallCouponDeductions').textContent = `Overall Coupon Deductions: $${parseFloat(reportData.overallCouponDeductions).toFixed(2)}`;
    } catch (error) {
      console.error('Error generating report:', error.message);
      alert('An error occurred while generating the report. Please try again.');
    }
  }

  function toggleCustomDate() {
    const reportType = document.getElementById('reportType').value;
    const customDateRange = document.getElementById('customDateRange');

    if (reportType === "custom") {
      customDateRange.style.display = "block";
    } else {
      customDateRange.style.display = "none";
      document.getElementById('startDate').value = "";
      document.getElementById('endDate').value = "";
    }
  }


  function closeModal() {
    document.getElementById('salesReportModal').style.display = 'none';
  }

  async function downloadPDF() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Input validation
    if (reportType === "custom") {
      Swal.fire({
        icon: 'warning',
        text: 'Please fill in all fields.',
        confirmButtonText: 'Okay'
      });
      return;
    }



    try {
      const response = await fetch('/admin/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType, startDate, endDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching report: ${errorData.message}`);
      }

      const reportData = await response.json();
      const orders = reportData.orders;
      

      // Now, use the fetched orders to generate the PDF
      const pdfResponse = await fetch('/admin/sales-report-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders }),
      });

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json();
        throw new Error(`Error generating PDF: ${errorData.message}`);
      }

      const blob = await pdfResponse.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'sales_report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error.message);
      alert('An error occurred while downloading the report. Please try again.');
    }
  }

  async function downloadCSV() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;


    if (reportType === "custom") {
      Swal.fire({
        icon: 'warning',
        text: 'Please fill in all fields.',
        confirmButtonText: 'Okay'
      });
      return;
    }


    try {
      const response = await fetch('/admin/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType, startDate, endDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error fetching report: ${errorData.message}`);
      }

      const reportData = await response.json();
      const orders = reportData.orders;

      const csvResponse = await fetch('/admin/sales-report-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders }),
      });

      if (!csvResponse.ok) {
        const errorData = await csvResponse.json();
        throw new Error(`Error generating CSV: ${errorData.message}`);
      }

      const blob = await csvResponse.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'sales_report.csv';
      link.click();
    } catch (error) {
      console.error('Download failed:', error.message);
      alert('An error occurred while downloading the report. Please try again.');
    }
  }
