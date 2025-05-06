/** @format */

// File: pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
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
		revenue: 0,
		totalExpenses: 0,
		net: 0,
	});
	const [chartData, setChartData] = useState([]);
	const [subscriberBreakdown, setSubscriberBreakdown] = useState([]);
	const [discountHistory, setDiscountHistory] = useState([]);
	const [selectedYear, setSelectedYear] = useState('All');

	useEffect(() => {
		const fetchData = async () => {
			const [subsSnap, expensesSnap] = await Promise.all([
				getDocs(collection(db, 'subscribers')),
				getDocs(collection(db, 'expenses')),
			]);

			const now = new Date();
			const subscribers = subsSnap.docs.map((doc) => doc.data());

			// Moved this above to avoid redeclaration
			const expenses = expensesSnap.docs.map((doc) => doc.data());
			const totalExpensesValue = expenses.reduce(
				(sum, e) => sum + Number(e.amount || 0),
				0
			);

			let revenueMap = {};
			let totalPaid = 0;
			let totalSubPaymentsMap = {};
			let allDiscounts = [];

			const breakdown = subscribers.map((sub) => {
				const payments = sub.payments || {};
				const discounts = sub.discounts || {};

				Object.entries(payments).forEach(([month, amount]) => {
					totalSubPaymentsMap[sub.name] =
						(totalSubPaymentsMap[sub.name] || 0) + Number(amount);
					revenueMap[month] = (revenueMap[month] || 0) + Number(amount);
					totalPaid += Number(amount);
				});

				Object.entries(discounts).forEach(([month, value]) => {
					allDiscounts.push({ name: sub.name, month, discount: value });
				});

				const totalSubRevenue = totalSubPaymentsMap[sub.name] || 0;
				const totalSubDiscount = Object.values(discounts).reduce(
					(sum, v) => sum + Number(v || 0),
					0
				);
				const subscriberUsage =
					totalPaid > 0
						? totalSubRevenue - totalExpensesValue / subscribers.length
						: 0;

				const monthsSinceStart = sub.startDate
					? Math.max(
							0,
							new Date().getMonth() -
								new Date(sub.startDate).getMonth() +
								12 *
									(new Date().getFullYear() -
										new Date(sub.startDate).getFullYear())
					  )
					: 0;
				const expectedRevenue = monthsSinceStart * 30;
				const outstandingBalance = expectedRevenue - totalSubRevenue;

				return {
					name: sub.name,
					revenue: totalSubRevenue,
					totalDiscount: totalSubDiscount,
					net: totalSubRevenue - totalExpensesValue / subscribers.length,
					subscriberUsage,
					outstandingBalance,
				};
			});

			const chartDataFormatted = Object.entries(revenueMap)
				.map(([month, revenue]) => ({
					month,
					revenue,
				}))
				.sort((a, b) => new Date(a.month) - new Date(b.month));

			setStats({
				total: subscribers.length,
				due: subscribers.filter((s) => (s.paidMonths || 0) < 24).length,
				complete: subscribers.filter((s) => (s.paidMonths || 0) >= 24).length,
				revenue: totalPaid,
				totalExpenses: totalExpensesValue,
				net: totalPaid - totalExpensesValue,
			});

			setChartData(chartDataFormatted);
			setSubscriberBreakdown(breakdown.sort((a, b) => b.revenue - a.revenue));
			setDiscountHistory(
				allDiscounts.sort((a, b) => a.month.localeCompare(b.month))
			);
		};

		fetchData();
	}, []);

	const yearsAvailable = Array.from(
		new Set(chartData.map((entry) => entry.month.split('-')[0]))
	);
	const filteredChartData =
		selectedYear === 'All'
			? chartData
			: chartData.filter((entry) => entry.month.startsWith(selectedYear));

	return (
		<div className='space-y-6'>
			<div className='grid gap-4 grid-cols-1 sm:grid-cols-5'>
				<StatCard label='Total Subscribers' value={stats.total} />
				<StatCard label='Active/Due' value={stats.due} color='text-red-500' />
				<StatCard
					label='Completed'
					value={stats.complete}
					color='text-green-600'
				/>
				<StatCard
					label='Revenue (SAR)'
					value={stats.revenue}
					color='text-blue-600'
				/>
				<StatCard
					label='Expenses (SAR)'
					value={stats.totalExpenses}
					color='text-yellow-600'
				/>
			</div>

			<StatCard
				label='Net Profit (SAR)'
				value={stats.net}
				color='text-green-700'
			/>

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
					<thead className='bg-gray-200 text-left'>
						<tr>
							<th className='p-2'>Name</th>
							<th className='p-2'>Total Paid (SAR)</th>
							{/* <th className='p-2'>Outstanding (SAR)</th> */}
						</tr>
					</thead>
					<tbody>
						{subscriberBreakdown.map((sub, i) => (
							<tr key={i} className='border-b'>
								<td className='p-2'>{sub.name}</td>
								<td className='p-2'>{sub.revenue}</td>
								{/* <td className='p-2'>{sub.outstandingBalance?.toFixed(2)}</td> */}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className='bg-white p-4 rounded-xl shadow'>
				<h2 className='text-lg font-semibold mb-4'>Discount History</h2>
				<table className='w-full text-sm'>
					<thead className='bg-gray-200 text-left'>
						<tr>
							<th className='p-2'>Name</th>
							<th className='p-2'>Month</th>
							<th className='p-2'>Discount (SAR)</th>
						</tr>
					</thead>
					<tbody>
						{discountHistory.map((entry, index) => (
							<tr key={index} className='border-b'>
								<td className='p-2'>{entry.name}</td>
								<td className='p-2'>{entry.month}</td>
								<td className='p-2'>{entry.discount}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function StatCard({ label, value, color = 'text-gray-800' }) {
	return (
		<div className='bg-white p-4 rounded-xl shadow'>
			<h2 className='text-sm font-semibold text-gray-500'>{label}</h2>
			<p className={`text-xl font-bold ${color}`}>{value}</p>
		</div>
	);
}
