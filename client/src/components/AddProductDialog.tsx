import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  editProduct?: {
    id: number;
    name: string;
    price: string;
    originalPrice?: string | null;
    categoryId?: number | null;
    description?: string | null;
    sku?: string | null;
    stockQuantity: number;
    lowStockThreshold: number;
    imageUrl?: string | null;
    unit?: string | null;
    barcode?: string | null;
  };
}

export default function AddProductDialog({ open, onClose, editProduct }: AddProductDialogProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [imageUrl, setImageUrl] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Update form fields when editProduct changes
  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setPrice(editProduct.price);
      setOriginalPrice(editProduct.originalPrice ?? "");
      setCategoryId(editProduct.categoryId ? String(editProduct.categoryId) : "");
      setDescription(editProduct.description ?? "");
      setSku(editProduct.sku ?? "");
      setStock(String(editProduct.stockQuantity));
      setLowStockThreshold(String(editProduct.lowStockThreshold));
      setImageUrl(editProduct.imageUrl ?? "");
      setUnit(editProduct.unit ?? "pcs");
    } else {
      // Reset form when adding new product
      setName("");
      setPrice("");
      setOriginalPrice("");
      setCategoryId("");
      setDescription("");
      setSku("");
      setStock("0");
      setLowStockThreshold("10");
      setImageUrl("");
      setUnit("pcs");
    }
  }, [editProduct, open]);

  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.list.useQuery();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Product created successfully");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Product updated successfully");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImage = trpc.products.uploadImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.url);
      toast.success("Image uploaded");
    },
    onError: (e) => toast.error("Upload failed: " + e.message),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      await uploadImage.mutateAsync({ base64, filename: file.name, mimeType: file.type });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Name and price are required");
      return;
    }
    const data = {
      name,
      price,
      originalPrice: originalPrice || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      description: description || undefined,
      sku: sku || undefined,
      stockQuantity: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      imageUrl: imageUrl || undefined,
      unit: unit || "pcs",
    };
    if (editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, ...data });
    } else {
      await createProduct.mutateAsync(data);
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label className="text-sm">Product Image</Label>
            <div
              className="mt-1 border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Product" className="h-24 w-24 object-cover rounded-lg" />
              ) : (
                <div className="h-24 w-24 bg-secondary rounded-lg flex items-center justify-center">
                  <Upload size={24} className="text-muted-foreground" />
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {uploading ? "Uploading..." : "Click to upload image"}
              </span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-sm">Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maize Flour 2kg" className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm">Selling Price (KES) *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm">Original Price (KES)</Label>
              <Input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="For discounts" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">SKU / Code</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. SKU-001" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Stock Quantity</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Low Stock Alert</Label>
              <Input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["pcs", "kg", "g", "L", "ml", "box", "pack", "bag", "dozen"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-sm">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description..." className="mt-1 h-20" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <><Loader2 size={14} className="animate-spin mr-2" /> Saving...</> : (editProduct ? "Update Product" : "Add Product")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
