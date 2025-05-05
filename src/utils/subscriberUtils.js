/** @format */

// File: utils/subscriberUtils.js
export function getMonthsDiff(startDate) {
	const start = new Date(startDate);
	const now = new Date();
	const months =
		(now.getFullYear() - start.getFullYear()) * 12 +
		now.getMonth() -
		start.getMonth();
	return Math.max(0, Math.min(months, 24));
}

export function getNextDueDate(startDate, paidMonths) {
	const date = new Date(startDate);
	date.setMonth(date.getMonth() + paidMonths);
	return date;
}

export function formatDate(date) {
	return date
		.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: '2-digit',
		})
		.replace(/ /g, '-');
}
