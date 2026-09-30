import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, BarChart3 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export const AnalyticsCharts = ({ expenses = [] }) => {
  // Compute category totals
  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + (parseFloat(e.amount) || 0);
  });

  const categoryLabels = Object.keys(categoryMap);
  const categoryData = Object.values(categoryMap);

  const categoryChartData = {
    labels: categoryLabels.length ? categoryLabels : ['No Data'],
    datasets: [
      {
        data: categoryData.length ? categoryData : [1],
        backgroundColor: [
          '#6366f1',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 2,
        borderColor: '#111827'
      }
    ]
  };

  // Compute status breakdown count
  let paidCount = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;
  let dueSoonCount = 0;
  let pendingCount = 0;

  expenses.forEach(e => {
    if (e.status === 'PAID') {
      paidCount++;
    } else {
      if (e.computedStatus === 'OVERDUE') overdueCount++;
      else if (e.computedStatus === 'DUE_TODAY') dueTodayCount++;
      else if (e.computedStatus === 'DUE_SOON') dueSoonCount++;
      else pendingCount++;
    }
  });

  const statusChartData = {
    labels: ['Paid', 'Overdue', 'Due Today', 'Due Soon', 'Pending'],
    datasets: [
      {
        label: 'Expense Count',
        data: [paidCount, overdueCount, dueTodayCount, dueSoonCount, pendingCount],
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(156, 163, 175, 0.5)'
        ],
        borderRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
      }
    },
    scales: {
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { display: false }
      }
    }
  };

  return (
    <section className="charts-grid">
      <div className="chart-card card">
        <div className="card-header">
          <h3><PieChart size={18} /> Spending by Category</h3>
          <span className="card-subtitle">Category Breakdown</span>
        </div>
        <div className="chart-wrapper">
          <Doughnut data={categoryChartData} options={{ ...options, scales: undefined }} />
        </div>
      </div>

      <div className="chart-card card">
        <div className="card-header">
          <h3><BarChart3 size={18} /> Payment Status Distribution</h3>
          <span className="card-subtitle">Due & Paid Breakdown</span>
        </div>
        <div className="chart-wrapper">
          <Bar data={statusChartData} options={options} />
        </div>
      </div>
    </section>
  );
};
