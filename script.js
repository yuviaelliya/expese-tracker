/* DOM Elements */
const balance = document.getElementById('balance');
const incomeAmount = document.getElementById('income-amount');
const expenseAmount = document.getElementById('expense-amount');
const transactionList = document.getElementById('transaction-list');

const form = document.getElementById('transaction-form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const typeInput = document.getElementById('transaction-type');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const errorMessage = document.getElementById('error-message');
const exportBtn = document.getElementById('export-btn');

/* Storage Key */
const STORAGE_KEY = 'expense_tracker_transactions_v2';

/* Default Initial Data (Matches Prompt Image) */
const DEFAULT_TRANSACTIONS = [
  { id: '1', name: 'Monthly Salary', category: 'Salary', date: '2026-10-06', amount: 25000, type: 'income' },
  { id: '2', name: 'Groceries', category: 'Groceries', date: '2026-10-05', amount: -2400, type: 'expense' },
  { id: '3', name: 'Bus Pass', category: 'Transport', date: '2026-10-03', amount: -1200, type: 'expense' },
  { id: '4', name: 'Electricity Bill', category: 'Bills', date: '2026-10-01', amount: -2950, type: 'expense' }
];

/* Load Transactions from LocalStorage or use defaults */
let storedData = localStorage.getItem(STORAGE_KEY);
let transactions = storedData ? JSON.parse(storedData) : DEFAULT_TRANSACTIONS;

/* Helper: Save to Storage */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/* Helper: Format Date for Display (e.g., 06 Oct 2026) */
function formatDateTable(dateStr) {
  if (!dateStr) return '';
  const dt = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(dt.getTime())) return dateStr;
  
  const day = String(dt.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dt.getMonth()];
  const year = dt.getFullYear();
  return `${day} ${month} ${year}`;
}

/* Helper: Format ISO Date (YYYY-MM-DD) */
function getTodayISO() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* Helper: Format Currency */
function formatCurrency(val, includeDecimal = true) {
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimal ? 2 : 0,
    maximumFractionDigits: includeDecimal ? 2 : 0
  });
  return formatted;
}

/* Render Totals */
function updateTotals() {
  const amounts = transactions.map(t => t.amount);
  const total = amounts.reduce((acc, item) => acc + item, 0);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
  const expense = Math.abs(amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0));

  balance.textContent = `₹${formatCurrency(total, true)}`;
  incomeAmount.textContent = `+₹${formatCurrency(income, true)}`;
  expenseAmount.textContent = `–₹${formatCurrency(expense, true)}`;
}

/* Render History Table */
function renderTransactions() {
  transactionList.innerHTML = '';

  if (transactions.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px 0;">No transactions found.</td>`;
    transactionList.appendChild(tr);
    return;
  }

  transactions.forEach(t => {
    const tr = document.createElement('tr');

    const isIncome = t.amount > 0;
    const amountFormatted = isIncome
      ? `+₹${formatCurrency(t.amount, false)}`
      : `–₹${formatCurrency(Math.abs(t.amount), false)}`;

    const amountClass = isIncome ? 'plus' : 'minus';

    tr.innerHTML = `
      <td class="transaction-name">${t.name}</td>
      <td class="category">${t.category || 'Other'}</td>
      <td class="date">${formatDateTable(t.date)}</td>
      <td class="amount ${amountClass}">
        ${amountFormatted}
        <button class="delete-row-btn" onclick="removeTransaction('${t.id}')" title="Delete">✕</button>
      </td>
    `;

    transactionList.appendChild(tr);
  });
}

/* Add Transaction handler */
function addTransaction(e) {
  e.preventDefault();

  const name = textInput.value.trim();
  const amtValue = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const type = typeInput.value;

  if (!name) {
    showError('Please enter a valid transaction name.');
    return;
  }

  if (isNaN(amtValue) || amtValue <= 0) {
    showError('Please enter a valid positive amount.');
    return;
  }

  const finalAmount = type === 'expense' ? -Math.abs(amtValue) : Math.abs(amtValue);

  const newTransaction = {
    id: String(Date.now()),
    name,
    category,
    date: getTodayISO(),
    amount: finalAmount,
    type
  };

  transactions.unshift(newTransaction);
  saveToStorage();
  renderTransactions();
  updateTotals();

  // Reset inputs
  textInput.value = '';
  amountInput.value = '';
}

/* Remove Transaction */
function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  renderTransactions();
  updateTotals();
}

/* Toggle Income / Expense type */
toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    typeInput.value = btn.getAttribute('data-type');
  });
});

/* Show Error */
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 3000);
}

/* Export CSV */
function exportToCSV() {
  if (transactions.length === 0) {
    showError('No transactions to export.');
    return;
  }

  const headers = ['Transaction', 'Category', 'Date', 'Amount', 'Type'];
  const rows = transactions.map(t => [
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.date,
    t.amount,
    t.type
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Expense_Report_${getTodayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* Init */
function init() {
  renderTransactions();
  updateTotals();
}

form.addEventListener('submit', addTransaction);
exportBtn.addEventListener('click', exportToCSV);

window.removeTransaction = removeTransaction;

init();