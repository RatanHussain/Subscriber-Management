// File: pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getMonthsDiff } from '../utils/subscriberUtils';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, due: 0, complete: 0, totalPaid: 0, revenue: 0, totalExpenses: 0, net: 0 });
  const [chartData, setChartData] = useState([]);
  const [subscriberBreakdown, setSubscriberBreakdown] = useState([]);
  const [discountHistory, setDiscountHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      const subsSnap = await getDocs(collection(db, 'subscribers'));
      const expensesSnap = await getDocs(collection(db, 'expenses'));

      const now = new Date();
      const subscribers = subsSnap.docs.map(doc => {
        const sub = doc.data();
        const paidMonths = sub.paidMonths || 0;
        const totalMonths = getMonthsDiff(sub.startDate);
        const discounts = sub.discounts || {};
        return { ...sub, paidMonths, totalMonths, discounts };
      });

      const monthlyRevenue = {};
      let totalPaid = 0;
      const discountHistory = [];

      subscribers.forEach(sub => {
        const start = new Date(sub.startDate);
        for (let i = 0; i < sub.paidMonths; i++) {
          const date = new Date(start);
          date.setMonth(date.getMonth() + i);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const discount = sub.discounts?.[key] || 0;
          const amount = 30 - discount;
          monthlyRevenue[key] = (monthlyRevenue[key] || 0) + amount;
          totalPaid += amount;

          if (discount > 0) {
            discountHistory.push({ name: sub.name, month: key, discount });
          }
        }
      });

      const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue
      })).sort((a, b) => new Date(a.month) - new Date(b.month));

      const expenses = expensesSnap.docs.map(doc => doc.data());
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const revenue = totalPaid;

      setStats({
        total: subscribers.length,
        due: subscribers.filter(s => s.paidMonths < 24 && s.paidMonths < s.totalMonths).length,
        complete: subscribers.filter(s => s.paidMonths >= s.totalMonths).length,
        totalPaid,
        revenue,
        totalExpenses,
        net: revenue - totalExpenses
      });

      setChartData(chartData);
      setSubscriberBreakdown(
        subscribers.map(s => ({ name: s.name, revenue: s.paidMonths * 30 })).sort((a, b) => b.revenue - a.revenue)
      );
      setDiscountHistory(discountHistory.sort((a, b) => a.month.localeCompare(b.month)));
    };

    fetchData();
  }, []);

  const yearsAvailable = Array.from(new Set(chartData.map(entry => entry.month.split('-')[0])));
  const filteredChartData = selectedYear === 'All' ? chartData : chartData.filter(entry => entry.month.startsWith(selectedYear));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-5">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Total Subscribers</h2>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Active/Due</h2>
          <p className="text-2xl font-bold text-red-500">{stats.due}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Completed</h2>
          <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Total Revenue (SAR)</h2>
          <p className="text-2xl font-bold text-blue-600">{stats.revenue}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Total Expenses (SAR)</h2>
          <p className="text-2xl font-bold text-yellow-600">{stats.totalExpenses}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold">Net Profit (SAR)</h2>
        <p className="text-2xl font-bold text-green-700">{stats.net}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Monthly Revenue Chart</h2>
          <select
            className="border px-3 py-1 rounded"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            <option value="All">All Years</option>
            {yearsAvailable.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredChartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Revenue by Subscriber</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Revenue (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {subscriberBreakdown.map((sub, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{sub.name}</td>
                <td className="p-2">{sub.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Discount History</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Month</th>
              <th className="p-2">Discount (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {discountHistory.map((entry, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{entry.name}</td>
                <td className="p-2">{entry.month}</td>
                <td className="p-2">{entry.discount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
