<?php

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Kode unik pesanan: ORD-20250101-XXXX
            $table->string('order_code', 30)->unique();

            // Foreign keys - nullable karena kasir bisa order tanpa customer akun
            $table->foreignId('customer_id')
                  ->nullable()
                  ->constrained('customers')
                  ->nullOnDelete();

            $table->foreignId('cashier_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->enum('order_type', array_column(OrderType::cases(), 'value'))
                  ->default(OrderType::DINE_IN->value);

            $table->enum('status', array_column(OrderStatus::cases(), 'value'))
                  ->default(OrderStatus::PENDING->value);

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);

            // Untuk order delivery
            $table->text('delivery_address')->nullable();
            $table->decimal('delivery_fee', 10, 2)->default(0);

            // Nama & HP customer (untuk walk-in / WA order tanpa akun)
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 20)->nullable();

            $table->text('notes')->nullable();

            // Track sumber order
            $table->enum('source', ['app', 'kasir', 'whatsapp'])
                  ->default('app');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('order_type');
            $table->index('created_at');
            $table->index(['status', 'created_at']);
            $table->index('customer_id');
            $table->index('cashier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
