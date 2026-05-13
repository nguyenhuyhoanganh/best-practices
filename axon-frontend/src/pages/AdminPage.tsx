import { useNavigate } from 'react-router-dom';

const ADMIN_SECTIONS = [
  {
    to: '/admin/master-data',
    icon: '🗂️',
    title: 'Master Data',
    description: 'Manage Jobs, Work Categories, Works, and AI Capabilities',
    color: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-50',
  },
  {
    to: '/admin/users',
    icon: '👥',
    title: 'User Management',
    description: 'View users, manage roles, and control access permissions',
    color: 'border-purple-200 hover:border-purple-400',
    iconBg: 'bg-purple-50',
  },
];

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform administration and configuration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {ADMIN_SECTIONS.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className={`text-left bg-white rounded-xl border-2 p-6 transition-colors ${s.color} group`}
          >
            <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center text-2xl mb-4`}>
              {s.icon}
            </div>
            <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {s.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
