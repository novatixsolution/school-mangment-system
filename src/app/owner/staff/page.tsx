'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, MoreVertical, Shield, Key, Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Profile, UserRole, DEFAULT_CLERK_PERMISSIONS, DEFAULT_TEACHER_PERMISSIONS, PERMISSION_CATEGORIES, Permissions } from '@/types/permissions'
import { Checkbox } from '@/components/ui/checkbox'

export default function StaffManagement() {
    const [staff, setStaff] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CLERK' as UserRole,
        status: 'active' as 'active' | 'inactive',
    })
    const [permissions, setPermissions] = useState<Permissions>({})

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        console.log('Fetching staff...')
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('role', 'OWNER')
                .order('created_at', { ascending: false })

            console.log('Staff fetch result:', { data, error })

            if (error) {
                console.error('Staff fetch error:', error)
                throw error
            }
            setStaff(data || [])
        } catch (error) {
            console.error('Error fetching staff:', error)
            toast.error('Failed to load staff')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStaff = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            // Create auth user
            console.log('Creating auth user...')
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })

            console.log('Auth response:', { authData, authError })

            let userId = authData?.user?.id

            // Handle user already exists - try to get existing user ID
            if (authError) {
                // Check for rate limit error
                if (authError.message.includes('security purposes') || authError.message.includes('rate limit')) {
                    toast.error('Please wait 60 seconds', 'Supabase limits how fast you can create accounts. Please wait and try again.')
                    return
                }

                // If user already registered, we need to find their ID from auth.users
                // For now, show a message to use a different email
                if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                    // Try to see if there's a fake user (Supabase sometimes returns user data even on error for existing users)
                    if (authData?.user?.id) {
                        userId = authData.user.id
                        console.log('Using existing user ID:', userId)
                    } else {
                        toast.error('User already exists', 'This email is already registered. Please delete the user from Supabase Auth first, or use a different email.')
                        return
                    }
                } else {
                    throw authError
                }
            }

            if (!userId) {
                toast.error('Failed to create user', 'No user ID returned from Supabase')
                return
            }

            console.log('User ID:', userId)

            // Create profile using UPSERT (will create if not exists, update if exists)
            const defaultPermissions = formData.role === 'CLERK'
                ? DEFAULT_CLERK_PERMISSIONS
                : DEFAULT_TEACHER_PERMISSIONS

            const profileData = {
                id: userId,
                email: formData.email,
                name: formData.name,
                role: formData.role,
                status: formData.status,
                permissions: defaultPermissions,
            }

            console.log('Upserting profile:', JSON.stringify(profileData, null, 2))

            // Use upsert instead of insert
            const { data: insertedData, error: profileError } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select()

            console.log('Profile upsert response:', JSON.stringify({ insertedData, profileError }, null, 2))

            if (profileError) {
                console.error('Profile upsert error:', profileError)
                // Show detailed error
                alert(`Profile insert failed!\n\nError Code: ${profileError.code}\nMessage: ${profileError.message}\nDetails: ${profileError.details}\nHint: ${profileError.hint}`)
                toast.error('Failed to create profile', profileError.message)
                return
            }

            if (!insertedData || insertedData.length === 0) {
                console.error('No data returned from upsert!')
                alert('Profile upsert returned no data! Check Supabase RLS policies.')
                toast.error('Profile created but no data returned')
                return
            }

            toast.success('Staff member created successfully')
            setIsModalOpen(false)
            resetForm()
            fetchStaff()
        } catch (error: any) {
            console.error('Error creating staff:', error)
            alert(`Caught error: ${error.message}`)
            toast.error('Failed to create staff', error.message)
        }
    }

    const handleUpdateStaff = async () => {
        if (!selectedStaff) return

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    role: formData.role,
                    status: formData.status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedStaff.id)

            if (error) throw error

            toast.success('Staff member updated successfully')
            setIsModalOpen(false)
            resetForm()
            fetchStaff()
        } catch (error: any) {
            console.error('Error updating staff:', error)
            toast.error('Failed to update staff', error.message)
        }
    }

    const handleDeleteStaff = async (id: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id)

            if (error) throw error

            toast.success('Staff member deleted')
            fetchStaff()
        } catch (error: any) {
            console.error('Error deleting staff:', error)
            toast.error('Failed to delete staff', error.message)
        }
    }

    const handleUpdatePermissions = async () => {
        if (!selectedStaff) return

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    permissions,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedStaff.id)

            if (error) throw error

            toast.success('Permissions updated successfully')
            setIsPermissionModalOpen(false)
            fetchStaff()
        } catch (error: any) {
            console.error('Error updating permissions:', error)
            toast.error('Failed to update permissions', error.message)
        }
    }

    const openEditModal = (staffMember: Profile) => {
        setSelectedStaff(staffMember)
        setFormData({
            name: staffMember.name,
            email: staffMember.email,
            password: '',
            role: staffMember.role,
            status: staffMember.status,
        })
        setIsModalOpen(true)
    }

    const openPermissionModal = (staffMember: Profile) => {
        setSelectedStaff(staffMember)
        setPermissions(staffMember.permissions || {})
        setIsPermissionModalOpen(true)
    }

    const resetForm = () => {
        setSelectedStaff(null)
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'CLERK',
            status: 'active',
        })
    }

    const filteredStaff = staff.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
                        <p className="text-slate-500 mt-1">Manage teachers and clerks</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus className="h-5 w-5 mr-2" />
                        Add Staff
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12"
                    />
                </div>

                {/* Staff Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : filteredStaff.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-slate-500">No staff members found</p>
                        </div>
                    ) : (
                        filteredStaff.map((member) => (
                            <Card key={member.id} className="card-hover">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar name={member.name} size="lg" />
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{member.name}</h3>
                                                <p className="text-sm text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge variant={member.role === 'TEACHER' ? 'info' : 'default'}>
                                            {member.role}
                                        </Badge>
                                        <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                                            {member.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditModal(member)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openPermissionModal(member)}
                                        >
                                            <Shield className="h-4 w-4 mr-1" />
                                            Permissions
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteStaff(member.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={selectedStaff ? 'Edit Staff' : 'Add New Staff'}
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!!selectedStaff}
                    />
                    {!selectedStaff && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-11 px-4 pr-12 rounded-xl border-2 border-slate-200 bg-white text-slate-900 transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                    id="staff-password"
                                />
                                <div
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-all"
                                    onMouseEnter={() => {
                                        const input = document.getElementById('staff-password') as HTMLInputElement;
                                        if (input) input.type = 'text';
                                    }}
                                    onMouseLeave={() => {
                                        const input = document.getElementById('staff-password') as HTMLInputElement;
                                        if (input) input.type = 'password';
                                    }}
                                    onClick={() => {
                                        const input = document.getElementById('staff-password') as HTMLInputElement;
                                        if (input) {
                                            input.type = input.type === 'password' ? 'text' : 'password';
                                        }
                                    }}
                                    title="Hover or click to show password"
                                >
                                    <Eye className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                        <select
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            <option value="CLERK">Clerk</option>
                            <option value="TEACHER">Teacher</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                        <select
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={selectedStaff ? handleUpdateStaff : handleCreateStaff}>
                            {selectedStaff ? 'Update' : 'Create'} Staff
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Permissions Modal */}
            <Modal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                title={`Manage Permissions - ${selectedStaff?.name}`}
                size="lg"
            >
                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                        <div key={key} className="border-b border-slate-100 pb-4 last:border-0">
                            <h4 className="font-semibold text-slate-900 mb-3">{category.label}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {category.permissions.map((perm) => (
                                    <Checkbox
                                        key={perm.key}
                                        checked={permissions[perm.key] ?? false}
                                        onChange={(checked) => setPermissions({ ...permissions, [perm.key]: checked })}
                                        label={perm.label}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <Button variant="outline" onClick={() => setIsPermissionModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdatePermissions}>
                        Save Permissions
                    </Button>
                </div>
            </Modal>
        </DashboardLayout>
    )
}
