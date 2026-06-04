import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { crearProducto } from "../actions";

export default async function NuevoProductoPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Nuevo producto</h1>
      <ProductForm action={crearProducto} categories={categories} submitLabel="Crear producto" />
    </div>
  );
}
