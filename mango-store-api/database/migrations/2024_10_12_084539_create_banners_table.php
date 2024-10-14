<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // ใช้ string สำหรับชื่อ banner
            $table->longText('url'); // ใช้ longText สำหรับเก็บ Base64 ของรูปภาพ
            $table->integer('banner_order')->nullable(); // กำหนด nullable ให้กับ banner_order
            $table->timestamps(); // สร้าง created_at และ updated_at
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
