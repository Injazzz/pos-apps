<?php

namespace App\Http\Requests\Order;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                'in:' . implode(',', OrderStatus::values()),
            ],
            'reason' => [
                'required_if:status,cancelled',
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required'         => 'Status baru wajib diisi.',
            'status.in'               => 'Status tidak valid.',
            'reason.required_if'      => 'Alasan pembatalan wajib diisi.',
        ];
    }
}
