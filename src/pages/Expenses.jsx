/** @format */

// File: pages/Expenses.jsx
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

export default function Expenses() {
	const [expenses, setExpenses] = useState([]);
	const [chartData, setChartData] = useState([]);

	useEffect(() => {
		const fetchExpenses = async () => {
			const snapshot = await getDocs(collection(db, 'expenses'));
			const data = snapshot.docs.map((doc) => doc.data());

			const monthly = {};
			data.forEach((exp) => {
				const date = new Date(exp.date);
				const key = `${date.getFullYear()}-${String(
					date.getMonth() + 1
				).padStart(2, '0')}`;
				monthly[key] = (monthly[key] || 0) + Number(exp.amount);
			});

			const chartDataFormatted = Object.entries(monthly)
				.map(([month, amount]) => ({
					month,
					amount,
				}))
				.sort((a, b) => new Date(a.month) - new Date(b.month));

			setExpenses(data);
			setChartData(chartDataFormatted);
		};

		fetchExpenses();
	}, []);

	return (
		<div className='space-y-6'>
			<div className='bg-white p-4 rounded-xl shadow'>
				<h2 className='text-xl font-bold mb-4'>Expense List</h2>
				<table className='w-full text-sm'>
					<thead>
						<tr className='bg-gray-200 text-left'>
							<th className='p-2'>Date</th>
							<th className='p-2'>Amount (SAR)</th>
							<th className='p-2'>Note</th>
						</tr>
					</thead>
					<tbody>
						{expenses.map((exp, i) => (
							<tr key={i} className='border-b'>
								<td className='p-2'>{exp.date}</td>
								<td className='p-2'>{exp.amount}</td>
								<td className='p-2'>{exp.note || '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className='bg-white p-4 rounded-xl shadow'>
				<h2 className='text-lg font-semibold mb-4'>Monthly Expenses Chart</h2>
				<ResponsiveContainer width='100%' height={300}>
					<BarChart data={chartData}>
						<XAxis dataKey='month' />
						<YAxis />
						<Tooltip />
						<Bar dataKey='amount' fill='#facc15' />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
