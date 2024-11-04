document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("salesChart").getContext("2d");
    const filterSelect = document.getElementById("sales-filter");

    let salesChart;

    const fetchDataAndRenderChart = async (filter) => {
      try {
        const response = await fetch(`/admin/sales-data?filter=${filter.toLowerCase()}`);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        const labels = data.map(item => {
          if (filter === 'weekly') return `Week ${item._id.week}, ${item._id.year}`;
          if (filter === 'monthly') return `Month ${item._id.month}, ${item._id.year}`;
          if (filter === 'yearly') return `Year ${item._id.year}`;
        });

        const salesAmount = data.map(item => item.totalSales);

        if (salesChart) salesChart.destroy();

        salesChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: `Total Sales (${filter})`,
              data: salesAmount,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchDataAndRenderChart(filterSelect.value);

    filterSelect.addEventListener("change", () => {
      fetchDataAndRenderChart(filterSelect.value);
    });
  });