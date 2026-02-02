'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Group {
  id: number;
  name: string;
  description?: string;
  type: string;
  created_by: number;
  created_at: Date;
  participants?: any[];
}

interface User {
  id: number;
  username: string;
  full_name?: string;
  role: string;
}

export default function GroupManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    
    // Check if user is admin or management
    if (userData.role !== 'admin' && userData.role !== 'management') {
      router.push('/chat');
      return;
    }

    setUser(userData);
    loadGroups(token);
    loadUsers(token);
  }, [router]);

  const loadGroups = async (token: string) => {
    try {
      const response = await fetch('/api/chat/groups', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDescription('');
        loadGroups(token);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/chat/groups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: selectedGroup.id,
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedGroup(null);
        setNewGroupName('');
        setNewGroupDescription('');
        loadGroups(token);
      }
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/chat/groups?group_id=${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadGroups(token);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedGroup) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/chat/groups/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: selectedGroup.id,
          user_id: userId,
        }),
      });

      if (response.ok) {
        loadGroups(token);
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(
        `/api/chat/groups/members?group_id=${selectedGroup.id}&user_id=${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        loadGroups(token);
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setShowEditModal(true);
  };

  const openMembersModal = (group: Group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Group Management</h1>
          <div className="space-x-2">
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Chat
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Group
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {group.name}
                  </h2>
                  {group.description && (
                    <p className="text-gray-600 mt-1">{group.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {group.participants?.length || 0} members
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openMembersModal(group)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Members
                  </button>
                  <button
                    onClick={() => openEditModal(group)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create New Group
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter group description"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateGroup}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewGroupName('');
                      setNewGroupDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {showEditModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Group</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateGroup}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedGroup(null);
                      setNewGroupName('');
                      setNewGroupDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {showMembersModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Manage Members - {selectedGroup.name}
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Current Members ({selectedGroup.participants?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedGroup.participants?.map((participant: any) => (
                      <div
                        key={participant.user_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.full_name || participant.username}
                          </p>
                          <p className="text-sm text-gray-600">
                            @{participant.username} • {participant.role}
                          </p>
                        </div>
                        {participant.user_id !== selectedGroup.created_by && (
                          <button
                            onClick={() => handleRemoveMember(participant.user_id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Add Members</h3>
                  <div className="space-y-2">
                    {users
                      .filter(
                        (u) =>
                          !selectedGroup.participants?.some(
                            (p: any) => p.user_id === u.id
                          )
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.full_name || user.username}
                            </p>
                            <p className="text-sm text-gray-600">
                              @{user.username} • {user.role}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddMember(user.id)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setSelectedGroup(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
