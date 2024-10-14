<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Import Log facade
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Arr;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $this->removeExpiredPromotions();

            $products = Product::with(['images', 'promotion' => function($query) {
                $query->where('end_date', '>=', now());
            }])->get();  // Fetch all products with active promotions

            if ($products->isEmpty()) {
                return response()->json([
                    'message' => 'No products found',
                    'data' => []
                ], 404); // HTTP status code 404: Not Found
            }

            return response()->json([
                'message' => 'Products retrieved successfully',
                'data' => $products
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error retrieving products: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500); // HTTP status code 500: Internal Server Error
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // No implementation needed for API controllers
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $request->merge(['is_available' => filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN)]);
            // Validate incoming request data
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric',
                'vendor_id' => 'required|exists:users,id',
                'stock' => 'required|numeric',
                'is_available' => 'boolean',
                'mango_type' => 'nullable|in:มะม่วงสุก,มะม่วงดิบ,มะม่วงแปรรูป,', // เพิ่มการ validate mango_type
                'image' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048' // Validate the single image
            ]);
    
            // Create a new Product instance and save to database
            $product = new Product($validatedData);
            $product->save();
    
            // Handle single image upload if provided
            if ($request->hasFile('image')) {
                // (การจัดการรูปภาพเหมือนเดิม)
            }
    
            return response()->json([
                'message' => 'Product successfully created',
                'data' => $product->load('images') // Load images relationship to include in response
            ], 201);
        } catch (ValidationException $e) {
            Log::error('Validation error creating product: ' . json_encode($e->errors()));
            return response()->json(['errors' => $e->errors()], 422); // HTTP status code 422: Unprocessable Entity
        } catch (\Exception $e) {
            Log::error('Error creating product: ' . $e->getMessage(), ['stack' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500); // HTTP status code 500: Internal Server Error
        }
    }
    
      
    public function search(Request $request)
    {
        try {
            Log::info('Starting search method', ['request' => $request->all()]);

            // Remove expired promotions before search
            $this->removeExpiredPromotions();

            // Start building the query and load relationships
            $query = Product::with(['images', 'promotion' => function($query) {
                $query->where('end_date', '>=', now());
            }]);
    
            // Search by product ID
            if ($request->has('product_id')) {
                $query->where('id', $request->product_id);
            }
    
            // Search by vendor ID
            if ($request->has('vendor_id')) {
                $query->where('vendor_id', $request->vendor_id);
            }
    
            // Search by product name
            if ($request->has('name')) {
                $query->where('name', 'like', '%' . $request->name . '%');
            }
    
            // Execute the query and get the results
            $products = $query->get();
    
            // Check if any products were found
            if ($products->isEmpty()) {
                return response()->json([
                    'message' => 'No products found',
                    'data' => []
                ], 404);
            }
    
            return response()->json([
                'message' => 'Products retrieved successfully',
                'data' => $products
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error searching for products', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to search for products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        // No implementation needed for API controllers
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        Log::info('Received update request:', [
            'headers' => $request->headers->all(),
            'all' => $request->all() // This should show all non-file inputs
        ]);
    
        try {
            // Convert delete_image to boolean before validation
            $request->merge(['delete_image' => filter_var($request->input('delete_image'), FILTER_VALIDATE_BOOLEAN)]);
            $request->merge(['is_available' => filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN)]);
    
            // Validate incoming request data
            $validatedData = $request->validate([
                'name' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'price' => 'nullable|numeric',
                'stock' => 'nullable|numeric|min:0',
                'is_available' => 'nullable|boolean',
                'vendor_id' => 'nullable|exists:users,id',
                'mango_type' => 'nullable|in:มะม่วงสุก,มะม่วงดิบ,มะม่วงแปรรูป,', // เพิ่มการ validate mango_type
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'delete_image' => 'nullable|boolean' // Add this to handle image deletion
            ]);
    
            // Update product with validated data, excluding image management to handle separately
            $productData = Arr::except($validatedData, ['image', 'delete_image']);
            $product->update($productData);
    
            // Check if the image should be deleted
            if ($request->boolean('delete_image')) {
                // (การลบและจัดการรูปภาพเหมือนเดิม)
            } elseif ($request->hasFile('image')) {
                // (การอัปโหลดรูปภาพเหมือนเดิม)
            }
    
            return response()->json([
                'message' => 'Product updated successfully',
                'data' => $product->load('images') // Ensure images are reloaded to reflect current state
            ], 200);
        } catch (ValidationException $e) {
            Log::error('Validation error updating product: ' . json_encode($e->errors()));
            return response()->json([
                'errors' => $e->errors()
            ], 422); // HTTP status code 422: Unprocessable Entity
        } catch (\Exception $e) {
            Log::error('Error updating product: ' . $e->getMessage(), ['stack' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500); // HTTP status code 500: Internal Server Error
        }
    }
    

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        try {
            if (!$product) {
                return response()->json(['error' => 'Not Found', 'message' => 'Product not found'], 404);
            }
    
            // Delete associated images
            $product->images()->delete();
    
            // Delete the product itself
            $product->delete();
    
            return response()->json([
                'message' => 'Product deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting product: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function compressAndConvertToBase64($sourcePath, $quality) {
        $info = getimagesize($sourcePath);
    
        if ($info === false) {
            return false; // Not a valid image.
        }
    
        // Create image from source based on MIME type
        switch ($info['mime']) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($sourcePath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($sourcePath);
                imagesavealpha($image, true); // Preserve transparency in PNGs
                break;
            default:
                return false; // Unsupported image type
        }
    
        // Start output buffering to capture the image stream
        ob_start();
        imagejpeg($image, null, $quality); // Adjust format and quality here if needed
        $compressedData = ob_get_clean();
    
        // Destroy the image resource to free memory
        imagedestroy($image);
    
        // Encode the compressed image data to base64
        return 'data:' . $info['mime'] . ';base64,' . base64_encode($compressedData);
    }

    /**
     * Remove expired promotions from the database and update products using expired promotions.
     */
    protected function removeExpiredPromotions()
    {
        Log::info('Removing expired promotions');

        try {
            $expiredPromotions = Promotion::where('end_date', '<', now())->get();

            foreach ($expiredPromotions as $promotion) {
                Log::info('Removing expired promotion', [
                    'promotion_id' => $promotion->id,
                    'product_id' => $promotion->product_id
                ]);

                // Find the product associated with the expired promotion
                $product = Product::where('id', $promotion->product_id)->first();
                if ($product && $product->promotion_id == $promotion->id) {
                    Log::info('Updating product to nullify expired promotion', [
                        'product_id' => $product->id,
                        'promotion_id' => $promotion->id
                    ]);

                    // Nullify the promotion relationship
                    $product->promotion_id = null;
                    $product->save();
                }

                // Delete the expired promotion
                $promotion->delete();
            }

            Log::info('Expired promotions removed successfully');
        } catch (\Exception $e) {
            Log::error('Error removing expired promotions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

}
