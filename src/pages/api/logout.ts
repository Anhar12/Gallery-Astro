export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        return new Response(JSON.stringify(error.message), { status: 400 });
    }
    return new Response(JSON.stringify({ message: "Logout successful" }), { status: 200 });
};