<?php

namespace App\Http\Requests\Payment;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;

class CreatePaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $method = $this->input('method');

        return [
            'method'        => [
                'required',
                'in:' . implode(',', PaymentMethod::values()),
            ],
            'amount'        => ['required', 'numeric', 'min:0'],

            // Cash: wajib ada cash_received
            'cash_received' => [
                'required_if:method,cash',
                'nullable',
                'numeric',
                'min:0',
            ],

            // Down Payment
            'dp_amount'     => [
                'required_if:method,down_payment',
                'nullable',
                'numeric',
                'min:1000',
            ],

            // Transfer Bank
            'bank_name'     => [
                'required_if:method,transfer_bank',
                'nullable',
                'string',
                'max:50',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'method.required'           => 'Metode pembayaran wajib dipilih.',
            'method.in'                 => 'Metode pembayaran tidak valid.',
            'amount.required'           => 'Jumlah pembayaran wajib diisi.',
            'cash_received.required_if' => 'Jumlah uang diterima wajib diisi untuk pembayaran tunai.',
            'dp_amount.required_if'     => 'Jumlah DP wajib diisi.',
            'bank_name.required_if'     => 'Nama bank wajib diisi untuk transfer bank.',
        ];
    }
}
