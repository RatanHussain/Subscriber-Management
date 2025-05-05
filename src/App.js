/** @format */

// File: App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SubscriberList from './pages/SubscriberList';
import Expenses from './pages/Expenses';

export default function App() {
	return (
		<Router>
			<div className='min-h-screen bg-gray-100 p-4'>
				<nav className='mb-4 flex gap-4 text-blue-600'>
					<Link to='/'>Dashboard</Link>
					<Link to='/subscribers'>Subscribers</Link>
					<Link to='/expenses'>Expenses</Link>
				</nav>

				<Routes>
					<Route path='/' element={<Dashboard />} />
					<Route path='/subscribers' element={<SubscriberList />} />
					<Route path='/expenses' element={<Expenses />} />
				</Routes>
			</div>
		</Router>
	);
}
