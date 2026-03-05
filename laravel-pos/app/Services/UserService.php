<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function createUser(array $data): User
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'phone'    => $data['phone'] ?? null,
            'status'   => $data['status'] ?? 'active',
        ]);

        return $user->load('customer');
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return $user->fresh('customer');
    }

    public function toggleStatus(User $user): User
    {
        $user->update([
            'status' => $user->status === 'active' ? 'inactive' : 'active',
        ]);

        // Jika dinonaktifkan, revoke semua token
        if ($user->status === 'inactive') {
            $user->tokens()->delete();
        }

        return $user->fresh();
    }

    public function getUsers(array $filters = [])
    {
        $query = User::query()->with('customer');

        if (!empty($filters['role'])) {
            $query->byRole($filters['role']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        return $query->orderByDesc('created_at')
                     ->paginate($filters['per_page'] ?? 15);
    }
}
