<?php

namespace App\Http\Requests\Order;

use App\Enums\OrderType;
use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'order_type'       => ['required', 'in:' . implode(',', OrderType::values())],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.menu_id'  => ['required', 'integer', 'exists:menus,id'],
            'items.*.qty'      => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.note'     => ['nullable', 'string', 'max:200'],
            'customer_id'      => ['nullable', 'integer', 'exists:customers,id'],
            'customer_name'    => ['nullable', 'string', 'max:100'],
            'customer_phone'   => ['nullable', 'string', 'max:20'],
            'delivery_address' => [
                'required_if:order_type,delivery',
                'nullable', 'string', 'max:500',
            ],
            'notes'            => ['nullable', 'string', 'max:500'],
            'source'           => ['nullable', 'in:app,kasir,whatsapp'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'           => 'Minimal 1 item harus dipilih.',
            'items.*.menu_id.exists'   => 'Menu tidak ditemukan.',
            'items.*.qty.min'          => 'Jumlah minimal 1.',
            'delivery_address.required_if' => 'Alamat pengiriman wajib diisi untuk order delivery.',
        ];
    }
}
