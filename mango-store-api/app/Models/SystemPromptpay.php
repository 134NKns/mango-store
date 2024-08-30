<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemPromptpay extends Model
{
    use HasFactory;

    protected $table = 'system_promptpay';

    protected $fillable = [
        'bank_name',
        'promptpay_number',
        'additional_qr_info',
    ];
}
