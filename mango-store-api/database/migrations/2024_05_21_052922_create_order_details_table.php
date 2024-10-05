<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orderdetails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->unsignedInteger('quantity');
            $table->decimal('price', 10, 2);
            $table->decimal('discount', 8, 2)->default(0);
            $table->text('shipping_address')->nullable();
            $table->timestamps(); // Add this line to include created_at and updated_at columns
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orderdetails');
    }
};
