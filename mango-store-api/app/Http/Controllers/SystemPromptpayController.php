<?php

namespace App\Http\Controllers;

use App\Models\SystemPromptpay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SystemPromptpayController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        Log::info('SystemPromptpayController@index called');
        $promptpay = SystemPromptpay::all(); // หรือใช้ SystemPromptpay::first() ถ้ามีเพียงหนึ่งรายการ
        return response()->json($promptpay);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        Log::info('Incoming request data:', $request->all());
        
        // Validate the input, including the new 'account_name' field
        $request->validate([
            'account_name' => 'required|string|max:255',
            'bank_name' => 'required|string|max:255',
            'promptpay_number' => 'required|string|max:255',
            'additional_qr_info' => 'nullable|string',
        ]);
        
        Log::info('Validation passed');
    
        // Check if a record already exists
        $existingPromptpay = SystemPromptpay::first();
        if ($existingPromptpay) {
            return response()->json(['message' => 'PromptPay record already exists'], 400);
        }
    
        // Create a new SystemPromptpay record with all request data
        $promptpay = SystemPromptpay::create($request->all());
        
        return response()->json($promptpay, 201);
    }
    

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function show()
    {
        Log::info('SystemPromptpayController@show called');
        $promptpay = SystemPromptpay::first();
        if (!$promptpay) {
            Log::warning('PromptPay record not found');
            return response()->json(['message' => 'PromptPay not found'], 404);
        }
        return response()->json($promptpay);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request)
    {
        Log::info('SystemPromptpayController@update called', ['request' => $request->all()]);
    
        // Validate the input, including the 'account_name' field
        $request->validate([
            'account_name' => 'required|string|max:255',
            'bank_name' => 'required|string|max:255',
            'promptpay_number' => 'required|string|max:255',
            'additional_qr_info' => 'nullable|string',
        ]);
    
        // Fetch the first SystemPromptpay record
        $promptpay = SystemPromptpay::first();
        if (!$promptpay) {
            Log::warning('PromptPay record not found for update');
            return response()->json(['message' => 'PromptPay not found'], 404);
        }
    
        // Update the existing SystemPromptpay record
        $promptpay->update($request->all());
        
        Log::info('PromptPay record updated', ['promptpay' => $promptpay]);
        
        return response()->json($promptpay);
    }
    

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\Response
     */
    public function destroy()
    {
        Log::info('SystemPromptpayController@destroy called');
        $promptpay = SystemPromptpay::first();
        if (!$promptpay) {
            Log::warning('PromptPay record not found for deletion');
            return response()->json(['message' => 'PromptPay not found'], 404);
        }
        $promptpay->delete();
        Log::info('PromptPay record deleted');
        return response()->json(['message' => 'PromptPay deleted successfully']);
    }
}
