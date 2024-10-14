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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->foreignId('vendor_id')->nullable()->constrained('users');
            $table->integer('stock')->default(0); // Quantity of products in stock
            $table->boolean('is_available')->default(true); // Flag to indicate if the product is available for sale
            $table->enum('mango_type', ['มะม่วงสุก', 'มะม่วงดิบ', 'มะม่วงแปรรูป', ''])->nullable();
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
