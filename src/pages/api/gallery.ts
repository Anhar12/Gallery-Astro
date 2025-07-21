export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("image") as File;
  const name = formData.get("name") as string;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
    });
  }

  if (!name) {
    return new Response(JSON.stringify({ error: "No image name" }), {
      status: 400,
    });
  }

  const fileName = `${Date.now()}_${file.name}`;

  const { data: storageData, error: uploadError } = await supabase
    .storage
    .from("gallery")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
    });
  }

  const publicUrl = supabase
    .storage
    .from("gallery")
    .getPublicUrl(fileName).data.publicUrl;

  const { error: dbError } = await supabase.from("Gallery").insert([
    {
      name: name,
      url: publicUrl,
    },
  ]);

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({
    message: "Upload successful",
    url: publicUrl
  }), { status: 200 });
};

export const PUT: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const file = formData.get("image") as File | null;
  const name = formData.get("name") as string;

  if (!id) {
    return new Response(JSON.stringify({ error: "No id for update." }), { status: 400 });
  }

  if (!name) {
    return new Response(JSON.stringify({ error: "No image name." }), { status: 400 });
  }

  try {
    if (file && file.size > 0) {
      const { data: oldData, error: fetchError } = await supabase
        .from("Gallery")
        .select("url")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const oldFileName = oldData.url.split("/").pop()!;
      const { error: removeError } = await supabase
        .storage
        .from("gallery")
        .remove([oldFileName]);

      if (removeError) throw new Error(removeError.message);

      const newFileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from("gallery")
        .upload(newFileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const publicUrl = supabase.storage.from("gallery").getPublicUrl(newFileName).data.publicUrl;

      const { error: dbUpdateError } = await supabase
        .from("Gallery")
        .update({ name, url: publicUrl })
        .eq("id", id);

      if (dbUpdateError) throw new Error(dbUpdateError.message);
    } 
    
    else {
      const { error: nameUpdateError } = await supabase
        .from("Gallery")
        .update({ name })
        .eq("id", id);

      if (nameUpdateError) throw new Error(nameUpdateError.message);
    }

    return new Response(JSON.stringify({ message: "Update successful" }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const url = formData.get("url") as string;

  if (!id) {
    return new Response(JSON.stringify({ error: "No id for delete." }), {
      status: 400,
    });
  }

  const { data: dbData, error: dbError } = await supabase
    .from("Gallery")
    .delete()
    .eq("id", id);

  if (dbError) {
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
    });
  }

  const { error: deleteError } = await supabase.storage.from("gallery").remove([
    url.split("/").pop() as string,
  ]);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({
    message: "Delete successful",
  }), { status: 200 });
};
