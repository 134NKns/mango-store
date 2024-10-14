<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Banner;

class BannerController extends Controller
{
    // แสดงรายการ banners ทั้งหมด
    public function index()
    {
        $banners = Banner::all(); // ดึงข้อมูลแบนเนอร์ทั้งหมด
        return response()->json($banners); // ส่งกลับเป็น JSON
    }

    // สร้าง banner ใหม่ พร้อมแปลงรูปเป็น Base64
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'url' => 'required|file|mimes:jpeg,png,jpg,gif,svg|max:2048', // รับเฉพาะไฟล์รูปภาพ
            'banner_order' => 'nullable|integer',
        ]);

        // ดึงไฟล์จาก request และแปลงเป็น Base64
        $image = $request->file('url'); // ดึงไฟล์จากฟอร์ม
        $imageBase64 = base64_encode(file_get_contents($image)); // แปลงเป็น Base64

        // สร้างข้อมูลแบนเนอร์ใหม่ในฐานข้อมูล
        $banner = Banner::create([
            'name' => $request->name,
            'url' => $imageBase64, // เก็บ Base64 ของรูปลงในฐานข้อมูล
            'banner_order' => $request->banner_order,
        ]);

        return response()->json($banner, 201);
    }

    // แสดง banner ตาม id
    public function show($id)
    {
        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], 404);
        }
        return response()->json($banner);
    }

    // อัปเดต banner
    public function update(Request $request, $id)
    {
        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], 404);
        }

        if ($request->hasFile('url')) {
            // ถ้ามีการส่งไฟล์ใหม่มา ก็แปลงเป็น Base64
            $image = $request->file('url');
            $imageBase64 = base64_encode(file_get_contents($image));
            $banner->update(['url' => $imageBase64]);
        }

        $banner->update($request->except('url')); // อัปเดตข้อมูลอื่น ๆ

        return response()->json($banner);
    }

    // ลบ banner
    public function destroy($id)
    {
        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json(['message' => 'Banner not found'], 404);
        }

        $banner->delete();

        return response()->json(['message' => 'Banner deleted']);
    }
}
