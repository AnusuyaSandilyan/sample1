import * as XLSX from 'xlsx';

/**
 * Generates and downloads a clean, realistic Excel sheet template
 * with sample expenses, due dates, categories, and payment statuses.
 */
export const downloadSampleExcelTemplate = () => {
    const today = new Date();
    
    // Helper to format date offset relative to today
    const formatDate = (daysOffset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
    };

    const sampleRows = [
        {
            'Expense Name': 'Office Fiber Internet & WiFi',
            'Category': 'Utilities',
            'Amount ($)': 149.99,
            'Due Date': formatDate(-2), // Overdue by 2 days
            'Status': 'Pending',
            'Category Budget ($)': 400.00,
            'Notes': 'Account #UTIL-9981'
        },
        {
            'Expense Name': 'AWS Cloud Infrastructure (EC2/RDS)',
            'Category': 'Cloud & Hosting',
            'Amount ($)': 520.00,
            'Due Date': formatDate(0), // Due Today
            'Status': 'Pending',
            'Category Budget ($)': 500.00, // Exceeded budget
            'Notes': 'Monthly billing statement'
        },
        {
            'Expense Name': 'Adobe Creative Cloud Licenses',
            'Category': 'Software & Subscriptions',
            'Amount ($)': 89.99,
            'Due Date': formatDate(3), // Due in 3 days
            'Status': 'Pending',
            'Category Budget ($)': 300.00,
            'Notes': 'Design team seats'
        },
        {
            'Expense Name': 'Commercial Building Rent',
            'Category': 'Real Estate',
            'Amount ($)': 2800.00,
            'Due Date': formatDate(-12),
            'Status': 'Paid',
            'Category Budget ($)': 3000.00,
            'Notes': 'Paid via wire transfer'
        },
        {
            'Expense Name': 'Google Workspace Team Email',
            'Category': 'Software & Subscriptions',
            'Amount ($)': 72.00,
            'Due Date': formatDate(5),
            'Status': 'Pending',
            'Category Budget ($)': 300.00,
            'Notes': 'Auto-debit configured'
        },
        {
            'Expense Name': 'Office Snacks & Espresso Coffee',
            'Category': 'Office Supplies',
            'Amount ($)': 210.50,
            'Due Date': formatDate(10),
            'Status': 'Pending',
            'Category Budget ($)': 200.00,
            'Notes': 'Weekly restocking'
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    
    // Auto column widths
    worksheet['!cols'] = [
        { wch: 35 }, // Expense Name
        { wch: 22 }, // Category
        { wch: 12 }, // Amount
        { wch: 14 }, // Due Date
        { wch: 12 }, // Status
        { wch: 18 }, // Budget
        { wch: 25 }  // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Expenses');

    XLSX.writeFile(workbook, 'Smart_Expense_Template.xlsx');
};
