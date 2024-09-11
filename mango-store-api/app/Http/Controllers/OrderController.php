<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Cart;
use App\Models\Promotion;   
use App\Models\VendorDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::all();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',
            'total_price' => 'required|numeric',
            'status' => 'required|string',
            'order_details' => 'required|array',
            'order_details.*.product_id' => 'required|exists:products,id',
            'order_details.*.quantity' => 'required|integer',
            'order_details.*.price' => 'required|numeric',
            'order_details.*.shipping_address' => 'required|string|max:255'
        ]);
    
        DB::beginTransaction();
    
        try {
            $orderData = $validatedData;
            unset($orderData['order_details']);
            $order = Order::create($orderData);
    
            foreach ($validatedData['order_details'] as $detail) {
                $orderDetail = $order->orderDetails()->create($detail);
                $this->applyPromotionToOrderDetail($orderDetail);
            }
    
            DB::commit();
    
            return response()->json($order->load('orderDetails.product.promotion.promotionType'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create order', 'message' => $e->getMessage()], 500);
        }
    }
    

    public function show($orderId)
    {
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json([
            'order' => $order
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $validatedData = $request->validate([
            'status' => 'required|string|in:pending,paid,shipped,delivered,cancelled',
        ]);
    
        DB::beginTransaction();
    
        try {
            Log::info('Updating order status', ['order_id' => $order->id, 'status' => $validatedData['status']]);
    
            $order->update(['status' => $validatedData['status']]);
    
            DB::commit();
    
            Log::info('Order status updated successfully', ['order_id' => $order->id]);
    
            return response()->json($order, 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update order status', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to update order status', 'message' => $e->getMessage()], 500);
        }
    }
    

    public function destroy(Order $order)
    {
        DB::beginTransaction();

        try {
            if ($order->payment_slip) {
                Storage::disk('public')->delete($order->payment_slip);
            }

            $order->orderDetails()->delete();
            $order->delete();

            DB::commit();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to delete order', 'message' => $e->getMessage()], 500);
        }
    }

    public function cancelOrder(Order $order)
    {
        DB::beginTransaction();

        try {
            $order->status = 'cancelled';
            $order->save();

            foreach ($order->orderDetails as $detail) {
                $product = $detail->product;
                $product->stock += $detail->quantity;
                $product->save();
            }

            DB::commit();

            return response()->json(['message' => 'Order cancelled successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to cancel order', 'message' => $e->getMessage()], 500);
        }
    }

    public function getQrPayments($order_id)
    {
        Log::info('getQrPayments method called', ['order_id' => $order_id]);
    
        try {
            $order = Order::with('orderDetails.product.vendorDetail')->findOrFail($order_id);
            Log::info('Order found', ['order_id' => $order->id]);
    
            $qrPayments = [];
    
            foreach ($order->orderDetails as $orderDetail) {
                $vendorDetail = $orderDetail->product->vendorDetail;
                if ($vendorDetail) {
                    Log::info('Vendor detail found', ['vendor_id' => $vendorDetail->user_id]);
    
                    $qrPayments[] = [
                        'store_name' => $vendorDetail->store_name,
                        'promptpay_number' => $vendorDetail->promptpay_number,
                        'additional_qr_info' => $vendorDetail->additional_qr_info
                    ];
                } else {
                    Log::warning('Vendor detail not found', ['vendor_id' => $orderDetail->product->vendor_id]);
                } 
            }
    
            return response()->json($qrPayments);
        } catch (\Exception $e) {
            Log::error('Error fetching QR payments', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch QR payments'], 500);
        }
    }    

    public function searchByUserId($userId)
    {
        try {
            Log::info("Searching for orders with user_id: {$userId}");
    
            $orders = Order::where('user_id', $userId)->with('orderDetails.product.images','user.userProfile')->get();
    
            Log::info("Found " . count($orders) . " orders for user_id: {$userId}");
    
            return response()->json($orders);
        } catch (\Exception $e) {
            Log::error("Error occurred while searching for orders with user_id: {$userId}. Error: " . $e->getMessage());
    
            return response()->json(['error' => 'Failed to retrieve orders'], 500);
        }
    }

    public function getOrdersForVendor()
    {
        $user = auth()->user();
        
        if ($user->role !== 'vendor') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $orders = Order::whereHas('orderDetails.product', function($query) use ($user) {
            $query->where('vendor_id', $user->id);
        })->with('orderDetails.product.images','user.userProfile')->get();

        return response()->json($orders);
    }

    public function checkout(Request $request)
    {
        $validatedData = $request->validate([
            'payment_slip' => 'nullable|image|max:2048'
        ]);
    
        DB::beginTransaction();
    
        try {
            Log::info('Checkout process started');
    
            $cart = $this->getCart($request);
            Log::info('Cart retrieved', ['cart_id' => $cart->id]);
    
            // ตรวจสอบว่ามีการชำระเงินหรือไม่
            if ($request->hasFile('payment_slip')) {
                $filePath = $request->file('payment_slip')->store('payment_slips');
                $paymentStatus = 'paid';
                Log::info('Payment slip uploaded', ['file_path' => $filePath]);
            } else {
                $filePath = null;
                $paymentStatus = 'pending';
                Log::info('No payment slip provided, payment status set to pending');
            }
    
            $orders = [];
    
            if ($paymentStatus === 'paid') {
                $vendorOrders = [];
                foreach ($cart->items as $item) {
                    $vendorId = $item->product->vendor_id;
                    if (!isset($vendorOrders[$vendorId])) {
                        $vendorOrders[$vendorId] = [];
                    }
                    $vendorOrders[$vendorId][] = $item;
                }
    
                Log::info('Vendor orders grouped', ['vendorOrders' => $vendorOrders]);
    
                foreach ($vendorOrders as $vendorId => $items) {
                    $vendorCart = new Cart();
                    $vendorCart->items = collect($items);
    
                    $totalPrice = $this->calculateTotalPrice($vendorCart);
                    Log::info('Calculated total price for vendor ' . $vendorId, ['totalPrice' => $totalPrice]);
    
                    $order = Order::create([
                        'user_id' => $request->user()->id,
                        'total_price' => $totalPrice,
                        'status' => $paymentStatus,
                        'payment_slip' => $filePath
                    ]);
    
                    foreach ($items as $item) {
                        $orderDetail = $order->orderDetails()->create([
                            'product_id' => $item->product_id,
                            'quantity' => $item->quantity,
                            'price' => $item->product->price,
                            'discount' => $item->discount,
                            'shipping_address' => $item->shipping_address
                        ]);
                        $this->applyPromotionToOrderDetail($orderDetail);
                        Log::info('Order detail created for item', ['order_detail' => $orderDetail]);
                    }
    
                    $order->save();
                    Log::info('Order saved for vendor', ['order_id' => $order->id, 'vendor_id' => $vendorId]);
                    $orders[] = $order;
                }
            } else {
                $totalPrice = $this->calculateTotalPrice($cart);
                Log::info('Calculated total price for cart', ['totalPrice' => $totalPrice]);
    
                $order = Order::create([
                    'user_id' => $request->user()->id,
                    'total_price' => $totalPrice,
                    'status' => $paymentStatus,
                    'payment_slip' => $filePath
                ]);
    
                foreach ($cart->items as $item) {
                    $orderDetail = $order->orderDetails()->create([
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'price' => $item->product->price,
                        'discount' => $item->discount,
                        'shipping_address' => $item->shipping_address
                    ]);
                    $this->applyPromotionToOrderDetail($orderDetail);
                    Log::info('Order detail created for item', ['order_detail' => $orderDetail]);
                }
    
                $order->save();
                Log::info('Order saved for cart', ['order_id' => $order->id]);
                $orders[] = $order;
            }
    
            $cart->items()->delete();
            $cart->delete();
            Log::info('Cart and items deleted', ['cart_id' => $cart->id]);
    
            DB::commit();
    
            foreach ($orders as $order) {
                $order->load('orderDetails.product.promotion.promotionType');
                Log::info('Order details loaded for order', ['order_id' => $order->id]);
            }
    
            Log::info('Checkout process completed successfully');
            return response()->json(['orders' => $orders], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create orders', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create orders', 'message' => $e->getMessage()], 500);
        }
    }
    
    protected function applyPromotionToOrderDetail(OrderDetail $orderDetail)
    {
        $promotions = Promotion::where('product_id', $orderDetail->product_id)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->get();
    
        foreach ($promotions as $promotion) {
            if ($orderDetail->quantity < $promotion->min_quantity || $orderDetail->product->price * $orderDetail->quantity < $promotion->min_price) {
                continue;
            }
    
            Log::info('Applying promotion', [
                'promotion_type_id' => $promotion->promotion_type_id,
                'promotion' => $promotion,
            ]);
    
            switch ($promotion->promotionType->name) {
                case 'ส่วนลดเปอร์เซ็นต์':
                    $discountAmount = ($orderDetail->product->price * $promotion->discount_value / 100) * $orderDetail->quantity;
                    $orderDetail->discount = $discountAmount;
                    break;
    
                case 'ส่วนลดคงที่':
                    $orderDetail->discount = $promotion->discount_value * $orderDetail->quantity;
                    break;
    
                case 'ซื้อหนึ่งแถมหนึ่ง':
                    $freeItem = $orderDetail->replicate();
                    $freeItem->quantity = $orderDetail->quantity;
                    $freeItem->is_free = true;
                    $freeItem->save();
                    break;
    
                case 'จัดส่งฟรี':
                    $cart = $orderDetail->cart;
                    $cart->free_shipping = true;
                    $cart->save();
                    break;
            }
            $orderDetail->save();
            Log::info('Order detail after applying promotion', [
                'order_detail_id' => $orderDetail->id,
                'product_id' => $orderDetail->product_id,
                'price' => $orderDetail->price,
                'quantity' => $orderDetail->quantity,
                'discount' => $orderDetail->discount,
                'final_price' => ($orderDetail->price * $orderDetail->quantity) - $orderDetail->discount
            ]);
        }
    }
    

    public function uploadPaymentSlip(Request $request, $orderId)
    {
        $validatedData = $request->validate([
            'payment_slip' => 'required|image|max:2048'
        ]);
    
        DB::beginTransaction();
        
        try {
            Log::info('Start uploading payment slip', ['order_id' => $orderId]);
    
            $order = Order::findOrFail($orderId);
    
            if ($request->hasFile('payment_slip')) {
                $file = $request->file('payment_slip');
                $filePath = $file->getPathname();
                $fileContents = file_get_contents($filePath);
                $base64File = base64_encode($fileContents);
    
                $order->payment_slip = $base64File;
                $order->status = 'paid';
                $order->save();
    
                Log::info('File received', ['original_name' => $file->getClientOriginalName()]);
                Log::info('File converted to base64 and stored', ['base64' => $base64File]);
    
                $this->splitOrder($order);
    
                DB::commit();
                Log::info('Transaction committed successfully');
    
                return response()->json(['order' => $order], 200);
            } else {
                Log::error('No payment slip found in request');
                return response()->json(['error' => 'No payment slip found in request'], 400);
            }
    
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error uploading payment slip', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to upload payment slip', 'message' => $e->getMessage()], 500);
        }
    }
    
    
    protected function splitOrder(Order $order)
{
    $vendorOrders = [];
    Log::info('Starting order split', ['order_id' => $order->id]);
    
    foreach ($order->orderDetails as $detail) {
        $vendorId = $detail->product->vendor_id;
        if (!isset($vendorOrders[$vendorId])) {
            $vendorOrders[$vendorId] = [];
        }
        $vendorOrders[$vendorId][] = $detail;
    }

    Log::info('Grouped order details by vendor', ['vendorOrders' => $vendorOrders]);
    
    foreach ($vendorOrders as $vendorId => $details) {
        $totalPrice = array_reduce($details, function($carry, $detail) {
            return $carry + ($detail->price * $detail->quantity - $detail->discount);
        }, 0);

        Log::info('Calculating total price for vendor', ['vendor_id' => $vendorId, 'totalPrice' => $totalPrice]);
        
        $vendorOrder = Order::create([
            'user_id' => $order->user_id,
            'total_price' => $totalPrice,
            'status' => 'paid',
            'payment_slip' => $order->payment_slip,
        ]);

        Log::info('Vendor order created', ['vendor_order_id' => $vendorOrder->id, 'vendor_id' => $vendorId]);

        foreach ($details as $detail) {
            $orderDetail = $vendorOrder->orderDetails()->create([
                'product_id' => $detail->product_id,
                'quantity' => $detail->quantity,
                'price' => $detail->price,
                'discount' => $detail->discount,
                'shipping_address' => $detail->shipping_address
            ]);
            Log::info('Order detail created for vendor order', ['order_detail_id' => $orderDetail->id, 'vendor_order_id' => $vendorOrder->id]);
        }

        $vendorOrder->save();
        Log::info('Vendor order saved', ['vendor_order_id' => $vendorOrder->id]);
    }

    $order->delete();
    Log::info('Original order deleted after splitting', ['order_id' => $order->id]);
}
    
    protected function getCart(Request $request)
    {
        if ($request->user()) {
            return Cart::where('user_id', $request->user()->id)->firstOrFail();
        }

        return Cart::where('session_id', $request->session()->getId())->firstOrFail();
    }

    protected function calculateTotalPrice(Cart $cart)
    {
        $totalPrice = 0;
    
        foreach ($cart->items as $item) {
            if ($item->is_free) {
                continue;
            }
            $itemTotal = ($item->product->price * $item->quantity) - $item->discount;
            Log::info('Calculating item total', [
                'product_id' => $item->product_id,
                'price' => $item->product->price,
                'quantity' => $item->quantity,
                'discount' => $item->discount,
                'itemTotal' => $itemTotal
            ]);
            $totalPrice += $itemTotal;
        }
    
        Log::info('Total price calculated for cart', ['totalPrice' => $totalPrice]);
        return $totalPrice;
    }
    
    
    public function getAllOrders()
    {
        $orders = Order::with('orderDetails.product.images', 'user.userProfile')->get();
        return response()->json($orders);
    }
    

    public function updateOrderStatus(Request $request, $orderId)
    {
        $validatedData = $request->validate([
            'status' => 'required|string'
        ]);

        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order->status = $validatedData['status'];
        $order->save();

        return response()->json(['message' => 'Order status updated successfully']);
    }

}
