<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PromotionTypeSeeder extends Seeder
{
    public function run()
    {
        $promotionTypes = [
            [
                'name' => 'ส่วนลดเปอร์เซ็นต์',
                'description' => 'ส่วนลดตามเปอร์เซ็นต์ของราคาสินค้า',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'ส่วนลดคงที่',
                'description' => 'ส่วนลดตามจำนวนเงินที่ลดจากราคาสินค้า',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'ซื้อหนึ่งแถมหนึ่ง',
                'description' => 'โปรโมชั่นซื้อหนึ่งแถมหนึ่งสำหรับสินค้าที่ซื้อ',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'จัดส่งฟรี',
                'description' => 'โปรโมชั่นจัดส่งฟรี',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        ];

        DB::table('promotion_types')->insert($promotionTypes);
    }
}
