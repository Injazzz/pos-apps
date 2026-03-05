<?php

use App\Enums\UserRole;
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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', array_column(UserRole::cases(), 'value'))
                  ->default(UserRole::PELANGGAN->value);
            $table->string('phone', 20)->nullable();
            $table->enum('status', ['active', 'inactive'])
                  ->default('active');

            // Google OAuth
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar')->nullable();

            // Email verification
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('role');
            $table->index('status');
            $table->index(['role', 'status']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
