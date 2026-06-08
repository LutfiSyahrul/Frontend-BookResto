"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    Plus,
    Edit3,
    Trash2,
    Image as ImageIcon,
    X,
    Loader2,
    CheckCircle2, 
    XCircle, 
} from "lucide-react";

export default function MenuPage() {
    const [menus, setMenus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("Semua Kategori");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [selectedMenu, setSelectedMenu] = useState<any>(null);

    // STATE UNTUK GAMBAR
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const dbCategories = Array.from(new Set(menus.map((m) => m.category)));
    const categoryOptions =
        dbCategories.length > 0
            ? dbCategories
            : ["Paket Ayam", "Gurame", "Cumi / Udang"];
    const displayCategories = ["Semua Kategori", ...categoryOptions];

    // STATE UNTUK POP-UP HAPUS & TOAST NOTIFIKASI
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        id: number | null;
    }>({ isOpen: false, id: null });
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        message: string;
        type: "success" | "error";
    }>({ isOpen: false, message: "", type: "success" });

    // FUNGSI PEMICU TOAST NOTIFICATION
    const showNotification = (
        message: string,
        type: "success" | "error" = "success",
    ) => {
        setNotification({ isOpen: true, message, type });
        setTimeout(
            () =>
                setNotification({
                    isOpen: false,
                    message: "",
                    type: "success",
                }),
            3000,
        );
    };

    const fetchMenus = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/menus`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();
            if (data.success) setMenus(data.data);
        } catch (error) {
            console.error("Gagal menarik data menu", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    const filteredMenus = menus.filter((menu) => {
        const matchCategory =
            activeCategory === "Semua Kategori" ||
            menu.category === activeCategory;
        const matchSearch =
            menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            menu.desc.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
    const paginatedMenus = filteredMenus.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const generatePagination = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(
                    1,
                    "...",
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages,
                );
            } else {
                pages.push(
                    1,
                    "...",
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    "...",
                    totalPages,
                );
            }
        }
        return pages;
    };

    const handleToggleAvailability = async (id: number) => {
        const previousMenus = [...menus];
        setMenus(
            menus.map((menu) =>
                menu.id === id
                    ? { ...menu, isAvailable: !menu.isAvailable }
                    : menu,
            ),
        );
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/menus/${id}/toggle`,
                {
                    method: "PATCH",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();
            if (!data.success) setMenus(previousMenus);
        } catch (error) {
            setMenus(previousMenus);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Hapus menu ini? Data tidak dapat dikembalikan."))
            return;
        const previousMenus = [...menus];
        setMenus(menus.filter((m) => m.id !== id));
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/menus/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();
            if (!data.success) setMenus(previousMenus);
        } catch (error) {
            setMenus(previousMenus);
        }
    }; // TRIGGER BUKA POP-UP KONFIRMASI HAPUS
    const handleDeleteClick = (id: number) => {
        setConfirmDelete({ isOpen: true, id });
    };

    // EKSEKUSI HAPUS KE DATABASE
    const executeDelete = async () => {
        const { id } = confirmDelete;
        if (!id) return;

        setConfirmDelete({ isOpen: false, id: null }); // Tutup modal instan
        const previousMenus = [...menus];
        setMenus(menus.filter((m) => m.id !== id));

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/menus/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();
            if (!data.success) {
                setMenus(previousMenus);
                showNotification("Gagal menghapus menu dari server.", "error");
            } else {
                showNotification(
                    "Menu berhasil dihapus secara permanen.",
                    "success",
                );
            }
        } catch (error) {
            setMenus(previousMenus);
            showNotification("Terjadi kesalahan sistem.", "error");
        }
    };

    // HANDLE UPLOAD FOTO KE STATE LOKAL
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); // Buat URL preview sementara
        }
    };

    // HANDLE SIMPAN DATA (MENGGUNAKAN FORM DATA)
    const handleSaveMenu = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const url =
                modalMode === "add"
                    ? `${process.env.NEXT_PUBLIC_API_URL}/admin/menus`
                    : `${process.env.NEXT_PUBLIC_API_URL}/admin/menus/${selectedMenu.id}`;

            // WAJIB MENGGUNAKAN FormData UNTUK MENGIRIM GAMBAR
            const formData = new FormData();
            formData.append("name", selectedMenu.name);
            formData.append("desc", selectedMenu.desc);
            formData.append("category", selectedMenu.category);
            formData.append("price", selectedMenu.price.toString());

            if (imageFile) {
                formData.append("image", imageFile);
            }

            // Trik Laravel: Kita selalu POST, tapi tambahkan _method=PUT jika mode edit
            if (modalMode === "edit") {
                formData.append("_method", "PUT");
            }

            const response = await fetch(url, {
                method: "POST", // Selalu POST karena FormData
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: formData, // Jangan di JSON.stringify!
            });

            const data = await response.json();
            if (data.success) {
                setIsModalOpen(false);
                fetchMenus(); // Refresh untuk mendapatkan gambar baru dari server

                // NOTIFIKASI SUKSES
                showNotification(
                    modalMode === "add"
                        ? "Menu baru berhasil ditambahkan!"
                        : "Detail menu berhasil diperbarui!",
                    "success",
                );
            } else {
                // GANTI ALERT JADUL
                showNotification(
                    data.message || "Gagal menyimpan menu.",
                    "error",
                );
            }
        } catch (error) {
            // GANTI ALERT JADUL
            showNotification("Gagal menghubungi server.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const openAddModal = () => {
        setModalMode("add");
        setSelectedMenu({
            name: "",
            desc: "",
            category: categoryOptions[0],
            price: 0,
        });
        setImageFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (menu: any) => {
        setModalMode("edit");
        setSelectedMenu({ ...menu });
        setImageFile(null);
        // Tampilkan gambar asli dari database sebagai preview awal
        setImagePreview(
            menu.image && menu.image.length > 4
                ? `${process.env.NEXT_PUBLIC_API_URL}${menu.image}`
                : null,
        );
        setIsModalOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-6xl space-y-6"
        >
            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl bg-[#FFF8F5] p-6 shadow-sm border border-[#E9E1DC]">
                <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                        Kelola Menu
                    </h2>
                    <p className="mt-1 text-sm text-[#52443F]">
                        Atur hidangan, harga, dan ketersediaan menu restoran
                        Anda.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#50281A] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#331105] active:scale-95"
                >
                    <Plus size={18} /> Tambah Menu Baru
                </button>
            </div>

            {/* FILTER & TAB */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-72">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84746E]"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Cari menu, deskripsi..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full rounded-xl border border-[#D6C2BC] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#6B3E2E] focus:ring-2 focus:ring-[#6B3E2E]/20"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                    {displayCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                setCurrentPage(1);
                            }}
                            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${activeCategory === cat ? "bg-[#50281A] text-white" : "bg-[#F5ECE7] text-[#52443F] hover:bg-[#EAE0DA]"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABEL LIST MENU */}
            <div className="overflow-hidden rounded-2xl border border-[#D6C2BC] bg-white shadow-sm relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                        <Loader2
                            className="animate-spin text-[#6B3E2E]"
                            size={40}
                        />
                    </div>
                )}

                <div className="hidden grid-cols-12 border-b border-[#D6C2BC] bg-[#FFF8F5] px-6 py-4 text-xs font-bold tracking-wider text-[#84746E] uppercase md:grid">
                    <div className="col-span-5">Nama Menu</div>
                    <div className="col-span-2">Kategori</div>
                    <div className="col-span-2">Harga</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-right">Aksi</div>
                </div>

                <div className="divide-y divide-[#E9E1DC]">
                    <AnimatePresence mode="popLayout">
                        {paginatedMenus.length > 0
                            ? paginatedMenus.map((menu) => (
                                  <motion.div
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ duration: 0.2 }}
                                      key={menu.id}
                                      className="flex flex-col gap-3 p-4 transition hover:bg-gray-50 md:grid md:grid-cols-12 md:px-6 md:py-4 items-stretch md:items-center"
                                  >
                                      <div className="col-span-5 flex gap-4">
                                          <div className="flex h-16 w-16 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-[#F5ECE7] text-3xl shadow-sm border border-[#E9E1DC]">
                                              {menu.image &&
                                              menu.image.length > 4 ? (
                                                  <img
                                                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${menu.image}`} // URL dari backend Laravel
                                                      alt={menu.name}
                                                      className="h-full w-full object-cover text-[10px] text-center text-gray-400"
                                                      onError={(e) => {
                                                          e.currentTarget.src =
                                                              "https://via.placeholder.com/150?text=No+Image";
                                                      }}
                                                  />
                                              ) : (
                                                  <span>
                                                      {menu.image || "🍲"}
                                                  </span>
                                              )}
                                          </div>

                                          <div className="flex flex-col justify-center">
                                              <h3
                                                  className={`font-semibold ${!menu.isAvailable ? "text-gray-400" : "text-[#1E1B18]"}`}
                                              >
                                                  {menu.name}
                                              </h3>
                                              <p className="line-clamp-2 text-xs text-[#84746E] mt-0.5 max-w-[280px]">
                                                  {menu.desc}
                                              </p>
                                          </div>
                                      </div>

                                      <div className="col-span-2 max-md:hidden">
                                          <span className="rounded-md bg-[#E9E1DC] px-2.5 py-1 text-xs font-semibold text-[#52443F]">
                                              {menu.category}
                                          </span>
                                      </div>
                                      <div className="col-span-2 text-sm font-semibold text-[#50281A] max-md:hidden">
                                          Rp{" "}
                                          {menu.price.toLocaleString("id-ID")}
                                      </div>

                                      <div className="flex items-center justify-between text-sm md:hidden border-t border-gray-100 pt-3">
                                          <span className="font-semibold text-[#50281A]">
                                              Rp{" "}
                                              {menu.price.toLocaleString(
                                                  "id-ID",
                                              )}
                                          </span>
                                          <span className="rounded-md bg-[#E9E1DC] px-2.5 py-1 text-xs font-semibold text-[#52443F]">
                                              {menu.category}
                                          </span>
                                      </div>

                                      <div className="col-span-2 flex flex-col items-center justify-center max-md:flex-row max-md:justify-between max-md:border-t max-md:border-gray-100 max-md:pt-3">
                                          <span className="text-xs font-semibold text-gray-500 md:hidden">
                                              Tersedia:
                                          </span>
                                          <button
                                              onClick={() =>
                                                  handleToggleAvailability(
                                                      menu.id,
                                                  )
                                              }
                                              className={`relative flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${menu.isAvailable ? "bg-[#50281A]" : "bg-gray-300"}`}
                                          >
                                              <motion.div
                                                  className="absolute h-5 w-5 rounded-full bg-white shadow-sm"
                                                  animate={{
                                                      x: menu.isAvailable
                                                          ? 22
                                                          : 2,
                                                  }}
                                                  transition={{
                                                      type: "spring",
                                                      stiffness: 500,
                                                      damping: 30,
                                                  }}
                                              />
                                          </button>
                                          {!menu.isAvailable && (
                                              <span className="text-[10px] font-bold text-red-500 mt-1 hidden md:block">
                                                  Stok habis
                                              </span>
                                          )}
                                      </div>

                                      {/* CLASSNAME UNTUK TOMBOL AKSI INI*/}
                                      <div className="col-span-1 flex items-center justify-end gap-2 max-md:justify-end max-md:border-t max-md:border-gray-100 max-md:pt-2">
                                          <button
                                              onClick={() =>
                                                  openEditModal(menu)
                                              }
                                              className="rounded-lg p-2 text-[#84746E] transition hover:bg-[#F5ECE7] hover:text-[#50281A]"
                                              title="Edit Menu"
                                          >
                                              <Edit3 size={18} />
                                          </button>
                                          <button
                                              onClick={() =>
                                                  handleDeleteClick(menu.id)
                                              }
                                              className="rounded-lg p-2 text-[#84746E] transition hover:bg-red-50 hover:text-red-600"
                                              title="Hapus Menu"
                                          >
                                              <Trash2 size={18} />
                                          </button>
                                      </div>
                                  </motion.div>
                              ))
                            : !isLoading && (
                                  <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="py-16 text-center text-sm text-[#84746E]"
                                  >
                                      Tidak ada menu yang sesuai dengan
                                      pencarian Anda.
                                  </motion.div>
                              )}
                    </AnimatePresence>
                </div>

                {/* PAGINATION INTERAKTIF */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#D6C2BC] px-6 py-4 bg-[#FFF8F5]">
                    <span className="text-sm font-medium text-[#52443F]">
                        Menampilkan{" "}
                        {filteredMenus.length === 0
                            ? 0
                            : (currentPage - 1) * itemsPerPage + 1}
                        -
                        {Math.min(
                            currentPage * itemsPerPage,
                            filteredMenus.length,
                        )}{" "}
                        dari {filteredMenus.length} menu
                    </span>
                    <div className="flex items-center gap-1.5 mt-4 sm:mt-0">
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            disabled={currentPage === 1 || isLoading}
                            className="p-1.5 rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-white disabled:opacity-50"
                        >
                            &lt;
                        </button>

                        {generatePagination().map((page, i) => (
                            <button
                                key={i}
                                onClick={() =>
                                    typeof page === "number" &&
                                    setCurrentPage(page)
                                }
                                disabled={page === "..." || isLoading}
                                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition disabled:opacity-50 ${currentPage === page ? "bg-[#50281A] text-white shadow-md" : page === "..." ? "bg-transparent text-gray-400 cursor-default" : "text-[#50281A] hover:bg-white border border-transparent hover:border-[#D6C2BC]"}`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(p + 1, totalPages),
                                )
                            }
                            disabled={
                                currentPage === totalPages ||
                                totalPages === 0 ||
                                isLoading
                            }
                            className="p-1.5 rounded-md border border-[#D6C2BC] text-[#50281A] hover:bg-white disabled:opacity-50"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL POP-UP CRUD DENGAN UPLOAD FOTO */}
            <AnimatePresence>
                {isModalOpen && selectedMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 z-40 bg-[#1E1B18]/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl p-6"
                        >
                            <div className="flex items-center justify-between border-b border-[#E9E1DC] pb-4 mb-6">
                                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                    {modalMode === "add"
                                        ? "Tambah Menu Baru"
                                        : "Edit Detail Menu"}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form
                                onSubmit={handleSaveMenu}
                                className="space-y-4"
                            >
                                {/* UPLOAD FOTO AREA */}
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="relative flex h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-[#D6C2BC] bg-[#FFF8F5] transition hover:bg-[#F5ECE7]"
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAE0DA] text-[#6B3E2E]">
                                                <ImageIcon size={24} />
                                            </div>
                                            <span className="text-xs font-semibold text-[#84746E]">
                                                Klik untuk unggah foto (Maks
                                                2MB)
                                            </span>
                                        </>
                                    )}
                                    {/* Input file yang disembunyikan */}
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-[#84746E]">
                                        Nama Menu
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={selectedMenu.name}
                                        onChange={(e) =>
                                            setSelectedMenu({
                                                ...selectedMenu,
                                                name: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#D6C2BC] bg-gray-50 p-2.5 outline-none focus:border-[#6B3E2E] focus:bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-[#84746E]">
                                            Kategori
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            list="category-list"
                                            value={selectedMenu.category}
                                            onChange={(e) =>
                                                setSelectedMenu({
                                                    ...selectedMenu,
                                                    category: e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-lg border border-[#D6C2BC] bg-gray-50 p-2.5 text-sm outline-none focus:border-[#6B3E2E] focus:bg-white"
                                        />
                                        <datalist id="category-list">
                                            {categoryOptions.map((cat) => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-[#84746E]">
                                            Harga (Rp)
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            value={selectedMenu.price}
                                            onChange={(e) =>
                                                setSelectedMenu({
                                                    ...selectedMenu,
                                                    price: Number(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            className="mt-1 w-full rounded-lg border border-[#D6C2BC] bg-gray-50 p-2.5 outline-none focus:border-[#6B3E2E] focus:bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-[#84746E]">
                                        Deskripsi Singkat
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={selectedMenu.desc}
                                        onChange={(e) =>
                                            setSelectedMenu({
                                                ...selectedMenu,
                                                desc: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#D6C2BC] bg-gray-50 p-2.5 text-sm outline-none focus:border-[#6B3E2E] focus:bg-white resize-none"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSaving}
                                        className="w-full rounded-xl border border-[#D6C2BC] bg-white py-3 font-semibold text-[#52443F] hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#50281A] py-3 font-semibold text-white shadow-md hover:bg-[#331105] transition active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Loader2
                                                className="animate-spin"
                                                size={18}
                                            />
                                        ) : modalMode === "add" ? (
                                            "Simpan Menu Baru"
                                        ) : (
                                            "Perbarui Menu"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* TOAST NOTIFICATION PREMIUM (MELAYANG DI ATAS) */}
            <AnimatePresence>
                {notification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-5 py-3 shadow-2xl ring-1 ring-black/5 backdrop-blur-md"
                    >
                        {notification.type === "success" ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                                <CheckCircle2 size={18} />
                            </div>
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFEBEE] text-[#C62828]">
                                <XCircle size={18} />
                            </div>
                        )}
                        <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#1E1B18]">
                            {notification.message}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL POP-UP KONFIRMASI HAPUS MENU */}
            <AnimatePresence>
                {confirmDelete.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="p-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFEBEE] text-[#C62828]">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                    Hapus Menu Ini?
                                </h3>
                                <p className="mt-2 text-sm text-[#52443F]">
                                    Data menu yang dihapus tidak dapat
                                    dikembalikan lagi. Apakah Anda yakin ingin
                                    melanjutkan?
                                </p>
                            </div>

                            <div className="flex gap-3 bg-[#F5ECE7] p-5">
                                <button
                                    onClick={() =>
                                        setConfirmDelete({
                                            isOpen: false,
                                            id: null,
                                        })
                                    }
                                    className="w-full rounded-xl border border-[#D6C2BC] bg-white py-3 text-sm font-bold text-[#52443F] transition hover:bg-[#EAE0DA]"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="w-full rounded-xl bg-[#C62828] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b71c1c]"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
