/** @format */

import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SubscriberList from './pages/SubscriberList';
import Expenses from './pages/Expenses';

export default function App() {
	return (
		<Router basename='/Subscriber-Management'>
			<div className='min-h-screen bg-gray-100 p-4'>
			<nav className="mb-4 flex gap-2">
  <NavLink
    to="/"
    end
    className={({ isActive }) =>
      `px-4 py-2 rounded text-sm font-medium ${
        isActive ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
      }`
    }
  >
    Dashboard
  </NavLink>
  <NavLink
    to="/subscribers"
    className={({ isActive }) =>
      `px-4 py-2 rounded text-sm font-medium ${
        isActive ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
      }`
    }
  >
    Subscribers
  </NavLink>
  <NavLink
    to="/expenses"
    className={({ isActive }) =>
      `px-4 py-2 rounded text-sm font-medium ${
        isActive ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
      }`
    }
  >
    Expenses
  </NavLink>
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
