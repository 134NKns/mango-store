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
            $products = Product::all();  // Fetch all products from the database

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
                'image' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048' // Validate the single image
            ]);
    
            // Create a new Product instance and save to database
            $product = new Product($validatedData);
            $product->save();
    
            // Handle single image upload if provided
            if ($request->hasFile('image')) {
                // Get the uploaded file
                $file = $request->file('image');
                $filePath = $file->getPathName(); // Get the temporary uploaded file path
    
                // Determine the file extension
                $extension = $file->getClientOriginalExtension();
    
                // Create an image resource from the uploaded file based on its type
                $imageResource = null;
                switch (strtolower($extension)) {
                    case 'jpeg':
                    case 'jpg':
                        $imageResource = imagecreatefromjpeg($filePath);
                        break;
                    case 'png':
                        $imageResource = imagecreatefrompng($filePath);
                        break;
                    case 'gif':
                        $imageResource = imagecreatefromgif($filePath);
                        break;
                    default:
                        // Return an error if the file type is not supported
                        return response()->json(['error' => 'Unsupported image type'], 400);
                }
    
                // Start output buffering to capture the image data
                ob_start();
                switch (strtolower($extension)) {
                    case 'jpeg':
                    case 'jpg':
                        imagejpeg($imageResource, null, 75); // Lower the quality to 75. Adjust as needed.
                        break;
                    case 'png':
                        imagepng($imageResource, null, 6); // Compression level for PNGs
                        break;
                    case 'gif':
                        imagegif($imageResource); // GIFs do not support quality adjustment
                        break;
                }
    
                // Get the image data from the buffer and end output buffering
                $imageData = ob_get_clean();
    
                // Convert the image data to base64
                $base64Image = base64_encode($imageData);
    
                // Prepare the MIME type prefix based on the file extension
                $prefix = 'data:image/' . $extension . ';base64,';
                $base64ImageUrl = $prefix . $base64Image;
    
                // Destroy resources
                imagedestroy($imageResource);
    
                // Create and save product image
                $productImage = new ProductImage([
                    'product_id' => $product->id,
                    'image_data' => $base64ImageUrl
                ]);
                $productImage->save();
    
                Log::debug('Base64 Image URL: ' . $base64ImageUrl);
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
            // Start building the query and load relationships
            $query = Product::with(['images', 'promotion']);
    
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
            Log::error('Error searching for products: ' . $e->getMessage());
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
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'delete_image' => 'nullable|boolean' // Add this to handle image deletion
            ]);

            // Update product with validated data, excluding image management to handle separately
            $productData = Arr::except($validatedData, ['image', 'delete_image']);
            $product->update($productData);
            
            // Check if the image should be deleted
            if ($request->boolean('delete_image')) {
                $image = $product->images()->first(); // Assuming one image per product
                if ($image) {
                    Storage::delete($image->image_data); // Adjust according to your storage path
                    $image->delete(); // Delete the image record
                }
            } elseif ($request->hasFile('image')) {
                // Handle image upload
                $file = $request->file('image');
                $filePath = $file->getPathName(); // Get the temporary uploaded file path
                // Determine the file extension
                $extension = $file->getClientOriginalExtension();
                // Create an image resource from the uploaded file based on its type
                $imageResource = null;
                switch (strtolower($extension)) {
                    case 'jpeg':
                    case 'jpg':
                        $imageResource = imagecreatefromjpeg($filePath);
                        break;
                    case 'png':
                        $imageResource = imagecreatefrompng($filePath);
                        break;
                    case 'gif':
                        $imageResource = imagecreatefromgif($filePath);
                        break;
                    default:
                        // Return an error if the file type is not supported
                        return response()->json(['error' => 'Unsupported image type'], 400);
                }
                // Start output buffering to capture the image data
                ob_start();
                switch (strtolower($extension)) {
                    case 'jpeg':
                    case 'jpg':
                        imagejpeg($imageResource, null, 75); // Lower the quality to 75. Adjust as needed.
                        break;
                    case 'png':
                        imagepng($imageResource, null, 6); // Compression level for PNGs
                        break;
                    case 'gif':
                        imagegif($imageResource); // GIFs do not support quality adjustment
                        break;
                }
                // Get the image data from the buffer and end output buffering
                $imageData = ob_get_clean();
                // Convert the image data to base64
                $base64Image = base64_encode($imageData);
                // Prepare the MIME type prefix based on the file extension
                $prefix = 'data:image/' . $extension . ';base64,';
                $base64ImageUrl = $prefix . $base64Image;
                // Destroy resources
                imagedestroy($imageResource);
                // Create or update image record
                $productImage = $product->images()->first();
                if ($productImage) {
                    $productImage->update(['image_data' => $base64ImageUrl]);
                } else {
                    $product->images()->create(['image_data' => $base64ImageUrl]);
                }

                Log::debug('Base64 Image URL: ' . $base64ImageUrl);
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
}
