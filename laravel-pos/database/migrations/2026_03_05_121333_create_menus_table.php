<?php

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
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 12, 2)->unsigned();
            $table->string('category', 50);
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_available')->default(true);
            $table->unsignedInteger('stock')->nullable()
                  ->comment('null = unlimited');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('category');
            $table->index('is_available');
            $table->index(['category', 'is_available']);
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
