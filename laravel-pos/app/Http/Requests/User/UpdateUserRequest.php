<?php

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'name'   => ['sometimes', 'string', 'max:100'],
            'email'  => [
                'sometimes', 'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['nullable', Password::min(8)->letters()->numbers()],
            'role'   => ['sometimes', 'in:' . implode(',', UserRole::values())],
            'phone'  => ['nullable', 'string', 'max:20'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
