"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Mail, 
  Key, 
  User, 
  Copy, 
  Check, 
  Loader2, 
  ShieldAlert,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Operator {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export default function OperatorsManagementPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sqlMissing, setSqlMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form States
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  const sqlInstructions = `-- JALANKAN DI SUPABASE SQL EDITOR:
-- Salin dan tempel kode berikut ke SQL Editor di Supabase Dashboard Anda.

-- 1. Fungsi get_operators
create or replace function get_operators()
returns table (
  id uuid,
  email varchar,
  display_name text,
  created_at timestamptz
) 
security definer
as $$
begin
  return query
  select 
    u.id, 
    u.email::varchar, 
    (u.raw_user_meta_data->>'display_name')::text as display_name,
    u.created_at
  from auth.users u
  where u.raw_user_meta_data->>'role' = 'operator'
  order by u.created_at desc;
end;
$$ language plpgsql;

-- 2. Fungsi create_operator
create or replace function create_operator(
  p_email text,
  p_password text,
  p_display_name text
)
returns uuid
security definer
as $$
declare
  new_id uuid;
begin
  new_id := gen_random_uuid();
  
  if exists (select 1 from auth.users where email = p_email) then
    raise exception 'Email % sudah terdaftar', p_email;
  end if;

  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('role', 'operator', 'display_name', p_display_name)::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    new_id,
    new_id,
    json_build_object('sub', new_id::text, 'email', p_email)::jsonb,
    'email',
    new_id::text,
    now(),
    now(),
    now()
  );

  return new_id;
end;
$$ language plpgsql;

-- 3. Fungsi update_operator
create or replace function update_operator(
  p_user_id uuid,
  p_email text,
  p_password text,
  p_display_name text
)
returns boolean
security definer
as $$
begin
  if exists (select 1 from auth.users where email = p_email and id <> p_user_id) then
    raise exception 'Email % sudah terdaftar oleh operator lain', p_email;
  end if;

  if p_password is not null and p_password <> '' then
    update auth.users
    set 
      email = p_email,
      encrypted_password = crypt(p_password, gen_salt('bf', 10)),
      raw_user_meta_data = json_build_object('role', 'operator', 'display_name', p_display_name)::jsonb,
      updated_at = now()
    where id = p_user_id;
  else
    update auth.users
    set 
      email = p_email,
      raw_user_meta_data = json_build_object('role', 'operator', 'display_name', p_display_name)::jsonb,
      updated_at = now()
    where id = p_user_id;
  end if;

  update auth.identities
  set 
    identity_data = json_build_object('sub', p_user_id::text, 'email', p_email)::jsonb,
    updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$ language plpgsql;

-- 4. Fungsi delete_operator
create or replace function delete_operator(
  p_user_id uuid
)
returns boolean
security definer
as $$
begin
  delete from auth.identities where user_id = p_user_id;
  delete from auth.users where id = p_user_id;
  return true;
end;
$$ language plpgsql;`;

  // Fetch all operators
  const fetchOperators = async () => {
    setLoading(true);
    setSqlMissing(false);
    try {
      const { data, error } = await supabase.rpc("get_operators");
      
      if (error) {
        if (
          error.code === "PGRST501" || 
          error.code === "PGRST601" || 
          error.message?.includes("does not exist") || 
          error.message?.includes("Could not find") || 
          error.code === "42883"
        ) {
          setSqlMissing(true);
        } else {
          toast.error(`Gagal memuat operator: ${error.message}`);
        }
        return;
      }
      
      setOperators(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlInstructions);
    setCopiedSql(true);
    toast.success("Skrip SQL disalin ke clipboard!");
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Create Operator Action
  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      toast.error("Semua field wajib diisi.");
      return;
    }
    if (password.length < 4) {
      toast.error("Password/PIN minimal 4 karakter.");
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("create_operator", {
        p_email: email.trim(),
        p_password: password,
        p_display_name: displayName.trim()
      });

      if (error) {
        toast.error(error.message || "Gagal membuat operator baru.");
      } else {
        toast.success("Operator berhasil dibuat!");
        setIsAddOpen(false);
        setDisplayName("");
        setEmail("");
        setPassword("");
        fetchOperators();
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem gagal memproses permintaan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (op: Operator) => {
    setSelectedOperator(op);
    setDisplayName(op.display_name);
    setEmail(op.email);
    setPassword("");
    setIsEditOpen(true);
  };

  // Update Operator Action
  const handleEditOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;
    if (!displayName.trim() || !email.trim()) {
      toast.error("Nama dan Email wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("update_operator", {
        p_user_id: selectedOperator.id,
        p_email: email.trim(),
        p_password: password || null,
        p_display_name: displayName.trim()
      });

      if (error) {
        toast.error(error.message || "Gagal memperbarui operator.");
      } else {
        toast.success("Data operator berhasil diperbarui!");
        setIsEditOpen(false);
        setSelectedOperator(null);
        fetchOperators();
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem gagal memproses pembaruan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (op: Operator) => {
    setSelectedOperator(op);
    setIsDeleteOpen(true);
  };

  // Delete Operator Action
  const handleDeleteOperator = async () => {
    if (!selectedOperator) return;
    try {
      const { error } = await supabase.rpc("delete_operator", {
        p_user_id: selectedOperator.id
      });

      if (error) {
        toast.error(error.message || "Gagal menghapus operator.");
      } else {
        toast.success("Operator berhasil dihapus.");
        fetchOperators();
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem gagal memproses penghapusan.");
    } finally {
      setSelectedOperator(null);
    }
  };

  const filteredOperators = operators.filter(
    (op) =>
      op.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 animate-fade-in duration-200">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              Manajemen Operator
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Tambah, ubah, dan kelola otorisasi akun akses operator booth Anda di lapangan.
            </p>
          </div>
          {!sqlMissing && (
            <Button
              onClick={() => {
                setDisplayName("");
                setEmail("");
                setPassword("");
                setIsAddOpen(true);
              }}
              className="h-10 text-xs font-medium px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Operator
            </Button>
          )}
        </div>

        {/* SQL Setup Guard Container */}
        {sqlMissing ? (
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.02)] overflow-hidden">
            <CardHeader className="pb-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" /> SQL Function Diperlukan
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Sistem mendeteksi fungsi database manajemen operator belum terpasang pada instance Supabase Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-5 text-zinc-700 dark:text-zinc-300">
              
              <div className="text-xs space-y-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl ring-1 ring-inset ring-zinc-100 dark:ring-zinc-900/30">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">Langkah Pemasangan Skrip:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  <li>Buka halaman utama dashboard <strong>Supabase Console</strong> Anda.</li>
                  <li>Akses menu <strong>SQL Editor</strong> melalui bar navigasi sebelah kiri.</li>
                  <li>Buat dokumen query baru, lalu salin seluruh skrip di bawah ini ke editor.</li>
                  <li>Klik tombol <strong>Run</strong> untuk mengonfigurasi fungsi pendaftaran operator secara aman.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold tracking-wider font-mono uppercase">Kode Migrasi Postgresql</span>
                  <Button
                    onClick={handleCopySql}
                    variant="outline"
                    className="h-8 px-3 text-[11px] font-medium border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors gap-1.5"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        Salin Skrip SQL
                      </>
                    )}
                  </Button>
                </div>

                <pre className="text-[11px] font-mono p-4 bg-zinc-950 border border-zinc-900 rounded-xl overflow-x-auto text-zinc-400 max-h-[260px] leading-relaxed scrollbar-thin">
                  {sqlInstructions}
                </pre>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                  onClick={fetchOperators}
                  className="h-10 text-xs font-medium px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm w-full sm:w-auto"
                >
                  Saya Sudah Menjalankan SQL, Segarkan Halaman
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          
          /* MAIN COMPONENT: TABLE CARD CONTAINER */
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl shadow-[0_2px_12px_rgb(0,0,0,0.01)] overflow-hidden">
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Users className="w-4 h-4 text-zinc-500" /> Daftar Anggota Operator
                  </CardTitle>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:max-w-xs flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 text-xs rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 shadow-sm"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto scrollbar-thin">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500 text-xs font-medium">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-600 dark:text-zinc-400" />
                  <span>Memuat data berkas operator...</span>
                </div>
              ) : filteredOperators.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center py-16 px-4 border-dashed text-center gap-2 text-zinc-500 select-none">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 mb-1">
                    <Users className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Tidak ada operator ditemukan</p>
                  <p className="text-[11px] max-w-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                    {searchQuery ? "Kueri pencarian tidak mencocokkan data akun manapun." : "Belum ada operator terdaftar pada sistem ini."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Nama Operator</th>
                      <th className="px-6 py-3.5">Email Akses</th>
                      <th className="px-6 py-3.5">Tanggal Registrasi</th>
                      <th className="px-6 py-3.5 text-right">Manajemen Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                    {filteredOperators.map((op) => (
                      <tr key={op.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-semibold text-[10px] uppercase shrink-0 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/60 shadow-sm">
                              {op.display_name.substring(0, 2)}
                            </div>
                            <span className="text-xs font-medium">{op.display_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] align-middle">{op.email}</td>
                        <td className="px-6 py-3.5 text-zinc-400 dark:text-zinc-500 align-middle">
                          <div className="flex items-center gap-1.5 font-sans">
                            <Calendar className="w-3.5 h-3.5 opacity-80" />
                            <span>{formatDate(op.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => openEditModal(op)}
                              className="h-8 w-8 p-0 text-zinc-500 bg-zinc-50 hover:text-zinc-900 hover:bg-zinc-100/80 ring-1 ring-inset ring-zinc-200/40 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 dark:ring-zinc-800 rounded-lg transition-all active:scale-95"
                              title="Ubah Akses"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => openDeleteModal(op)}
                              className="h-8 w-8 p-0 text-red-500 bg-red-50/40 hover:text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:hover:text-red-400 dark:ring-red-900/30 rounded-lg transition-all active:scale-95"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {/* ➕ ADD OPERATOR DIALOG */}
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) setIsAddOpen(false); }}>
          <DialogContent className="max-w-sm bg-white dark:bg-zinc-950 border-none ring-1 ring-zinc-200 dark:ring-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <DialogHeader className="flex flex-col gap-1">
              <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <UserPlus className="w-4 h-4 text-zinc-500" /> Tambah Operator Baru
              </DialogTitle>
              <p className="text-xs text-zinc-500">
                Buat kredensial login akun operasional petugas penjaga booth.
              </p>
            </DialogHeader>

            <form onSubmit={handleAddOperator} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 opacity-60" /> Nama Lengkap
                </Label>
                <Input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-60" /> Email Otentikasi
                </Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@glowbooth.com"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs font-mono shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 opacity-60" /> PIN / Sandi Kata
                </Label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 digit angka/huruf"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs shadow-sm"
                />
              </div>

              <DialogFooter className="mt-2.5 flex flex-row items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 h-10 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-10 text-xs font-medium text-white dark:text-zinc-900 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Buat Akun"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ✏️ EDIT OPERATOR DIALOG */}
        <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) setIsEditOpen(false); }}>
          <DialogContent className="max-w-sm bg-white dark:bg-zinc-950 border-none ring-1 ring-zinc-200 dark:ring-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <DialogHeader className="flex flex-col gap-1">
              <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Edit className="w-4 h-4 text-zinc-500" /> Perbarui Profil Operator
              </DialogTitle>
              <p className="text-xs text-zinc-500">
                Sesuaikan informasi profil operator. Biarkan kolom kata sandi kosong jika tidak ada pergantian PIN.
              </p>
            </DialogHeader>

            <form onSubmit={handleEditOperator} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 opacity-60" /> Nama Lengkap
                </Label>
                <Input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-60" /> Email Otentikasi
                </Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@glowbooth.com"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs font-mono shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 opacity-60" /> Ganti PIN Baru (Opsional)
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tidak diubah"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 text-xs shadow-sm"
                />
              </div>

              <DialogFooter className="mt-2.5 flex flex-row items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 h-10 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-10 text-xs font-medium text-white dark:text-zinc-900 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ❌ DELETE OPERATOR CONFIRMATION */}
        <ConfirmDeleteDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedOperator(null);
          }}
          onConfirm={handleDeleteOperator}
          title="Hapus Akun Operator"
          description={`Apakah Anda yakin ingin menghapus hak otorisasi operator "${selectedOperator?.display_name || "ini"}"? Akun tersebut tidak akan dapat mengakses kembali sistem lapangan.`}
          confirmText="Ya, Hapus Akun"
          cancelText="Batal"
        />

      </div>
    </>
  );
}