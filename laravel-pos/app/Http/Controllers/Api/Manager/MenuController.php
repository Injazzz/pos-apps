<?php

namespace App\Http\Controllers\Api\Manager;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Menu\CreateMenuRequest;
use App\Http\Requests\Menu\UpdateMenuRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Resources\MenuResource;
use App\Models\Menu;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly MenuService $menuService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $menus = $this->menuService->getMenus($request->only([
            'category', 'is_available', 'search', 'per_page',
        ]));

        return $this->successResponse(
            MenuResource::collection($menus)->response()->getData(true),
            'Daftar menu berhasil diambil.'
        );
    }

    public function store(CreateMenuRequest $request): JsonResponse
    {
        $this->authorize('create', Menu::class);

        $menu = $this->menuService->createMenu($request->validated());

        return $this->createdResponse(
            new MenuResource($menu),
            'Menu berhasil ditambahkan.'
        );
    }

    public function show(Menu $menu): JsonResponse
    {
        return $this->successResponse(
            new MenuResource($menu),
            'Detail menu berhasil diambil.'
        );
    }

    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        $this->authorize('update', $menu);

        $updated = $this->menuService->updateMenu($menu, $request->validated());

        return $this->successResponse(
            new MenuResource($updated),
            'Menu berhasil diperbarui.'
        );
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $this->authorize('delete', $menu);

        $this->menuService->deleteMenu($menu);

        return $this->noContentResponse('Menu berhasil dihapus.');
    }

    public function toggleAvailability(Menu $menu): JsonResponse
    {
        $this->authorize('toggleAvailability', $menu);

        $menu->update(['is_available' => !$menu->is_available]);
        $status = $menu->is_available ? 'tersedia' : 'tidak tersedia';

        return $this->successResponse(
            new MenuResource($menu->fresh()),
            "Menu ditandai sebagai {$status}."
        );
    }
}
