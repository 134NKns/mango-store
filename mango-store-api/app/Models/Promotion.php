<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory;
    
    protected $table = 'promotions';

    protected $fillable = [
        'product_id', 
        'discount_type', 
        'discount_value', 
        'start_date', 
        'end_date'
    ];

    public function product() {
        return $this->belongsTo(Product::class);
    }
}
