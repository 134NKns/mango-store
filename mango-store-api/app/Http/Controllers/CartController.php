<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cart = $this->getCart($request);

        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }

        $cart = $this->applyPromotionsToCart($cart);
        return response()->json($cart->load('items.product.promotion.promotionType'));
    }

    public function addItem(Request $request)
    {
        $validatedData = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string|max:255'
        ]);
    
        $cart = $this->getCart($request);
    
        if (!$cart) {
            return response()->json(['message' => 'Unable to find or create cart'], 500);
        }
    
        // ตรวจสอบทั้ง product_id และ shipping_address
        $item = $cart->items()
            ->where('product_id', $validatedData['product_id'])
            ->where('shipping_address', $validatedData['shipping_address'])
            ->first();
    
        if ($item) {
            $item->quantity += $validatedData['quantity'];
            $item->save();
        } else {
            $item = $cart->items()->create([
                'product_id' => $validatedData['product_id'],
                'quantity' => $validatedData['quantity'],
                'shipping_address' => $validatedData['shipping_address'],
            ]);
        }
    
        $this->applyPromotion($item, $validatedData['quantity']);
    
        $totalPrice = $this->calculateTotalPrice($cart);
    
        $cart = $this->applyPromotionsToCart($cart);
    
        return response()->json(['cart' => $cart->load('items.product.promotion.promotionType'), 'total_price' => $totalPrice]);
    }
    

    public function updateItem(Request $request, $itemId)
    {
        $validatedData = $request->validate([
            'quantity' => 'required|integer|min:0',
            'shipping_address' => 'sometimes|required|string|max:255'
        ]);
    
        $cart = $this->getCart($request);
    
        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }
    
        // ตรวจสอบ item จาก $itemId แทนที่จะเป็น product_id อย่างเดียว
        $item = $cart->items()->find($itemId);
    
        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }
    
        if ($validatedData['quantity'] == 0) {
            $item->delete();
        } else {
            $item->quantity = $validatedData['quantity'];
            if (isset($validatedData['shipping_address'])) {
                $item->shipping_address = $validatedData['shipping_address'];
            }
            $item->save();
    
            $this->applyPromotion($item, $validatedData['quantity']);
        }
    
        $totalPrice = $this->calculateTotalPrice($cart);
    
        $cart = $this->applyPromotionsToCart($cart);
    
        return response()->json(['cart' => $cart->load('items.product.promotion.promotionType'), 'total_price' => $totalPrice]);
    }
    

    public function removeItem(Request $request, $itemId)
    {
        $cart = $this->getCart($request);

        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }

        $item = $cart->items()->find($itemId);

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        $item->delete();

        $totalPrice = $this->calculateTotalPrice($cart);

        $cart = $this->applyPromotionsToCart($cart);

        return response()->json(['cart' => $cart->load('items.product.promotion.promotionType'), 'total_price' => $totalPrice]);
    }

    protected function getCart(Request $request)
    {
        if ($request->user()) {
            $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);
        } else {
            $token = $request->header('Authorization');
            if ($token) {
                $token = str_replace('Bearer ', '', $token);
                $cart = Cart::firstOrCreate(['token' => $token]);
            } else {
                $token = bin2hex(random_bytes(32));
                $cart = Cart::create(['token' => $token]);
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $cart;
    }

    protected function applyPromotion(CartItem $item, $quantity)
    {
        Log::info('Retrieving promotions for product', [
            'product_id' => $item->product_id,
        ]);
    
        Log::info('Current timezone', [
            'timezone' => config('app.timezone'),
            'current_time' => now()->toDateTimeString(),
        ]);
    
        $promotions = Promotion::where('product_id', $item->product_id)
            ->where('end_date', '>=', now())
            ->with('promotionType') // Ensure promotionType is loaded
            ->get();
    
        Log::info('Promotions retrieved', [
            'promotions_count' => $promotions->count(),
            'promotions' => $promotions,
        ]);
    
        Log::info('1');
        foreach ($promotions as $promotion) {
            Log::info('2');
            if ($quantity < $promotion->min_quantity || $item->product->price * $quantity < $promotion->min_price) {
                Log::info('Promotion conditions not met', [
                    'product_id' => $item->product_id,
                    'quantity' => $quantity,
                    'min_quantity' => $promotion->min_quantity,
                    'price' => $item->product->price,
                    'total_price' => $item->product->price * $quantity,
                    'min_price' => $promotion->min_price
                ]);
                continue;
            }
    
            Log::info('Applying promotion', [
                'promotion_type_id' => $promotion->promotion_type_id,
                'promotion' => $promotion,
            ]);
    
            // Log the promotion type name
            Log::info('Promotion type name', ['name' => $promotion->promotionType->name]);
    
            switch ($promotion->promotionType->name) {
                case 'ส่วนลดเปอร์เซ็นต์':
                    $discountAmount = ($item->product->price * $promotion->discount_value) / 100 * $quantity;
                    Log::info('Percentage discount calculated', [
                        'product_id' => $item->product_id,
                        'discountAmount' => $discountAmount,
                        'price' => $item->product->price,
                        'discount_value' => $promotion->discount_value,
                        'quantity' => $quantity
                    ]);
                    $item->discount = $discountAmount;
                    $item->save();
                    Log::info('Percentage discount applied', [
                        'product_id' => $item->product_id,
                        'discountAmount' => $discountAmount,
                        'item' => $item
                    ]);
                    break;
    
                case 'ส่วนลดคงที่':
                    $item->discount = $promotion->discount_value * $quantity;
                    Log::info('Applying fixed discount', [
                        'product_id' => $item->product_id,
                        'discountValue' => $promotion->discount_value,
                    ]);
                    $item->save();
                    break;
            }
        }
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

    protected function applyPromotionsToCart(Cart $cart)
    {
        foreach ($cart->items as $item) {
            if ($item->product && $item->product->promotion) {
                Log::info('Applying promotion to cart item', [
                    'product_id' => $item->product_id,
                    'promotion' => $item->product->promotion,
                ]);
                $item->promotion = $item->product->promotion;
                $item->promotion->promotion_type = $item->promotion->promotionType->name;
            }
        }
        return $cart;
    }

    public function getAllCartsForAdmin(Request $request)
    {
        if ($request->user() && $request->user()->role === 'admin') {
            $carts = Cart::with('items.product.promotion.promotionType')->get();
            return response()->json($carts);
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    }
}
