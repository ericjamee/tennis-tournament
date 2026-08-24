"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
export async function login(formData:FormData){const db=await createSupabaseServer();const{error}=await db.auth.signInWithPassword({email:String(formData.get("email")),password:String(formData.get("password"))});if(error)redirect(`/admin?error=${encodeURIComponent("Email or password is incorrect")}`);redirect("/admin")}
export async function logout(){const db=await createSupabaseServer();await db.auth.signOut();redirect("/admin")}
