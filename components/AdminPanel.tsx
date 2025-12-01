
import React, { useState } from 'react';
import { User } from '../types';
import { Shield, UserPlus, Trash2, Key, Mail, User as UserIcon } from 'lucide-react';

interface AdminPanelProps {
    users: User[];
    onAddUser: (user: User) => void;
    onDeleteUser: (email: string) => void;
    currentUserEmail: string;
    onToggleSidebar: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser, currentUserEmail, onToggleSidebar }) => {
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName && newEmail && newPassword) {
            onAddUser({
                name: newName,
                email: newEmail,
                password: newPassword,
                isAdmin: false // Only the main admin exists for now, new users are standard
            });
            setNewName('');
            setNewEmail('');
            setNewPassword('');
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-paper-50 dark:bg-stone-950 p-4 md:p-8 transition-colors">
             <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-paper-200 dark:border-stone-800 pb-6">
                    <div className="p-3 bg-[#3333cc] text-white rounded-lg shadow-lg">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-stone-100">Admin Console</h1>
                        <p className="text-stone-500 font-serif italic">Manage access to the study.</p>
                    </div>
                </div>

                {/* Add User Form */}
                <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold font-serif text-ink-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-stone-400" />
                        Add New Writer
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Name</label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input 
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-stone-400"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input 
                                    required
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-stone-400"
                                    placeholder="writer@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Password</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input 
                                    required
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-stone-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button 
                                type="submit"
                                className="bg-[#3333cc] text-white px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity"
                            >
                                Grant Access
                            </button>
                        </div>
                    </form>
                </div>

                {/* User List */}
                <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-paper-200 dark:border-stone-800">
                        <h2 className="text-lg font-bold font-serif text-ink-900 dark:text-stone-100">Authorized Writers</h2>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-paper-50 dark:bg-stone-800 text-xs font-bold uppercase text-stone-500">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-paper-100 dark:divide-stone-800">
                            {users.map(user => (
                                <tr key={user.email}>
                                    <td className="px-6 py-4 font-bold text-ink-900 dark:text-stone-200 font-serif">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {user.isAdmin ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3333cc]/10 text-[#3333cc]">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300">
                                                Writer
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!user.isAdmin && user.email !== currentUserEmail && (
                                            <button 
                                                onClick={() => onDeleteUser(user.email)}
                                                className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Revoke Access"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
};
