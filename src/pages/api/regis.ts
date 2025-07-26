export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email-regis") as string;
    const name = formData.get("full_name") as string;
    const password = formData.get("password-regis") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (!email || !name || !password || !confirmPassword) {
        return new Response(JSON.stringify("All fields are required"), { status: 400 });
    }

    if (password !== confirmPassword) {
        return new Response(JSON.stringify("Passwords do not match"), { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return new Response(JSON.stringify(error.message), { status: 400 });
    }

    const user = data.user;

    if (!user) {
        return new Response(JSON.stringify("User not returned."), { status: 400 });
    }

    const { error: profileError } = await supabase.from('user').insert({
        id: user.id,
        full_name: name
    });

    if (profileError) {
        return new Response(JSON.stringify(profileError.message), { status: 400 });
    }

    return new Response(JSON.stringify({ message: "Registration successful" }), { status: 200 });
};