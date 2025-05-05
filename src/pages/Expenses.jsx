// File: pages/Expenses.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [newExpense, setNewExpense] = useState({ amount: '', note: '', date: '' });
  const [yearFilter, setYearFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');

  const fetchExpenses = async () => {
    const snapshot = await getDocs(collection(db, 'expenses'));
    const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    setExpenses(data);

    const monthly = {};
    data.forEach(exp => {
      const date = new Date(exp.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + Number(exp.amount);
    });

    const chartDataFormatted = Object.entries(monthly).map(([month, amount]) => ({
      month,
      amount
    })).sort((a, b) => new Date(a.month) - new Date(b.month));

    setChartData(chartDataFormatted);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.date) return;
    await addDoc(collection(db, 'expenses'), {
      ...newExpense,
      amount: Number(newExpense.amount)
    });
    setNewExpense({ amount: '', note: '', date: '' });
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this expense?');
    if (confirmed) {
      await deleteDoc(doc(db, 'expenses', id));
      fetchExpenses();
    }
  };

  const handleEdit = async (id, field, value) => {
    await updateDoc(doc(db, 'expenses', id), {
      [field]: field === 'amount' ? Number(value) : value
    });
    fetchExpenses();
  };

  const years = Array.from(new Set(expenses.map(e => new Date(e.date).getFullYear().toString())));
  const months = [
    '01','02','03','04','05','06','07','08','09','10','11','12'
  ];

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    const y = d.getFullYear().toString();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return (yearFilter === 'All' || y === yearFilter) && (monthFilter === 'All' || m === monthFilter);
  });

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-xl shadow flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Add Expense</h2>
        <input
          type="number"
          placeholder="Amount"
          className="border p-2 rounded"
          value={newExpense.amount}
          onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={newExpense.date}
          onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Note (optional)"
          className="border p-2 rounded"
          value={newExpense.note}
          onChange={e => setNewExpense({ ...newExpense, note: e.target.value })}
        />
        <button className="bg-yellow-500 text-white py-2 rounded">Add Expense</button>
      </form>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex gap-4 mb-4">
          <select
            className="border p-2 rounded"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="All">All Years</option>
            {years.map((y, i) => <option key={i} value={y}>{y}</option>)}
          </select>
          <select
            className="border p-2 rounded"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            <option value="All">All Months</option>
            {months.map((m, i) => <option key={i} value={m}>{m}</option>)}
          </select>
        </div>

        <h2 className="text-xl font-bold mb-4">Expense List</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Amount (SAR)</th>
              <th className="p-2">Note</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">
                  <input
                    type="date"
                    value={exp.date}
                    onChange={(e) => handleEdit(exp.id, 'date', e.target.value)}
                    className="border px-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={exp.amount}
                    onChange={(e) => handleEdit(exp.id, 'amount', e.target.value)}
                    className="border px-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={exp.note || ''}
                    onChange={(e) => handleEdit(exp.id, 'note', e.target.value)}
                    className="border px-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <button onClick={() => handleDelete(exp.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Monthly Expenses Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
