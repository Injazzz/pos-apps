<?php

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)->letters()->numbers()],
            'role'     => ['required', 'in:' . implode(',', UserRole::values())],
            'phone'    => ['nullable', 'string', 'max:20'],
            'status'   => ['nullable', 'in:active,inactive'],
        ];
    }
}
