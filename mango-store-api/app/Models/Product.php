<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = [
        'name', 
        'description', 
        'price', 
        'vendor_id',
        'stock',
        'is_available',
        'mango_type'
    ];

    // Define relationships
    public function vendor() {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    // If you have product images associated
    public function images() {
        return $this->hasMany(ProductImage::class);
    }
    
    public function promotion() {
        return $this->hasOne(Promotion::class);
    }

    // Define vendorDetail relationship
    public function vendorDetail() {
        return $this->belongsTo(VendorDetail::class, 'vendor_id', 'user_id');
    }
}