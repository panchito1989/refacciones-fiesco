import { crearProducto } from "../actions";

export default function NuevoProductoPage() {
  return (
    <form action={crearProducto} className="flex max-w-lg flex-col gap-3">
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <input name="name" placeholder="Nombre" className="rounded border p-2" required />
      <input name="sku" placeholder="SKU" className="rounded border p-2" required />
      <input name="partNumber" placeholder="Número de parte" className="rounded border p-2" required />
      <input name="brand" placeholder="Marca" className="rounded border p-2" required />
      <input name="priceMxn" type="number" step="0.01" placeholder="Precio MXN" className="rounded border p-2" required />
      <input name="stock" type="number" placeholder="Stock" className="rounded border p-2" defaultValue={0} />
      <select name="condition" className="rounded border p-2">
        <option value="NUEVO">Nuevo</option>
        <option value="RECUPERADO">Recuperado</option>
      </select>
      <button type="submit" className="rounded bg-black p-2 text-white">
        Guardar
      </button>
    </form>
  );
}
