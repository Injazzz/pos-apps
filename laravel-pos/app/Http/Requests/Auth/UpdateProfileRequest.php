<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name'                 => ['sometimes', 'string', 'max:100'],
            'email'                => [
                'sometimes', 'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone'                => ['nullable', 'string', 'max:20'],
            'current_password'     => ['required_with:new_password', 'string'],
            'new_password'         => [
                'nullable',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
            // Customer profile
            'address'              => ['nullable', 'string', 'max:500'],
            'city'                 => ['nullable', 'string', 'max:100'],
            'province'             => ['nullable', 'string', 'max:100'],
            'postal_code'          => ['nullable', 'string', 'max:10'],
            'notes'                => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'                   => 'Email sudah dipakai akun lain.',
            'current_password.required_with' => 'Password lama wajib diisi untuk ganti password.',
            'new_password.confirmed'         => 'Konfirmasi password baru tidak cocok.',
        ];
    }
}
