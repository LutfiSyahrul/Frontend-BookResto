"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Edit3,
    Save,
    Eye,
    Users,
    UserCheck,
    Receipt,
    Move,
    Loader2,
    Scaling,
    SquareDashed,
    CheckCircle2,
    XCircle,
} from "lucide-react";

export default function DenahMejaPage() {
    // STATE UNTUK POP-UP KONFIRMASI HAPUS
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        id: number | null;
    }>({ isOpen: false, id: null });

    // STATE UNTUK NOTIFIKASI TOAST PREMIUM
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        message: string;
        type: "success" | "error";
    }>({ isOpen: false, message: "", type: "success" });

    // Fungsi trigger notifikasi (otomatis hilang 3 detik)
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

    const [tables, setTables] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

    const [activeArea, setActiveArea] = useState("");
    const canvasRef = useRef<HTMLDivElement>(null);

    const dbAreas = Array.from(new Set(tables.map((t) => t.area))) as string[];
    const areas = dbAreas.length > 0 ? dbAreas : ["Dari Depan", "Lantai 2"];

    useEffect(() => {
        if (areas.length > 0 && !areas.includes(activeArea))
            setActiveArea(areas[0]);
    }, [tables]);

    const fetchTables = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/tables`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();
            if (data.success) setTables(data.data);
        } catch (error) {
            console.error("Gagal menarik data meja");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    // FUNGSI TAMBAH (Mendukung Varian "Zona")
    const handleAddTable = async (shape: "rectangle" | "circle" | "zone") => {
        try {
            const token = localStorage.getItem("token");
            const isZone = shape === "zone";
            const payload = {
                name: isZone ? "AREA BARU" : `Meja Baru`,
                capacity: isZone ? 0 : 4,
                area: activeArea || "Area Utama",
                shape: shape,
                pos_x: 10,
                pos_y: 10,
                width: isZone ? 200 : shape === "circle" ? 80 : 100,
                height: isZone ? 150 : 80,
            };
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/tables`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                },
            );
            const data = await response.json();
            if (data.success) fetchTables();
        } catch (error) {
            alert("Gagal menambah elemen.");
        }
    };

    const handleUpdateTableDetails = async () => {
        if (!selectedTable) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/tables/${selectedTable.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: selectedTable.name,
                        capacity: selectedTable.capacity,
                        status: selectedTable.status,
                        area: selectedTable.area,
                        width: selectedTable.width,
                        height: selectedTable.height,
                    }),
                },
            );
            const data = await response.json();
            if (data.success) {
                showNotification(
                    "Properti elemen berhasil diperbarui!",
                    "success",
                );
            }
        } catch (error) {
            showNotification("Gagal memperbarui properti.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // TRIGGER BUKA POP-UP KONFIRMASI HAPUS
    const handleDeleteTable = (id: number) => {
        setConfirmDelete({ isOpen: true, id });
    };

    // EKSEKUSI HAPUS KE DATABASE
    const executeDeleteTable = async () => {
        const { id } = confirmDelete;
        if (!id) return;

        setConfirmDelete({ isOpen: false, id: null }); // Tutup modal instan biar smooth

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/tables/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const data = await response.json();
            if (data.success) {
                setSelectedTableId(null);
                fetchTables();
                showNotification(
                    "Elemen berhasil dihapus dari denah.",
                    "success",
                );
            }
        } catch (error) {
            showNotification("Gagal menghapus elemen.", "error");
        }
    };

    const handleSaveLayout = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const payload = tables.map((t) => ({
                id: t.id,
                pos_x: t.pos_x,
                pos_y: t.pos_y,
                width: t.width || 75,
                height: t.height || 75,
            }));
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/tables/layout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ tables: payload }),
                },
            );
            const data = await response.json();
            if (data.success) {
                showNotification(
                    "Tata letak denah berhasil disimpan!",
                    "success",
                );
            }
        } catch (error) {
            showNotification("Terjadi kesalahan sistem.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDragEnd = (tableId: number) => {
        if (!canvasRef.current) return;
        const canvasBounds = canvasRef.current.getBoundingClientRect();
        const tableNode = document.getElementById(`draggable-table-${tableId}`);
        if (!tableNode) return;

        const tableBounds = tableNode.getBoundingClientRect();
        const localX = tableBounds.left - canvasBounds.left;
        const localY = tableBounds.top - canvasBounds.top;
        const pctX = Math.min(
            Math.max((localX / canvasBounds.width) * 100, 0),
            90,
        );
        const pctY = Math.min(
            Math.max((localY / canvasBounds.height) * 100, 0),
            90,
        );

        setTables((prevTables) =>
            prevTables.map((t) =>
                t.id === tableId
                    ? { ...t, pos_x: pctX, pos_y: pctY, drag_key: Date.now() }
                    : t,
            ),
        );
    };

    const handleResizeDrag = (tableId: number, info: any) => {
        setTables((prevTables) =>
            prevTables.map((t) => {
                if (t.id === tableId) {
                    const newWidth = Math.max(
                        50,
                        (t.width || 75) + info.delta.x,
                    );
                    const newHeight = Math.max(
                        50,
                        (t.height || 75) + info.delta.y,
                    );
                    return { ...t, width: newWidth, height: newHeight };
                }
                return t;
            }),
        );
    };

    const handleLocalPropertyChange = (field: string, value: any) => {
        if (!selectedTable) return;
        setTables(
            tables.map((t) =>
                t.id === selectedTable.id ? { ...t, [field]: value } : t,
            ),
        );
    };

    const getTableColor = (status: string, isZone: boolean) => {
        if (isZone)
            return "bg-[#84746E]/5 border-[#84746E]/30 text-[#84746E]/40 border-4 border-dashed";
        switch (status) {
            case "Tersedia":
                return "bg-[#B8EDE4] border-[#1E524C] text-[#1E524C] border-2";
            case "Dipesan":
                return "bg-[#FFDBCF] border-[#6B3E2E] text-[#6B3E2E] border-2";
            case "Terisi":
                return "bg-[#50281A] border-[#50281A] text-white border-2";
            default:
                return "bg-gray-100 border-gray-300 text-gray-700 border-2";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-7xl space-y-6 p-2 md:p-6"
        >
            <div className="flex flex-col justify-between gap-4 border-b border-[#E5E1D9] pb-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1E1B18]">
                        Denah Restoran
                    </h2>
                    <p className="text-sm text-[#52443F]">
                        Pantau status operasional dan atur penempatan tamu
                        secara real-time.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsEditMode(!isEditMode);
                        setSelectedTableId(null);
                        fetchTables();
                    }}
                    className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all shadow-sm active:scale-95 ${isEditMode ? "bg-[#1E524C] text-white hover:bg-[#153B36]" : "bg-[#6B3E2E] text-white hover:bg-[#50281A]"}`}
                >
                    {isEditMode ? <Eye size={18} /> : <Edit3 size={18} />}
                    {isEditMode
                        ? "Kembali ke Operasional"
                        : "Mode Desain / CRUD"}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
                        <Loader2
                            className="animate-spin text-[#6B3E2E]"
                            size={48}
                        />
                    </div>
                )}

                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-hide">
                        {areas.map((area) => (
                            <button
                                key={area}
                                onClick={() => {
                                    setActiveArea(area);
                                    setSelectedTableId(null);
                                }}
                                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${activeArea === area ? "bg-[#50281A] text-white shadow-sm" : "text-[#52443F] hover:bg-gray-100"}`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>

                    <div className="w-full overflow-auto rounded-2xl border border-[#D6C2BC] shadow-sm">
                        <div
                            ref={canvasRef}
                            className="relative min-w-[800px] h-[650px] w-full overflow-hidden rounded-2xl border border-[#D6C2BC] bg-[#FFF8F5] shadow-inner p-6"
                            style={{
                                backgroundSize: "20px 20px",
                                backgroundImage:
                                    "linear-gradient(to right, rgba(107,62,46,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,62,46,0.03) 1px, transparent 1px)",
                            }}
                        >
                            <div className="absolute inset-0 pointer-events-none z-0">
                                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.2em] text-[#84746E]/40">
                                    UTARA
                                </span>
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.2em] text-[#84746E]/40">
                                    SELATAN
                                </span>
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold tracking-[0.2em] text-[#84746E]/40 origin-center">
                                    BARAT
                                </span>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold tracking-[0.2em] text-[#84746E]/40 origin-center">
                                    TIMUR
                                </span>
                            </div>
                            <AnimatePresence>
                                {tables
                                    .filter((t) => t.area === activeArea)
                                    .map((table) => {
                                        const isSelected =
                                            selectedTable?.id === table.id;
                                        const isZone = table.shape === "zone";
                                        const colorClass = getTableColor(
                                            table.status,
                                            isZone,
                                        );

                                        // PENGATURAN Z-INDEX KETAT!
                                        // Zona selalu z-0. Meja selalu z-10 (atau z-20 kalau diklik).
                                        const zIndexClass = isZone
                                            ? "z-0"
                                            : isSelected
                                              ? "z-20"
                                              : "z-10";
                                        const selectedRing = isSelected
                                            ? isZone
                                                ? "ring-4 ring-[#84746E]/50"
                                                : "ring-4 ring-[#6B3E2E]/40"
                                            : "";

                                        return (
                                            <motion.div
                                                id={`draggable-table-${table.id}`}
                                                key={`table-${table.id}-${table.drag_key || 0}`}
                                                drag={isEditMode}
                                                dragConstraints={canvasRef}
                                                dragMomentum={false}
                                                onDragEnd={() =>
                                                    handleDragEnd(table.id)
                                                }
                                                onPointerDown={(e) => {
                                                    // Hentikan event jika meja diklik agar zona di belakangnya tidak ikut terpilih
                                                    if (!isZone)
                                                        e.stopPropagation();
                                                    setSelectedTableId(
                                                        table.id,
                                                    );
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    left: `${table.pos_x}%`,
                                                    top: `${table.pos_y}%`,
                                                    width:
                                                        table.width ||
                                                        (isZone ? 200 : 75),
                                                    height:
                                                        table.height ||
                                                        (isZone ? 150 : 75),
                                                }}
                                                className={`flex flex-col items-center justify-center font-['Plus_Jakarta_Sans'] transition-shadow cursor-pointer select-none ${isZone ? "rounded-xl" : table.shape === "circle" ? "rounded-full shadow-md" : "rounded-xl shadow-md"} ${colorClass} ${zIndexClass} ${selectedRing}`}
                                                whileHover={{
                                                    scale: isEditMode
                                                        ? 1
                                                        : isZone
                                                          ? 1
                                                          : 1.03,
                                                }}
                                            >
                                                {/* TAMPILAN BERBEDA UNTUK ZONA VS MEJA */}
                                                {isZone ? (
                                                    <span className="text-2xl font-black tracking-widest uppercase opacity-60 text-center pointer-events-none break-words px-4">
                                                        {table.name}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="text-base font-bold tracking-tight text-center px-1 leading-tight pointer-events-none">
                                                            {table.name}
                                                        </span>
                                                        <span className="text-[10px] opacity-80 font-medium mt-1 pointer-events-none">
                                                            {table.capacity}{" "}
                                                            Kursi
                                                        </span>
                                                    </>
                                                )}

                                                {isEditMode && !isZone && (
                                                    <div className="absolute -left-2 -top-2 rounded-full bg-white p-1 shadow-md border border-gray-200">
                                                        <Move
                                                            size={12}
                                                            className="text-gray-500"
                                                        />
                                                    </div>
                                                )}

                                                {isEditMode && isSelected && (
                                                    <motion.div
                                                        drag
                                                        dragMomentum={false}
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onDrag={(e, info) =>
                                                            handleResizeDrag(
                                                                table.id,
                                                                info,
                                                            )
                                                        }
                                                        className={`absolute -right-2 -bottom-2 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white hover:scale-110 active:scale-95 transition-transform ${isZone ? "bg-[#84746E]" : "bg-[#50281A]"}`}
                                                    >
                                                        <Scaling size={12} />
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <AnimatePresence mode="wait">
                        {isEditMode ? (
                            <motion.div
                                key="editor-panel"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="rounded-2xl border border-[#D6C2BC] bg-white p-6 shadow-sm space-y-6"
                            >
                                <div>
                                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1E1B18]">
                                        Mode Desain
                                    </h3>
                                    <p className="text-xs text-[#52443F] mt-1">
                                        Pindahkan elemen atau tarik pojok bawah
                                        untuk mengatur ukuran.
                                    </p>
                                </div>

                                {/* TAMBAH 3 TOMBOL (Termasuk Area/Zona) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#84746E]">
                                        Tambah Elemen Baru
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() =>
                                                handleAddTable("rectangle")
                                            }
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#D6C2BC] bg-[#F5ECE7] py-3 text-[11px] font-semibold text-[#6B3E2E] hover:bg-[#EAE0DA] transition active:scale-95"
                                        >
                                            <Plus size={16} /> Kotak
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAddTable("circle")
                                            }
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#D6C2BC] bg-[#F5ECE7] py-3 text-[11px] font-semibold text-[#6B3E2E] hover:bg-[#EAE0DA] transition active:scale-95"
                                        >
                                            <Plus size={16} /> Bulat
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAddTable("zone")
                                            }
                                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#D6C2BC] bg-white py-3 text-[11px] font-semibold text-[#84746E] hover:bg-gray-50 transition active:scale-95"
                                        >
                                            <SquareDashed size={16} /> Zona/Area
                                        </button>
                                    </div>
                                </div>

                                {selectedTable ? (
                                    <div className="border-t border-[#E5E1D9] pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-[#50281A]">
                                                Properti{" "}
                                                {selectedTable.shape === "zone"
                                                    ? "Zona"
                                                    : "Meja"}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleDeleteTable(
                                                        selectedTable.id,
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Nama / Label
                                                </label>
                                                <input
                                                    type="text"
                                                    value={selectedTable.name}
                                                    onChange={(e) =>
                                                        handleLocalPropertyChange(
                                                            "name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] p-2.5 outline-none font-semibold focus:border-[#6B3E2E]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Lokasi Tab
                                                </label>
                                                <input
                                                    type="text"
                                                    list="area-list"
                                                    value={
                                                        selectedTable.area || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleLocalPropertyChange(
                                                            "area",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] p-2.5 outline-none font-semibold focus:border-[#6B3E2E]"
                                                />
                                                <datalist id="area-list">
                                                    {areas.map((a) => (
                                                        <option
                                                            key={a}
                                                            value={a}
                                                        />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                                                        Lebar (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="50"
                                                        value={
                                                            selectedTable.width ||
                                                            75
                                                        }
                                                        onChange={(e) =>
                                                            handleLocalPropertyChange(
                                                                "width",
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 75,
                                                            )
                                                        }
                                                        className="w-full rounded-md border border-[#D6C2BC] bg-white p-2 outline-none focus:border-[#6B3E2E] text-center font-mono text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                                                        Tinggi (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="50"
                                                        value={
                                                            selectedTable.height ||
                                                            75
                                                        }
                                                        onChange={(e) =>
                                                            handleLocalPropertyChange(
                                                                "height",
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 75,
                                                            )
                                                        }
                                                        className="w-full rounded-md border border-[#D6C2BC] bg-white p-2 outline-none focus:border-[#6B3E2E] text-center font-mono text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* Sembunyikan Kapasitas & Status jika bentuknya Zona */}
                                            {selectedTable.shape !== "zone" && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Kapasitas
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={
                                                                selectedTable.capacity
                                                            }
                                                            onChange={(e) =>
                                                                handleLocalPropertyChange(
                                                                    "capacity",
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] p-2.5 outline-none focus:border-[#6B3E2E]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Status
                                                        </label>
                                                        <select
                                                            value={
                                                                selectedTable.status
                                                            }
                                                            onChange={(e) =>
                                                                handleLocalPropertyChange(
                                                                    "status",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-[#D6C2BC] bg-[#F5ECE7] p-2.5 outline-none focus:border-[#6B3E2E] text-xs font-semibold"
                                                        >
                                                            <option value="Tersedia">
                                                                Tersedia
                                                            </option>
                                                            <option value="Dipesan">
                                                                Dipesan
                                                            </option>
                                                            <option value="Terisi">
                                                                Terisi
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={
                                                    handleUpdateTableDetails
                                                }
                                                disabled={isSaving}
                                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-[#D6C2BC] text-[#50281A] py-2.5 font-bold shadow-sm hover:bg-gray-50 transition active:scale-95 mt-2"
                                            >
                                                <Edit3 size={16} /> Perbarui
                                                Properti
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 py-8">
                                        Pilih elemen pada kanvas.
                                    </div>
                                )}

                                <button
                                    onClick={handleSaveLayout}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#50281A] text-white py-3 font-semibold shadow-md hover:bg-[#331105] transition active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2
                                            className="animate-spin"
                                            size={18}
                                        />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Simpan Tata Letak
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="operasional-panel"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="rounded-2xl border border-[#D6C2BC] bg-white p-5 shadow-sm"
                            >
                                {selectedTable &&
                                selectedTable.shape !== "zone" ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                            <div>
                                                <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1E1B18]">
                                                    {selectedTable.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-[#52443F] mt-0.5">
                                                    <Users size={14} />{" "}
                                                    Kapasitas{" "}
                                                    {selectedTable.capacity}{" "}
                                                    Orang
                                                </div>
                                            </div>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold border ${selectedTable.status === "Tersedia" ? "bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]" : "bg-[#FFEBEE] border-[#C62828] text-[#C62828]"}`}
                                            >
                                                •{" "}
                                                {selectedTable.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-sm text-[#84746E]">
                                        {selectedTable?.shape === "zone"
                                            ? "Area tidak memiliki detail operasional."
                                            : "Pilih meja untuk melihat detail."}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

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

            {/* MODAL POP-UP KONFIRMASI HAPUS */}
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
                                    Hapus Elemen?
                                </h3>
                                <p className="mt-2 text-sm text-[#52443F]">
                                    Apakah Anda yakin ingin menghapus elemen ini
                                    dari denah secara permanen? Tindakan ini
                                    tidak dapat dibatalkan.
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
                                    onClick={executeDeleteTable}
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
