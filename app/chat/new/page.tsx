'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  full_name?: string;
  role: string;
}

export default function NewMessagePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    loadUsers(token);
  }, [router]);

  const loadUsers = async (token: string) => {
    try {
      const response = await fetch('/api/chat/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser || creating) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setCreating(true);
    try {
      const response = await fetch('/api/chat/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          other_user_id: selectedUser,
        }),
      });

      if (response.ok) {
        // Redirect to chat page
        router.push('/chat');
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">New Message</h1>
            <button
              onClick={() => router.push('/chat')}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User to Message
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No users available
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.full_name || user.username}
                          </h3>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={handleCreateConversation}
              disabled={!selectedUser || creating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Start Conversation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
