export interface Banner {
    id?: number;          // Optional id field
    name: string;         // ชื่อของแบนเนอร์
    url: string | Blob;   // URL หรือ Blob ของภาพแบนเนอร์
    banner_order?: number; // ลำดับการแสดง (optional)
}
  