<?php

namespace App\Http\Requests\Delivery;

use App\Enums\DeliveryStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'delivery_status' => [
                'required',
                'in:' . implode(',', DeliveryStatus::values()),
            ],
        ];
    }
}
