<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Delivery;
use App\Models\Menu;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly StatusTransitionService $transitionService
    ) {}

    // =========================================================
    // CREATE ORDER
    // =========================================================

    public function createOrder(array $data, User $actor): Order
    {
        return DB::transaction(function () use ($data, $actor) {

            // 1. Validasi semua menu tersedia
            $menuIds   = array_column($data['items'], 'menu_id');
            $menus     = Menu::whereIn('id', $menuIds)->get()->keyBy('id');

            foreach ($data['items'] as $item) {
                $menu = $menus->get($item['menu_id']);
                if (!$menu) {
                    throw ValidationException::withMessages([
                        'items' => ["Menu ID {$item['menu_id']} tidak ditemukan."],
                    ]);
                }
                if (!$menu->is_available) {
                    throw ValidationException::withMessages([
                        'items' => ["Menu \"{$menu->name}\" sedang tidak tersedia."],
                    ]);
                }
            }

            // 2. Hitung total
            $subtotal    = 0;
            $itemsData   = [];

            foreach ($data['items'] as $item) {
                $menu       = $menus->get($item['menu_id']);
                $itemPrice  = $menu->price;
                $itemSubtotal = $itemPrice * $item['qty'];
                $subtotal  += $itemSubtotal;

                $itemsData[] = [
                    'menu_id' => $item['menu_id'],
                    'qty'     => $item['qty'],
                    'price'   => $itemPrice,
                    'note'    => $item['note'] ?? null,
                ];
            }

            $deliveryFee  = ($data['order_type'] === OrderType::DELIVERY->value) ? 10000 : 0;
            $totalPrice   = $subtotal + $deliveryFee;

            // 3. Tentukan cashier_id
            $cashierId = match (true) {
                $actor->isKasir()  => $actor->id,
                $actor->isManager()=> $actor->id,
                default            => null, // pelanggan order sendiri
            };

            // 4. Buat order
            $order = Order::create([
                'customer_id'      => $data['customer_id'] ?? null,
                'cashier_id'       => $cashierId,
                'order_type'       => $data['order_type'],
                'status'           => OrderStatus::PENDING->value,
                'subtotal'         => $subtotal,
                'discount'         => 0,
                'total_price'      => $totalPrice,
                'delivery_fee'     => $deliveryFee,
                'delivery_address' => $data['delivery_address'] ?? null,
                'customer_name'    => $data['customer_name'] ?? null,
                'customer_phone'   => $data['customer_phone'] ?? null,
                'notes'            => $data['notes'] ?? null,
                'source'           => $data['source'] ?? ($actor->isPelanggan() ? 'app' : 'kasir'),
            ]);

            // 5. Buat order items
            $order->items()->createMany($itemsData);

            // 6. Buat delivery record jika tipe delivery
            if ($data['order_type'] === OrderType::DELIVERY->value) {
                Delivery::create([
                    'order_id'        => $order->id,
                    'address'         => $data['delivery_address'],
                    'recipient_name'  => $data['customer_name']
                        ?? $order->customer?->user?->name,
                    'recipient_phone' => $data['customer_phone']
                        ?? $order->customer?->user?->phone,
                    'delivery_status' => 'waiting',
                ]);
            }

            return $order->load([
                'items.menu',
                'customer.user',
                'delivery',
            ]);
        });
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    public function updateStatus(
        Order  $order,
        string $newStatus,
        User   $actor,
        string $reason = null
    ): Order {
        return $this->transitionService->transitionOrderStatus(
            $order,
            $newStatus,
            $actor,
            $reason
        );
    }

    // =========================================================
    // ASSIGN COURIER
    // =========================================================

    public function assignCourier(Order $order, int $courierId): Order
    {
        $delivery = $order->delivery;

        if (!$delivery) {
            throw ValidationException::withMessages([
                'order' => ['Order ini tidak memiliki data delivery.'],
            ]);
        }

        $delivery->update([
            'courier_id'      => $courierId,
            'delivery_status' => 'assigned',
        ]);

        return $order->fresh(['delivery.courier', 'items', 'customer']);
    }

    // =========================================================
    // GET ORDERS (filter by role)
    // =========================================================

    public function getOrdersForUser(User $user, array $filters = [])
    {
        $query = Order::query()->withFullDetails();

        // Filter berdasarkan role
        match (true) {
            $user->isKurir()     => $query->whereHas(
                'delivery',
                fn($q) => $q->where('courier_id', $user->id)
            ),
            $user->isPelanggan() => $query->where(
                'customer_id',
                $user->customer?->id
            ),
            default => null, // kasir & manager lihat semua
        };

        // Filters
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['order_type'])) {
            $query->where('order_type', $filters['order_type']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('created_at', $filters['date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'LIKE', "%{$search}%")
                  ->orWhere('customer_name', 'LIKE', "%{$search}%")
                  ->orWhereHas('customer.user', fn($q2) =>
                      $q2->where('name', 'LIKE', "%{$search}%")
                  );
            });
        }

        return $query->orderByDesc('created_at')
                     ->paginate($filters['per_page'] ?? 15);
    }
}
