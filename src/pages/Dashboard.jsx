/** @format */

// File: pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getMonthsDiff } from '../utils/subscriberUtils';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
	const [stats, setStats] = useState({
		total: 0,
		due: 0,
		complete: 0,
		totalPaid: 0,
	});
	const [chartData, setChartData] = useState([]);
	const [subscriberBreakdown, setSubscriberBreakdown] = useState([]);
	const [selectedYear, setSelectedYear] = useState('All');
	const [expenses, setExpenses] = useState([]);
	const [newExpense, setNewExpense] = useState({
		amount: '',
		note: '',
		date: '',
	});

	const yearsAvailable = Array.from(
		new Set(chartData.map((entry) => entry.month.split('-')[0]))
	);

	const filteredChartData =
		selectedYear === 'All'
			? chartData
			: chartData.filter((entry) => entry.month.startsWith(selectedYear));

	useEffect(() => {
		const fetchStats = async () => {
			const subSnap = await getDocs(collection(db, 'subscribers'));
			const expSnap = await getDocs(collection(db, 'expenses'));

			const now = new Date();
			const processed = subSnap.docs.map((doc) => {
				const sub = doc.data();
				const paidMonths = sub.paidMonths || 0;
				const totalMonths = getMonthsDiff(sub.startDate);
				return {
					...sub,
					paidMonths,
					due: paidMonths < 24 && paidMonths < totalMonths,
				};
			});

			const total = processed.length;
			const totalPaid = processed.reduce(
				(sum, sub) => sum + (sub.paidMonths || 0),
				0
			);
			const due = processed.filter((sub) => sub.due).length;
			const complete = total - due;
			const revenue = totalPaid * 30;

			const monthlyRevenue = {};
			processed.forEach((sub) => {
				const startDate = new Date(sub.startDate);
				for (let i = 0; i < sub.paidMonths; i++) {
					const monthKey = `${startDate.getFullYear()}-${String(
						startDate.getMonth() + i + 1
					).padStart(2, '0')}`;
					monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + 30;
				}
			});

			const chartDataFormatted = Object.entries(monthlyRevenue)
				.map(([month, revenue]) => ({
					month,
					revenue,
				}))
				.sort((a, b) => new Date(a.month) - new Date(b.month));

			const subscriberRevenue = processed
				.map((sub) => ({
					name: sub.name,
					revenue: sub.paidMonths * 30,
				}))
				.sort((a, b) => b.revenue - a.revenue);

			const expenseData = expSnap.docs.map((doc) => doc.data());
			const totalExpenses = expenseData.reduce(
				(sum, e) => sum + Number(e.amount || 0),
				0
			);

			setStats({
				total,
				due,
				complete,
				totalPaid,
				revenue,
				totalExpenses,
				net: revenue - totalExpenses,
			});
			setChartData(chartDataFormatted);
			setSubscriberBreakdown(subscriberRevenue);
			setExpenses(expenseData);
		};

		fetchStats();
	}, []);

	const handleAddExpense = async (e) => {
		e.preventDefault();
		if (!newExpense.amount || !newExpense.date) return;
		await addDoc(collection(db, 'expenses'), {
			...newExpense,
			amount: Number(newExpense.amount),
		});
		setNewExpense({ amount: '', note: '', date: '' });
		window.location.reload();
	};

	return (
		<div className='space-y-6'>
			<div className='grid gap-4 grid-cols-1 sm:grid-cols-5'>
				<div className='bg-white p-4 rounded-xl shadow'>
					<h2 className='text-lg font-semibold'>Total Subscribers</h2>
					<p className='text-2xl font-bold'>{stats.total}</p>
				</div>
				<div className='bg-white p-4 rounded-xl shadow'>
					<h2 className='text-lg font-semibold'>Active/Due</h2>
					<p className='text-2xl font-bold text-red-500'>{stats.due}</p>
				</div>
				<div className='bg-white p-4 rounded-xl shadow'>
					<h2 className='text-lg font-semibold'>Completed</h2>
					<p className='text-2xl font-bold text-green-600'>{stats.complete}</p>
				</div>
				<div className='bg-white p-4 rounded-xl shadow'>
					<h2 className='text-lg font-semibold'>Total Revenue (SAR)</h2>
					<p className='text-2xl font-bold text-blue-600'>{stats.revenue}</p>
				</div>
				<div className='bg-white p-4 rounded-xl shadow'>
					<h2 className='text-lg font-semibold'>Total Expenses (SAR)</h2>
					<p className='text-2xl font-bold text-yellow-600'>
						{stats.totalExpenses}
					</p>
				</div>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
				<div className='bg-white p-4 rounded-xl shadow'>
					<h2 className='text-lg font-semibold'>Net Profit (SAR)</h2>
					<p className='text-2xl font-bold text-green-700'>{stats.net}</p>
				</div>
				<form
					onSubmit={handleAddExpense}
					className='bg-white p-4 rounded-xl shadow flex flex-col gap-2'>
					<h2 className='text-lg font-semibold'>Add Expense</h2>
					<input
						type='number'
						placeholder='Amount'
						className='border p-2 rounded'
						value={newExpense.amount}
						onChange={(e) =>
							setNewExpense({ ...newExpense, amount: e.target.value })
						}
					/>
					<input
						type='date'
						className='border p-2 rounded'
						value={newExpense.date}
						onChange={(e) =>
							setNewExpense({ ...newExpense, date: e.target.value })
						}
					/>
					<input
						type='text'
						placeholder='Note (optional)'
						className='border p-2 rounded'
						value={newExpense.note}
						onChange={(e) =>
							setNewExpense({ ...newExpense, note: e.target.value })
						}
					/>
					<button className='bg-yellow-500 text-white py-2 rounded'>
						Add Expense
					</button>
				</form>
			</div>

			<div className='bg-white p-4 rounded-xl shadow'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-lg font-semibold'>Monthly Revenue Chart</h2>
					<select
						className='border px-3 py-1 rounded'
						value={selectedYear}
						onChange={(e) => setSelectedYear(e.target.value)}>
						<option value='All'>All Years</option>
						{yearsAvailable.map((year) => (
							<option key={year} value={year}>
								{year}
							</option>
						))}
					</select>
				</div>
				<ResponsiveContainer width='100%' height={300}>
					<BarChart data={filteredChartData}>
						<XAxis dataKey='month' />
						<YAxis />
						<Tooltip />
						<Bar dataKey='revenue' fill='#3B82F6' />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className='bg-white p-4 rounded-xl shadow'>
				<h2 className='text-lg font-semibold mb-4'>Revenue by Subscriber</h2>
				<table className='w-full text-sm'>
					<thead>
						<tr className='bg-gray-200 text-left'>
							<th className='p-2'>Name</th>
							<th className='p-2'>Revenue (SAR)</th>
						</tr>
					</thead>
					<tbody>
						{subscriberBreakdown.map((sub, i) => (
							<tr key={i} className='border-b'>
								<td className='p-2'>{sub.name}</td>
								<td className='p-2'>{sub.revenue}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
