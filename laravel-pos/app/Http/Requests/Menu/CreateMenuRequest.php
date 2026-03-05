<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class CreateMenuRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:100', 'unique:menus,name'],
            'price'        => ['required', 'numeric', 'min:0'],
            'category'     => ['required', 'string', 'max:50'],
            'description'  => ['nullable', 'string', 'max:500'],
            'image'        => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'is_available' => ['nullable', 'boolean'],
            'stock'        => ['nullable', 'integer', 'min:0'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
        ];
    }
}
