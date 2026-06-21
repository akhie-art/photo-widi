"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { Operator } from "./types";
import SqlSetupGuard from "./components/SqlSetupGuard";
import OperatorTable from "./components/OperatorTable";
import OperatorFormModal from "./components/OperatorFormModal";

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
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

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
  const handleAddOperatorSubmit = async (data: { displayName: string; email: string; password?: string }) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("create_operator", {
        p_email: data.email,
        p_password: data.password || "",
        p_display_name: data.displayName,
      });

      if (error) {
        toast.error(error.message || "Gagal membuat operator baru.");
      } else {
        toast.success("Operator berhasil dibuat!");
        setIsAddOpen(false);
        fetchOperators();
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem gagal memproses permintaan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Operator Action
  const handleEditOperatorSubmit = async (data: { displayName: string; email: string; password?: string }) => {
    if (!selectedOperator) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("update_operator", {
        p_user_id: selectedOperator.id,
        p_email: data.email,
        p_password: data.password || null,
        p_display_name: data.displayName,
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

  // Delete Operator Action
  const handleDeleteOperator = async () => {
    if (!selectedOperator) return;
    try {
      const { error } = await supabase.rpc("delete_operator", {
        p_user_id: selectedOperator.id,
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
      setIsDeleteOpen(false);
    }
  };

  return (
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
              setSelectedOperator(null);
              setIsAddOpen(true);
            }}
            className="h-10 text-xs font-medium px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 border-none"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Operator
          </Button>
        )}
      </div>

      {sqlMissing ? (
        <SqlSetupGuard
          sqlInstructions={sqlInstructions}
          copiedSql={copiedSql}
          onCopySql={handleCopySql}
          onRetry={fetchOperators}
        />
      ) : (
        <OperatorTable
          loading={loading}
          operators={operators}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onEdit={(op) => {
            setSelectedOperator(op);
            setIsEditOpen(true);
          }}
          onDelete={(op) => {
            setSelectedOperator(op);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Add Operator Form Modal */}
      <OperatorFormModal
        isOpen={isAddOpen}
        mode="add"
        actionLoading={actionLoading}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddOperatorSubmit}
      />

      {/* Edit Operator Form Modal */}
      <OperatorFormModal
        isOpen={isEditOpen}
        mode="edit"
        initialData={selectedOperator}
        actionLoading={actionLoading}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedOperator(null);
        }}
        onSubmit={handleEditOperatorSubmit}
      />

      {/* Delete Operator Confirmation Dialog */}
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
  );
}