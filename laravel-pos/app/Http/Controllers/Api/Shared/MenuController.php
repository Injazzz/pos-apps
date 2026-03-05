<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\MenuResource;
use App\Models\Menu;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends BaseApiController
{
    public function __construct(
        private readonly MenuService $menuService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $menus = $this->menuService->getMenus(
            array_merge(
                $request->only(['category', 'search', 'per_page']),
                ['is_available' => true]
            )
        );

        $categories = $this->menuService->getCategories();

        return $this->successResponse([
            'menus'      => MenuResource::collection($menus)->response()->getData(true),
            'categories' => $categories,
        ], 'Menu berhasil diambil.');
    }

    public function show(Menu $menu): JsonResponse
    {
        return $this->successResponse(
            new MenuResource($menu),
            'Detail menu berhasil diambil.'
        );
    }
}
