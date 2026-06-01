import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [updateStockProduct, setUpdateStockProduct] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState("");
  const [reduceStockProduct, setReduceStockProduct] = useState(null);
  const [reduceAmount, setReduceAmount] = useState("");
  const [reduceLoading, setReduceLoading] = useState(false);
  const [reduceMessage, setReduceMessage] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isRoastery = user?.role === "roastery";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleUpdateStock = async (event) => {
    event.preventDefault();
    if (!updateStockProduct) {
      setProductMessage("Silakan pilih produk terlebih dahulu.");
      return;
    }
    const stockValue = Number(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      setProductMessage("Stok harus berupa angka yang valid (≥ 0).");
      return;
    }

    setProductLoading(true);
    setProductMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const productId = updateStockProduct.id || updateStockProduct._id;
      const response = await axios.put(
        `http://localhost:5000/api/products/${productId}`,
        { stock: stockValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data && response.data.success) {
        setProductMessage(`Stok berhasil diperbarui menjadi ${stockValue} kg.`);
        setNewStock("");
        setUpdateStockProduct(null);
        fetchProducts();
      } else {
        throw new Error(response.data?.message || "Gagal memperbarui stok.");
      }
    } catch (err) {
      setProductMessage(
        err.response?.data?.message || err.message || "Gagal memperbarui stok.",
      );
    } finally {
      setProductLoading(false);
    }
  };

  const handleReduceStock = async () => {
    if (!reduceStockProduct || !reduceAmount) {
      setReduceMessage("Silakan pilih produk dan masukkan jumlah pengurangan.");
      return;
    }

    const amount = Number(reduceAmount);
    if (isNaN(amount) || amount <= 0) {
      setReduceMessage("Jumlah pengurangan harus lebih dari 0.");
      return;
    }

    if (amount > reduceStockProduct.stock) {
      setReduceMessage(
        `Stok tidak boleh kurang dari 0. Stok saat ini: ${reduceStockProduct.stock} kg`,
      );
      return;
    }

    setReduceLoading(true);
    setReduceMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/products/${reduceStockProduct.id || reduceStockProduct._id}`,
        {
          stock: reduceStockProduct.stock - amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data && response.data.success) {
        setReduceMessage(`Stok berhasil dikurangi sebesar ${amount} kg.`);
        setReduceAmount("");
        setReduceStockProduct(null);
        fetchProducts();
      } else {
        throw new Error(response.data?.message || "Gagal mengurangi stok.");
      }
    } catch (err) {
      setReduceMessage(
        err.response?.data?.message || err.message || "Gagal mengurangi stok.",
      );
    } finally {
      setReduceLoading(false);
    }
  };

  const resolveComparableId = (id) => {
    if (id === undefined || id === null) return "";
    const numeric = Number(id);
    return Number.isNaN(numeric) ? String(id) : numeric;
  };

  const dedupeProductsByName = (items) => {
    if (!Array.isArray(items)) return [];

    const mapByName = new Map();

    items.forEach((item) => {
      const nameKey = String(item.name || "").trim();
      const existing = mapByName.get(nameKey);
      const currentId = resolveComparableId(item.id ?? item._id);

      if (!existing) {
        mapByName.set(nameKey, item);
        return;
      }

      const existingId = resolveComparableId(existing.id ?? existing._id);
      if (currentId > existingId) {
        mapByName.set(nameKey, item);
      }
    });

    return Array.from(mapByName.values());
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const cleanedProducts = dedupeProductsByName(response.data.data);
        setProducts(cleanedProducts);
      } else {
        setError(response.data?.message || "Gagal memuat katalog.");
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError(err.response?.data?.message || "Terjadi kesalahan koneksi.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [navigate]);

  const openCheckoutModal = (kopi) => {
    setSelectedProduct(kopi);
    setQuantity(1);
    setOrderMessage("");
    setIsModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setQuantity(1);
    setOrderMessage("");
  };

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setQuantity(Number.isNaN(value) || value < 1 ? 1 : value);
  };

  const handleCheckout = async () => {
    if (!selectedProduct) return;

    setOrderLoading(true);
    setOrderMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/transactions",
        {
          product_id: selectedProduct.id || selectedProduct._id,
          quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data && response.data.success) {
        setOrderMessage(response.data.message || "Pesanan berhasil dibuat.");

        setTimeout(() => {
          closeCheckoutModal();
          fetchProducts();
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Gagal membuat pesanan.");
      }
    } catch (err) {
      setOrderMessage(
        err.response?.data?.message || err.message || "Gagal membuat pesanan.",
      );
    } finally {
      setOrderLoading(false);
    }
  };

  const productPrice = Number(selectedProduct?.price || 0);
  const effectiveQuantity = quantity > 0 ? quantity : 1;
  const totalPrice = productPrice * effectiveQuantity;
  const hasDiscount = effectiveQuantity > 10;
  const finalPrice = totalPrice - (hasDiscount ? totalPrice * 0.1 : 0);

  return (
    // Menggunakan warna latar off-white yang hangat, bukan abu-abu dingin
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 selection:bg-amber-200">
      {/* Navbar: Transparan, minimalis, border bawah yang sangat tipis */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-stone-200/60 bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-stone-900">
            Katalog<span className="text-amber-700">.</span>
          </h1>
          {user && (
            <span className="text-sm font-medium text-stone-500 tracking-wide">
              {user.name}
              <span className="mx-2 opacity-40">•</span>
              <span className="capitalize">{user.role.replace("_", " ")}</span>
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          Keluar
        </button>
      </nav>

      {/* Main Content: Layout lebih editorial dengan padding besar */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* Header Section */}
        <header className="mb-16 max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-stone-900 mb-4">
            {isRoastery
              ? "Manajemen Stok Roastery"
              : "Eksplorasi biji kopi pilihan dari artisan lokal."}
          </h2>
          <p className="text-lg text-stone-500 leading-relaxed">
            {isRoastery
              ? "Perbarui stok produk kopi Anda agar coffee shop selalu melihat ketersediaan terkini."
              : "Temukan profil sangrai yang sesuai dengan karakter kedai Anda. Transaksi B2B transparan, langsung dari roastery."}
          </p>
        </header>

        {loading && !isRoastery && (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-stone-500 tracking-widest text-xs uppercase">
              Menyeduh Data...
            </p>
          </div>
        )}

        {error && !loading && !isRoastery && (
          <div className="p-6 bg-red-50 text-red-800 border border-red-100 rounded-2xl">
            {error}
          </div>
        )}

        {isRoastery ? (
          <div className="space-y-12">
            {/* Form Update Stok Produk */}
            <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-semibold text-stone-900 mb-2">
                Perbarui Stok Produk
              </h3>
              <p className="text-sm text-stone-500 mb-6">
                Pilih produk dari katalog, lalu tetapkan jumlah stok terbaru.
              </p>

              {loading && (
                <div className="flex items-center gap-3 py-6 opacity-60">
                  <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-stone-500 tracking-widest uppercase">
                    Memuat katalog...
                  </span>
                </div>
              )}

              {!loading && products.length === 0 && (
                <p className="text-sm text-stone-400 italic py-4">
                  Belum ada produk di katalog.
                </p>
              )}

              {!loading && products.length > 0 && (
                <form onSubmit={handleUpdateStock} className="space-y-5">
                  {/* Pilih Produk */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                      Pilih Produk
                    </label>
                    <select
                      value={
                        updateStockProduct
                          ? String(
                              updateStockProduct.id || updateStockProduct._id,
                            )
                          : ""
                      }
                      onChange={(event) => {
                        const val = event.target.value;
                        const found = products.find(
                          (p) => String(p.id || p._id) === val,
                        );
                        setUpdateStockProduct(found || null);
                        setProductMessage("");
                      }}
                      required
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((kopi) => (
                        <option
                          key={String(kopi.id || kopi._id)}
                          value={String(kopi.id || kopi._id)}
                        >
                          {kopi.name} · {kopi.origin} · {kopi.roast_level} · Rp{" "}
                          {Number(kopi.price).toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Info Produk Read-Only */}
                  {updateStockProduct && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-400">
                          Nama Produk
                        </label>
                        <input
                          type="text"
                          value={updateStockProduct.name}
                          disabled
                          className="w-full rounded-3xl border border-slate-100 bg-stone-100 px-4 py-3 text-sm text-stone-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-400">
                          Origin
                        </label>
                        <input
                          type="text"
                          value={updateStockProduct.origin}
                          disabled
                          className="w-full rounded-3xl border border-slate-100 bg-stone-100 px-4 py-3 text-sm text-stone-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-400">
                          Roast Level
                        </label>
                        <input
                          type="text"
                          value={updateStockProduct.roast_level}
                          disabled
                          className="w-full rounded-3xl border border-slate-100 bg-stone-100 px-4 py-3 text-sm text-stone-500 capitalize cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-400">
                          Harga (Read-Only)
                        </label>
                        <input
                          type="text"
                          value={`Rp ${Number(updateStockProduct.price).toLocaleString("id-ID")}`}
                          disabled
                          className="w-full rounded-3xl border border-slate-100 bg-stone-100 px-4 py-3 text-sm text-stone-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Input Stok Aktif */}
                  <div>
                    <label
                      htmlFor="newStock"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      Stok Baru (kg)
                    </label>
                    <input
                      id="newStock"
                      type="number"
                      min="0"
                      value={newStock}
                      onChange={(event) => {
                        setNewStock(event.target.value);
                        setProductMessage("");
                      }}
                      placeholder="Masukkan jumlah stok"
                      required
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                    {updateStockProduct && (
                      <p className="mt-1.5 text-xs text-stone-400 pl-2">
                        Stok saat ini: {updateStockProduct.stock} kg
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={productLoading || !updateStockProduct}
                    className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {productLoading ? "Memproses..." : "Simpan Perubahan Stok"}
                  </button>

                  {productMessage && (
                    <p
                      className={`text-sm ${productMessage.toLowerCase().includes("berhasil") ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {productMessage}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Form Kurangi Stok */}
            {products.length > 0 && (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-lg">
                <h3 className="text-2xl font-semibold text-stone-900 mb-6">
                  Kurangi Stok Produk
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700">
                      Pilih Produk
                    </label>
                    <select
                      value={
                        reduceStockProduct
                          ? String(
                              reduceStockProduct.id || reduceStockProduct._id,
                            )
                          : ""
                      }
                      onChange={(event) => {
                        const selectedId = event.target.value;
                        const selected = products.find(
                          (p) => String(p.id || p._id) === selectedId,
                        );
                        setReduceStockProduct(selected || null);
                        setReduceMessage("");
                      }}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((kopi) => (
                        <option
                          key={String(kopi.id || kopi._id)}
                          value={String(kopi.id || kopi._id)}
                        >
                          {kopi.name} • {kopi.origin} • {kopi.roast_level} • Rp{" "}
                          {Number(kopi.price).toLocaleString("id-ID")} (Stok:{" "}
                          {kopi.stock} kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  {reduceStockProduct && (
                    <div className="rounded-2xl border border-amber-300 bg-white p-4">
                      <p className="text-sm text-stone-600">
                        <span className="font-semibold">Produk:</span>{" "}
                        {reduceStockProduct.name}
                      </p>
                      <p className="text-sm text-stone-600 mt-1">
                        <span className="font-semibold">Origin:</span>{" "}
                        {reduceStockProduct.origin}
                      </p>
                      <p className="text-sm text-stone-600 mt-1">
                        <span className="font-semibold">Roast Level:</span>{" "}
                        <span className="capitalize">
                          {reduceStockProduct.roast_level}
                        </span>
                      </p>
                      <p className="text-sm text-stone-600 mt-1">
                        <span className="font-semibold">Harga:</span> Rp{" "}
                        {Number(reduceStockProduct.price).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                      <p className="text-sm text-stone-600 mt-1">
                        <span className="font-semibold">Stok Saat Ini:</span>{" "}
                        {reduceStockProduct.stock} kg
                      </p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="reduceAmount"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      Jumlah Pengurangan (kg)
                    </label>
                    <input
                      id="reduceAmount"
                      type="number"
                      min="0"
                      value={reduceAmount}
                      onChange={(event) => {
                        setReduceAmount(event.target.value);
                        setReduceMessage("");
                      }}
                      placeholder="Masukkan jumlah kg yang ingin dikurangi"
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>

                  <button
                    onClick={handleReduceStock}
                    disabled={reduceLoading || !reduceStockProduct}
                    className="w-full rounded-3xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reduceLoading ? "Memproses..." : "Kurangi Stok"}
                  </button>

                  {reduceMessage && (
                    <p
                      className={`text-sm ${reduceMessage.toLowerCase().includes("berhasil") ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {reduceMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {error && !loading && (
              <div className="p-6 bg-red-50 text-red-800 border border-red-100 rounded-2xl">
                {error}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="py-24 text-center border border-dashed border-stone-300 rounded-[2rem]">
                <p className="text-stone-400 font-serif italic text-xl">
                  Katalog sedang kosong...
                </p>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {products.map((kopi) => (
                  <div
                    key={kopi.id || kopi._id}
                    className="group cursor-pointer"
                  >
                    <div className="relative w-full aspect-[4/3] bg-stone-100 rounded-[2rem] overflow-hidden mb-6">
                      <img
                        src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=600"
                        alt="Coffee Beans"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-in-out"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#FDFBF7]/90 backdrop-blur-sm text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                          {kopi.roast_level}
                        </span>
                      </div>
                    </div>

                    <div className="px-2">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-medium text-stone-900 leading-snug">
                          {kopi.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-amber-700 font-medium">
                          {kopi.origin}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                        <span className="text-sm text-stone-500">
                          Stok: {kopi.stock} kg
                        </span>
                      </div>

                      <div className="flex justify-between items-end pt-4 border-t border-stone-200/70">
                        <div className="flex flex-col">
                          <span className="text-xs text-stone-400 uppercase tracking-widest mb-1">
                            Harga B2B
                          </span>
                          <span className="text-lg font-semibold text-stone-900">
                            Rp {Number(kopi.price).toLocaleString("id-ID")}
                          </span>
                        </div>

                        <button
                          onClick={() => openCheckoutModal(kopi)}
                          className="text-sm font-semibold border-b-2 border-stone-900 pb-0.5 text-stone-900 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                        >
                          Beli Sekarang
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200 bg-[#FDFBF7] p-8 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
                  Checkout
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-stone-900">
                  {selectedProduct.name}
                </h3>
                <p className="mt-2 text-sm text-stone-500">
                  Harga satuan: Rp {productPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={closeCheckoutModal}
                className="text-sm font-semibold text-stone-500 hover:text-stone-900"
              >
                Tutup
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  Jumlah Pesanan
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-lg text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
                <p className="text-sm text-stone-500 uppercase tracking-[0.18em] mb-4">
                  Ringkasan Pembayaran
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-stone-500">Harga asli</p>
                    <p className="mt-2 text-xl font-semibold text-stone-900">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {hasDiscount && (
                    <div className="rounded-3xl bg-amber-50 p-4 border border-amber-100">
                      <p className="text-sm font-semibold text-amber-700">
                        Diskon 10%
                      </p>
                      <p className="mt-2 text-sm text-stone-500 line-through">
                        Rp {totalPrice.toLocaleString("id-ID")}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-stone-900">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}

                  {!hasDiscount && (
                    <div>
                      <p className="text-sm text-stone-500">Total akhir</p>
                      <p className="mt-2 text-3xl font-semibold text-stone-900">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={orderLoading}
                    className="w-full rounded-3xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {orderLoading ? "Memproses..." : "Konfirmasi Pesanan"}
                  </button>

                  {orderMessage && (
                    <p
                      className={`text-sm ${orderMessage.toLowerCase().includes("berhasil") ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {orderMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
