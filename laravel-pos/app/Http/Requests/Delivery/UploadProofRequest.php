<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;

class UploadProofRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'proof_photo' => [
                'required',
                'image',
                'mimes:jpeg,png,jpg',
                'max:5120', // 5MB
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'proof_photo.required' => 'Foto bukti pengiriman wajib diupload.',
            'proof_photo.image'    => 'File harus berupa gambar.',
            'proof_photo.max'      => 'Ukuran foto maksimal 5MB.',
        ];
    }
}
