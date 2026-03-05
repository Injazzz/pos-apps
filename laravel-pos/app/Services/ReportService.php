<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class ReportService
{
    // =========================================================
    // DAILY REPORT
    // =========================================================

    public function getDailyReport(string $date): array
    {
        $orders = Order::whereDate('created_at', $date)
            ->with(['items.menu', 'payment'])
            ->get();

        $completedOrders = $orders->whereIn(
            'status',
            [OrderStatus::COMPLETED->value, OrderStatus::DELIVERED->value]
        );

        return [
            'date'              => $date,
            'total_orders'      => $orders->count(),
            'completed_orders'  => $completedOrders->count(),
            'cancelled_orders'  => $orders->where('status', OrderStatus::CANCELLED->value)->count(),
            'total_revenue'     => $completedOrders->sum('total_price'),
            'by_order_type'     => $this->groupByOrderType($orders),
            'by_payment_method' => $this->groupByPaymentMethod($completedOrders),
            'top_menus'         => $this->getTopMenus($date, $date),
            'hourly_orders'     => $this->getHourlyOrders($date),
        ];
    }

    // =========================================================
    // MONTHLY REPORT
    // =========================================================

    public function getMonthlyReport(int $month, int $year): array
    {
        $startDate = "{$year}-{$month}-01";
        $endDate   = date('Y-m-t', strtotime($startDate));

        $orders = Order::whereBetween(
            DB::raw('DATE(created_at)'),
            [$startDate, $endDate]
        )->with('payment')->get();

        $completedOrders = $orders->whereIn('status', [
            OrderStatus::COMPLETED->value,
            OrderStatus::DELIVERED->value,
        ]);

        return [
            'month'             => $month,
            'year'              => $year,
            'total_orders'      => $orders->count(),
            'completed_orders'  => $completedOrders->count(),
            'cancelled_orders'  => $orders->where('status', OrderStatus::CANCELLED->value)->count(),
            'total_revenue'     => $completedOrders->sum('total_price'),
            'avg_order_value'   => $completedOrders->avg('total_price') ?? 0,
            'by_order_type'     => $this->groupByOrderType($orders),
            'by_payment_method' => $this->groupByPaymentMethod($completedOrders),
            'top_menus'         => $this->getTopMenus($startDate, $endDate),
            'daily_breakdown'   => $this->getDailyBreakdown($startDate, $endDate),
        ];
    }

    // =========================================================
    // SUMMARY (dashboard cards)
    // =========================================================

    public function getSummary(): array
    {
        $today     = today()->toDateString();
        $thisMonth = now()->month;
        $thisYear  = now()->year;

        return [
            'today' => [
                'total_orders'   => Order::today()->count(),
                'total_revenue'  => Order::today()
                    ->whereIn('status', [OrderStatus::COMPLETED->value, OrderStatus::DELIVERED->value])
                    ->sum('total_price'),
                'pending_orders' => Order::today()->pending()->count(),
                'active_orders'  => Order::today()->active()->count(),
            ],
            'this_month' => [
                'total_orders'  => Order::thisMonth()->count(),
                'total_revenue' => Order::thisMonth()
                    ->whereIn('status', [OrderStatus::COMPLETED->value, OrderStatus::DELIVERED->value])
                    ->sum('total_price'),
            ],
            'overall' => [
                'total_customers' => \App\Models\User::pelanggan()->count(),
                'total_menus'     => \App\Models\Menu::available()->count(),
                'total_orders'    => Order::count(),
            ],
        ];
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private function groupByOrderType($orders): array
    {
        return $orders->groupBy('order_type')
            ->map(fn($group) => [
                'count'   => $group->count(),
                'revenue' => $group->sum('total_price'),
            ])->toArray();
    }

    private function groupByPaymentMethod($orders): array
    {
        return $orders->filter(fn($o) => $o->payment)
            ->groupBy(fn($o) => $o->payment->method->value ?? $o->payment->method)
            ->map(fn($group) => [
                'count'   => $group->count(),
                'revenue' => $group->sum('total_price'),
            ])->toArray();
    }

    private function getTopMenus(string $from, string $to, int $limit = 10): array
    {
        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menus', 'order_items.menu_id', '=', 'menus.id')
            ->whereBetween(DB::raw('DATE(orders.created_at)'), [$from, $to])
            ->whereIn('orders.status', [
                OrderStatus::COMPLETED->value,
                OrderStatus::DELIVERED->value,
            ])
            ->select(
                'menus.id',
                'menus.name',
                'menus.category',
                DB::raw('SUM(order_items.qty) as total_qty'),
                DB::raw('SUM(order_items.qty * order_items.price) as total_revenue')
            )
            ->groupBy('menus.id', 'menus.name', 'menus.category')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    private function getHourlyOrders(string $date): array
    {
        return DB::table('orders')
            ->whereDate('created_at', $date)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_price) as revenue')
            )
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour')
            ->get()
            ->toArray();
    }

    private function getDailyBreakdown(string $from, string $to): array
    {
        return DB::table('orders')
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(CASE WHEN status IN ("completed","delivered") THEN total_price ELSE 0 END) as revenue')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->toArray();
    }
}
