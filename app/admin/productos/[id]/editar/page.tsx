import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { actualizarProducto } from "../../actions";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const action = actualizarProducto.bind(null, product.id);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Editar producto</h1>
      <ProductForm action={action} categories={categories} product={product} submitLabel="Guardar cambios" />
    </div>
  );
}
