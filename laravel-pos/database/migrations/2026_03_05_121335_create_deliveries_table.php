<?php

use App\Enums\DeliveryStatus;
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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                  ->unique()
                  ->constrained('orders')
                  ->cascadeOnDelete();

            // Kurir yang ditugaskan (null = belum assign)
            $table->foreignId('courier_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->text('address');
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone', 20)->nullable();

            $table->enum(
                'delivery_status',
                array_column(DeliveryStatus::cases(), 'value')
            )->default(DeliveryStatus::WAITING->value);

            // Bukti pengiriman foto + timestamp watermark
            $table->string('proof_photo')->nullable();
            $table->timestamp('proof_taken_at')->nullable();

            // Koordinat (opsional GPS tracking)
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            $table->text('delivery_notes')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('courier_id');
            $table->index('delivery_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
