/** @format */

// File: pages/SubscriberList.jsx
import { useEffect, useState } from 'react';
import {
	collection,
	getDocs,
	updateDoc,
	doc,
	addDoc,
	deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
	getMonthsDiff,
	getNextDueDate,
	formatDate,
} from '../utils/subscriberUtils';

export default function SubscriberList() {
	const [subscribers, setSubscribers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [newSubscriber, setNewSubscriber] = useState({
		name: '',
		phone: '',
		startDate: '',
		discounts: {},
		payments: {},
	});

	const currentMonthKey = new Date().toISOString().slice(0, 7);

	const handlePaymentChange = async (subscriberId, value) => {
		const ref = doc(db, 'subscribers', subscriberId);
		const snapshot = await getDocs(collection(db, 'subscribers'));
		const docData = snapshot.docs
			.find((doc) => doc.id === subscriberId)
			?.data();
		const payments = { ...docData.payments, [currentMonthKey]: Number(value) };
		await updateDoc(ref, { payments });
		window.location.reload();
	};

	const handleAddSubscriber = async (e) => {
		e.preventDefault();
		if (!newSubscriber.name || !newSubscriber.phone || !newSubscriber.startDate)
			return;
		await addDoc(collection(db, 'subscribers'), {
			...newSubscriber,
			paidMonths: 0,
			discounts: newSubscriber.discounts || {},
			payments: newSubscriber.payments || {},
		});
		setNewSubscriber({
			name: '',
			phone: '',
			startDate: '',
			discounts: {},
			payments: {},
		});
		window.location.reload();
	};

	const handleDelete = async (id) => {
		if (window.confirm('Are you sure you want to delete this subscriber?')) {
			await deleteDoc(doc(db, 'subscribers', id));
			window.location.reload();
		}
	};

	const handleEdit = async (id, updatedSub, monthDiscount) => {
		const subRef = doc(db, 'subscribers', id);
		const discounts = updatedSub.discounts || {};
		discounts[currentMonthKey] = monthDiscount;
		await updateDoc(subRef, { ...updatedSub, discounts });
		window.location.reload();
	};

	useEffect(() => {
		const fetchData = async () => {
			const snapshot = await getDocs(collection(db, 'subscribers'));
			const now = new Date();
			const list = snapshot.docs.map((docSnap) => {
				const sub = docSnap.data();
				const paidMonths = sub.paidMonths || 0;
				const discounts = sub.discounts || {};
				const payments = sub.payments || {};
				const discount = Number(discounts[currentMonthKey] || 0);
				const payment = Number(payments[currentMonthKey] || 0);
				const nextDueDate = getNextDueDate(sub.startDate, paidMonths);
				const monthlyFee = 30 - discount;

				const totalDue = (() => {
					const dueCount = paidMonths < 24 && now > nextDueDate ? 2 : 1;
					return dueCount * monthlyFee;
				})();

				const message =
					totalDue > monthlyFee
						? `Your WiFi bill previous month ${monthlyFee} and current month ${monthlyFee} total ${totalDue} riyal. Please pay as soon as possible.`
						: `Your WiFi bill expired in ${formatDate(
								nextDueDate
						  )}. Please pay ${monthlyFee} riyal as soon as possible.`;

				return {
					id: docSnap.id,
					...sub,
					paidMonths,
					discount,
					discounts,
					payment,
					payments,
					remainingMonths: 24 - paidMonths,
					due: paidMonths < 24,
					whatsappLink: `https://wa.me/${sub.phone}?text=${encodeURIComponent(
						message
					)}`,
				};
			});

			setSubscribers(list);
			setLoading(false);
		};

		fetchData();
	}, [currentMonthKey]);

	if (loading) return <div className='p-4'>Loading subscribers...</div>;

	return (
		<div className='bg-white p-4 rounded-xl shadow space-y-6'>
			<h2 className='text-xl font-bold'>Subscriber List</h2>

			<form
				onSubmit={handleAddSubscriber}
				className='grid grid-cols-1 sm:grid-cols-6 gap-4 bg-gray-50 p-4 rounded'>
				<input
					type='text'
					placeholder='Name'
					value={newSubscriber.name}
					onChange={(e) =>
						setNewSubscriber({ ...newSubscriber, name: e.target.value })
					}
					className='border p-2 rounded'
				/>
				<input
					type='text'
					placeholder='Phone'
					value={newSubscriber.phone}
					onChange={(e) =>
						setNewSubscriber({ ...newSubscriber, phone: e.target.value })
					}
					className='border p-2 rounded'
				/>
				<input
					type='date'
					value={newSubscriber.startDate}
					onChange={(e) =>
						setNewSubscriber({ ...newSubscriber, startDate: e.target.value })
					}
					className='border p-2 rounded'
				/>
				<input
					type='number'
					placeholder='Discount'
					value={newSubscriber.discounts?.[currentMonthKey] || ''}
					onChange={(e) =>
						setNewSubscriber({
							...newSubscriber,
							discounts: {
								...newSubscriber.discounts,
								[currentMonthKey]: Number(e.target.value) || 0,
							},
						})
					}
					className='border p-2 rounded'
				/>
				<input
					type='number'
					placeholder='Initial Payment'
					value={newSubscriber.payments?.[currentMonthKey] || ''}
					onChange={(e) =>
						setNewSubscriber({
							...newSubscriber,
							payments: {
								...newSubscriber.payments,
								[currentMonthKey]: Number(e.target.value) || 0,
							},
						})
					}
					className='border p-2 rounded'
				/>
				<button
					type='submit'
					className='bg-blue-600 text-white rounded px-4 py-2'>
					Add
				</button>
			</form>

			<table className='min-w-full text-sm'>
				<thead>
					<tr className='bg-gray-200'>
						<th className='p-2'>Name</th>
						<th className='p-2'>Phone</th>
						<th className='p-2'>Start Date</th>
						<th className='p-2'>Paid</th>
						<th className='p-2'>Remain</th>
						<th className='p-2'>{currentMonthKey} Discount</th>
						<th className='p-2'>{currentMonthKey} Payment</th>
						<th className='p-2'>WhatsApp</th>
						<th className='p-2'>Actions</th>
					</tr>
				</thead>
				<tbody>
					{subscribers.map((sub, i) => (
						<tr key={i} className={sub.due ? 'bg-red-50' : 'bg-green-50'}>
							<td className='p-2'>
								<input
									className='w-full border rounded px-1'
									value={sub.name}
									onChange={(e) =>
										setSubscribers((prev) => {
											const copy = [...prev];
											copy[i].name = e.target.value;
											return copy;
										})
									}
								/>
							</td>
							<td className='p-2'>
								<input
									className='w-full border rounded px-1'
									value={sub.phone}
									onChange={(e) =>
										setSubscribers((prev) => {
											const copy = [...prev];
											copy[i].phone = e.target.value;
											return copy;
										})
									}
								/>
							</td>
							<td className='p-2'>
								<input
									type='date'
									className='w-full border rounded px-1'
									value={sub.startDate}
									onChange={(e) =>
										setSubscribers((prev) => {
											const copy = [...prev];
											copy[i].startDate = e.target.value;
											return copy;
										})
									}
								/>
							</td>
							<td className='p-2'>{sub.paidMonths}</td>
							<td className='p-2'>{sub.remainingMonths}</td>

							<td className='p-2'>
								<input
									type='number'
									className='w-full border rounded px-1'
									value={sub.discounts?.[currentMonthKey] || 0}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleEdit(
												sub.id,
												{
													name: sub.name,
													phone: sub.phone,
													startDate: sub.startDate,
													discounts: {
														...sub.discounts,
														[currentMonthKey]: Number(e.target.value) || 0,
													},
													payments: sub.payments || {},
												},
												Number(e.target.value) || 0
											);
										}
									}}
									onChange={(e) =>
										setSubscribers((prev) => {
											const copy = [...prev];
											copy[i].discounts[currentMonthKey] =
												Number(e.target.value) || 0;
											return copy;
										})
									}
								/>
							</td>
							<td className='p-2'>
								<input
									type='number'
									className='w-full border rounded px-1'
									value={sub.payments?.[currentMonthKey] || 0}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handlePaymentChange(sub.id, e.target.value);
										}
									}}
									onChange={(e) =>
										setSubscribers((prev) => {
											const copy = [...prev];
											copy[i].payments[currentMonthKey] =
												Number(e.target.value) || 0;
											return copy;
										})
									}
								/>
							</td>

							<td className='p-2'>
								<a
									href={sub.whatsappLink}
									target='_blank'
									rel='noopener noreferrer'
									className='text-blue-500 underline'>
									Send
								</a>
							</td>
							<td className='p-2 flex gap-1'>
								<button
									onClick={() =>
										handleEdit(
											sub.id,
											{
												name: sub.name,
												phone: sub.phone,
												startDate: sub.startDate,
												discounts: sub.discounts || {},
												payments: sub.payments || {},
											},
											sub.discounts?.[currentMonthKey] || 0
										)
									}
									className='bg-yellow-400 text-white px-2 py-1 rounded'>
									Save
								</button>
								<button
									onClick={() => handleDelete(sub.id)}
									className='bg-red-500 text-white px-2 py-1 rounded'>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
