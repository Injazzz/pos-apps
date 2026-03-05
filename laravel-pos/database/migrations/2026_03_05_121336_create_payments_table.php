<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                  ->constrained('orders')
                  ->cascadeOnDelete();

            $table->enum(
                'method',
                array_column(PaymentMethod::cases(), 'value')
            );

            $table->enum(
                'status',
                array_column(PaymentStatus::cases(), 'value')
            )->default(PaymentStatus::PENDING->value);

            // Total yang harus dibayar
            $table->decimal('amount', 12, 2);

            // Untuk DP (Down Payment)
            $table->decimal('dp_amount', 12, 2)->nullable()
                  ->comment('Jumlah uang muka');
            $table->decimal('remaining_amount', 12, 2)->nullable()
                  ->comment('Sisa yang belum dibayar');
            $table->decimal('paid_amount', 12, 2)->default(0)
                  ->comment('Total yang sudah dibayar');

            // Cash: kembalian
            $table->decimal('cash_received', 12, 2)->nullable();
            $table->decimal('change_amount', 12, 2)->nullable();

            // Midtrans fields
            $table->string('midtrans_order_id')->nullable()->unique();
            $table->string('midtrans_token')->nullable();
            $table->string('midtrans_url')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->string('midtrans_payment_type')->nullable();
            $table->json('midtrans_response')->nullable();

            // Transfer bank fields
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('transfer_proof')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();

            // Kasir yang proses payment
            $table->foreignId('processed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();

            // Indexes
            $table->index('order_id');
            $table->index('status');
            $table->index('method');
            $table->index('midtrans_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
