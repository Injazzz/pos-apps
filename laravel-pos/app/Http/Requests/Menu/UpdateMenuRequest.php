<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $menuId = $this->route('menu')?->id ?? $this->route('menu');

        return [
            'name'         => [
                'sometimes', 'string', 'max:100',
                Rule::unique('menus', 'name')->ignore($menuId),
            ],
            'price'        => ['sometimes', 'numeric', 'min:0'],
            'category'     => ['sometimes', 'string', 'max:50'],
            'description'  => ['nullable', 'string', 'max:500'],
            'existing_images' => ['nullable', 'json'],
            'new_images'   => ['nullable', 'array'],
            'new_images.*' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'is_available' => ['nullable', 'boolean'],
            'stock'        => ['nullable', 'integer', 'min:0'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
        ];
    }
}
