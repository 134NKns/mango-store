export const API_URLS = {
  login: 'http://localhost:8000/api/auth/login',
  register: 'http://localhost:8000/api/auth/register',
  me: 'http://localhost:8000/api/auth/me',
  add_product: 'http://localhost:8000/api/products',
  get_all_products: 'http://localhost:8000/api/products',
  search_products: 'http://localhost:8000/api/products/search',
  delete_product: 'http://localhost:8000/api/products',
  update_product: 'http://localhost:8000/api/products',
  get_user_profile: 'http://localhost:8000/api/user-profiles/by-user',
  update_user_profile: 'http://localhost:8000/api/user-profiles',
  get_vendor_detail: 'http://localhost:8000/api/vendor-details/by-user',
  update_vendor_detail: 'http://localhost:8000/api/vendor-details',
  get_all_carts_for_admin: 'http://localhost:8000/api/carts',
  get_cart: 'http://localhost:8000/api/cart',
  add_item_to_cart: 'http://localhost:8000/api/cart/add',
  remove_item_from_cart: 'http://localhost:8000/api/cart/remove',
  checkout: 'http://localhost:8000/api/checkout',
  get_orders: 'http://localhost:8000/api/orders',
  get_order_by_user: 'http://localhost:8000/api/orders/search/user',
  get_order_details: 'http://localhost:8000/api/orderdetails',
  get_order_details_by_order: 'http://localhost:8000/api/orderdetails/search/order',
  update_cart_item: 'http://localhost:8000/api/cart/update',
  // Added endpoints for promotions and promotion types
  add_promotion: 'http://localhost:8000/api/promotions',
  get_promotions: 'http://localhost:8000/api/promotions',
  update_promotion: 'http://localhost:8000/api/promotions',
  delete_promotion: 'http://localhost:8000/api/promotions',
  get_promotion_types: 'http://localhost:8000/api/promotion-types',
  add_promotion_type: 'http://localhost:8000/api/promotion-types',
  update_promotion_type: 'http://localhost:8000/api/promotion-types',
  delete_promotion_type: 'http://localhost:8000/api/promotion-types',
  // Added endpoints for order types
  create_pending_order: 'http://localhost:8000/api/orders/create-pending',
  cancel_order: 'http://localhost:8000/api/orders/cancel',
  upload_slip: 'http://localhost:8000/api/orders/upload-slip',
  get_qr_payments: 'http://localhost:8000/api/orders',
  // New endpoints for managing orders
  get_all_orders: 'http://localhost:8000/api/orders', // GET to get all orders
  update_order_status: 'http://localhost:8000/api/orders', // PUT to update order status
  // New endpoint for vendor orders
  get_vendor_orders: 'http://localhost:8000/api/vendor/orders',
  // PromtPay endpoint
  promptpay_info: 'http://localhost:8000/api/system-promptpay',
};
    