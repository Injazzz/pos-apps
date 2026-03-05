<?php

namespace App\Services;

use App\Models\Menu;
use Illuminate\Support\Facades\Storage;

class MenuService
{
    public function createMenu(array $data): Menu
    {
        $imagePath = null;

        // Handle multiple images - gunakan yang pertama sebagai primary
        if (isset($data['images']) && !empty($data['images'])) {
            $images = is_array($data['images']) ? $data['images'] : [$data['images']];
            if (!empty($images)) {
                $imagePath = $images[0]->store('menus', 'public');
            }
        }

        return Menu::create([
            'name'         => $data['name'],
            'price'        => $data['price'],
            'category'     => $data['category'],
            'description'  => $data['description'] ?? null,
            'image_path'   => $imagePath,
            'is_available' => $data['is_available'] ?? true,
            'stock'        => $data['stock'] ?? null,
            'sort_order'   => $data['sort_order'] ?? 0,
        ]);
    }

    public function updateMenu(Menu $menu, array $data): Menu
    {
        // Handle new images - gunakan yang pertama sebagai primary
        if (isset($data['new_images']) && !empty($data['new_images'])) {
            // Hapus gambar lama
            if ($menu->image_path) {
                Storage::disk('public')->delete($menu->image_path);
            }
            $newImages = is_array($data['new_images']) ? $data['new_images'] : [$data['new_images']];
            if (!empty($newImages)) {
                $data['image_path'] = $newImages[0]->store('menus', 'public');
            }
            unset($data['new_images']);
        }

        if (isset($data['existing_images'])) {
            unset($data['existing_images']);
        }

        $menu->update($data);

        return $menu->fresh();
    }

    public function deleteMenu(Menu $menu): void
    {
        if ($menu->image_path) {
            Storage::disk('public')->delete($menu->image_path);
        }
        $menu->delete();
    }

    public function getMenus(array $filters = [])
    {
        $query = Menu::query();

        if (!empty($filters['category'])) {
            $query->byCategory($filters['category']);
        }

        if (isset($filters['is_available'])) {
            $query->where('is_available', (bool) $filters['is_available']);
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->ordered()->paginate($filters['per_page'] ?? 20);
    }

    public function getCategories(): array
    {
        return Menu::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
    }
}
