<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\MenuResource;
use App\Models\CartItem;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $items = CartItem::where('user_id', $request->user()->id)
            ->with('menu')
            ->get();

        $total = $items->sum(fn($item) => $item->menu?->price * $item->qty);

        return $this->successResponse([
            'items' => $items->map(fn($item) => [
                'id'       => $item->id,
                'menu_id'  => $item->menu_id,
                'menu'     => new MenuResource($item->menu),
                'qty'      => $item->qty,
                'note'     => $item->note,
                'subtotal' => $item->subtotal,
            ]),
            'total'       => $total,
            'total_items' => $items->sum('qty'),
        ], 'Keranjang berhasil diambil.');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'menu_id' => ['required', 'integer', 'exists:menus,id'],
            'qty'     => ['required', 'integer', 'min:1', 'max:99'],
            'note'    => ['nullable', 'string', 'max:200'],
        ]);

        $menu = Menu::findOrFail($request->menu_id);

        if (!$menu->is_available) {
            return $this->errorResponse("Menu \"{$menu->name}\" sedang tidak tersedia.", 422);
        }

        $item = CartItem::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'menu_id' => $request->menu_id,
            ],
            [
                'qty'  => DB::raw("qty + {$request->qty}"),
                'note' => $request->note,
            ]
        );

        return $this->createdResponse(
            $item->load('menu'),
            'Item berhasil ditambahkan ke keranjang.'
        );
    }

    public function update(Request $request, CartItem $item): JsonResponse
    {
        if ($item->user_id !== $request->user()->id) {
            return $this->forbiddenResponse();
        }

        $request->validate([
            'qty'  => ['required', 'integer', 'min:1', 'max:99'],
            'note' => ['nullable', 'string', 'max:200'],
        ]);

        $item->update($request->only('qty', 'note'));

        return $this->successResponse(
            $item->load('menu'),
            'Keranjang berhasil diperbarui.'
        );
    }

    public function destroy(Request $request, CartItem $item): JsonResponse
    {
        if ($item->user_id !== $request->user()->id) {
            return $this->forbiddenResponse();
        }

        $item->delete();

        return $this->noContentResponse('Item berhasil dihapus dari keranjang.');
    }
}
