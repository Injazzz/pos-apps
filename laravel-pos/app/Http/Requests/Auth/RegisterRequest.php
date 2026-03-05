<?php

namespace App\Http\Requests\Auth;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Siapa yang boleh register:
        // - Publik bisa register sebagai pelanggan
        // - Manager bisa register semua role
        $requestedRole = $this->input('role', UserRole::PELANGGAN->value);

        if ($requestedRole !== UserRole::PELANGGAN->value) {
            // Hanya manager yang bisa buat user dengan role lain
            return $this->user()?->isManager() ?? false;
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->numbers(),
            ],
            'phone'    => ['nullable', 'string', 'max:20'],
            'role'     => [
                'nullable',
                'string',
                'in:' . implode(',', UserRole::values()),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Nama wajib diisi.',
            'email.required'    => 'Email wajib diisi.',
            'email.email'       => 'Format email tidak valid.',
            'email.unique'      => 'Email sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.confirmed'=> 'Konfirmasi password tidak cocok.',
            'role.in'           => 'Role tidak valid.',
        ];
    }
}
