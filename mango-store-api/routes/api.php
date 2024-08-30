<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\VendorDetailController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderDetailController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\PromotionTypeController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\SystemPromptpayController;

Route::get('/hello', function () {
    return response()->json('Hello World', 200);
});

Route::post('/hello', function () {
    return response()->json('Hello World Post', 200);
})->middleware(['jwt.cookie', 'role:Admin']);

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'
], function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware(['jwt.cookie'])->name('logout');
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware(['jwt.cookie'])->name('refresh');
    Route::post('/me', [AuthController::class, 'me'])->middleware(['jwt.cookie'])->name('me');
    Route::delete('/user/{id}', [AuthController::class, 'deleteUser'])->middleware(['jwt.cookie', 'role:Admin'])->name('deleteUser');
});

// Product Routes
Route::group([
    'middleware' => 'api',
    'prefix' => 'products'
], function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/search', [ProductController::class, 'search'])->name('products.search');
    Route::post('/', [ProductController::class, 'store'])->middleware(['jwt.cookie', 'role:vendor|admin'])->name('products.store');
    Route::put('/{product}', [ProductController::class, 'update'])->middleware(['jwt.cookie', 'role:vendor|admin'])->name('products.update');
    Route::delete('/{product}', [ProductController::class, 'destroy'])->middleware(['jwt.cookie', 'role:vendor|admin'])->name('products.destroy');
});

// User Profile Routes with Middleware
Route::group([
    'middleware' => ['api', 'jwt.cookie'],
], function () {
    Route::put('user-profiles/{user_id}', [UserProfileController::class, 'update']);
    Route::get('user-profiles/by-user/{user_id}', [UserProfileController::class, 'showByUserId']);
    Route::put('vendor-details/{user_id}', [VendorDetailController::class, 'update']);
    Route::get('vendor-details/by-user/{user_id}', [VendorDetailController::class, 'showByUserId']);
});

// Order and Cart Routes with Middleware
Route::group([
    'middleware' => ['api', 'jwt.cookie'],
], function () {
    Route::get('orders/{order}/qr-payments', [OrderController::class, 'getQrPayments'])->middleware(['jwt.cookie']);
    Route::resource('orders', OrderController::class);
    Route::get('orders/search/user/{userId}', [OrderController::class, 'searchByUserId']);
    Route::post('orders/cancel/{order}', [OrderController::class, 'cancelOrder'])->middleware(['role:customer|vendor|admin']);
    Route::post('orders/upload-slip/{order}', [OrderController::class, 'uploadPaymentSlip'])->middleware(['jwt.cookie']);
    Route::put('orders/{orderId}/status', [OrderController::class, 'updateOrderStatus'])->middleware(['role:vendor|admin']);
    Route::get('orders', [OrderController::class, 'getAllOrders'])->middleware(['role:admin']);
    Route::resource('orderdetails', OrderDetailController::class);
    Route::get('orderdetails/search/order/{orderId}', [OrderDetailController::class, 'searchByOrderId']);
    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart/add', [CartController::class, 'addItem'])->middleware(['role:customer']);
    Route::get('carts', [CartController::class, 'getAllCartsForAdmin'])->middleware(['role:admin']);
    Route::put('cart/update/{itemId}', [CartController::class, 'updateItem']);
    Route::delete('cart/remove/{itemId}', [CartController::class, 'removeItem']);
    Route::post('checkout', [OrderController::class, 'checkout'])->middleware(['jwt.cookie', 'role:customer|vendor|admin']);
});


// PromotionType Routes
Route::group([
    'middleware' => ['api', 'jwt.cookie'],
    'prefix' => 'promotion-types'
], function () {
    Route::get('/', [PromotionTypeController::class, 'index']);
    Route::get('/{id}', [PromotionTypeController::class, 'show']);
    Route::post('/', [PromotionTypeController::class, 'store'])->middleware('role:admin');
    Route::put('/{id}', [PromotionTypeController::class, 'update'])->middleware('role:admin');
    Route::delete('/{id}', [PromotionTypeController::class, 'destroy'])->middleware('role:admin');
});

// Promotion Routes
Route::group([
    'middleware' => ['api', 'jwt.cookie'],
    'prefix' => 'promotions'
], function () {
    Route::get('/', [PromotionController::class, 'index']);
    Route::get('/{id}', [PromotionController::class, 'show']);
    Route::post('/', [PromotionController::class, 'store'])->middleware('role:vendor|admin');
    Route::put('/{id}', [PromotionController::class, 'update'])->middleware('role:vendor|admin');
    Route::delete('/{id}', [PromotionController::class, 'destroy'])->middleware('role:vendor|admin');
});

Route::get('vendor/orders', [OrderController::class, 'getOrdersForVendor'])->middleware(['jwt.cookie', 'role:vendor']);

// PromptPay Route
Route::group([
    'middleware' => ['api', 'jwt.cookie'],
    'prefix' => 'system-promptpay'
], function () {
    Route::get('/', [SystemPromptpayController::class, 'index'])->middleware('role:admin');
    Route::get('/show', [SystemPromptpayController::class, 'show']);
    Route::post('/', [SystemPromptpayController::class, 'store'])->middleware('role:admin');
    Route::put('/', [SystemPromptpayController::class, 'update'])->middleware('role:admin');
    Route::delete('/', [SystemPromptpayController::class, 'destroy'])->middleware('role:admin');
});
