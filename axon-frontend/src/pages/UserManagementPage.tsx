import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api';
import type { User, UserRole } from '../types';

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  AX_SUPPORTER: 'bg-purple-100 text-purple-700',
  AX_CREATOR: 'bg-blue-100 text-blue-700',
  USER: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  AX_SUPPORTER: 'AX Supporter',
  AX_CREATOR: 'AX Creator',
  USER: 'User',
};

const ASSIGNABLE_ROLES: UserRole[] = ['USER', 'AX_SUPPORTER', 'ADMIN'];

export default function UserManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(0);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('USER');

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () =>
      userApi
        .list({ search: search || undefined, role: roleFilter || undefined, page, size: 15 })
        .then((r) => r.data),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      userApi.updateRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
  });

  const openEdit = (u: User) => {
    setEditUser(u);
    setNewRole(u.role);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage user roles and permissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin text-2xl mb-2">⟳</div>
          </div>
        ) : data?.content.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p>No users found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.content.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'AX_CREATOR' && (
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Change Role
                        </button>
                      )}
                      {u.role === 'AX_CREATOR' && (
                        <span className="text-xs text-gray-400 italic">Auto-assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">{data.totalElements} users</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-500">
                    {page + 1} / {data.totalPages}
                  </span>
                  <button
                    disabled={page >= data.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit role modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-900">Change Role</h2>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                {editUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{editUser.name}</p>
                <p className="text-xs text-gray-400">{editUser.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
              <div className="space-y-2">
                {ASSIGNABLE_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={newRole === r}
                      onChange={() => setNewRole(r)}
                      className="accent-blue-600"
                    />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[r]}`}>
                      {ROLE_LABELS[r]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={newRole === editUser.role || updateRoleMutation.isPending}
                onClick={() => updateRoleMutation.mutate({ userId: editUser.id, role: newRole })}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {updateRoleMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
