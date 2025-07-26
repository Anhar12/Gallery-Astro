export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user.id;

  if (!currentUserId) {
    return new Response(JSON.stringify("You must be logged in to upload images."), {
      status: 401,
    });
  }
  const formData = await request.formData();
  const file = formData.get("image") as File;
  const name = formData.get("name") as string;
  
  if (!name) {
    return new Response(JSON.stringify("Image Name can't be empty"), {
      status: 400,
    });
  }
  
  if (!file) {
    return new Response(JSON.stringify("No image selected."), {
      status: 400,
    });
  }
  
  const fileName = `${Date.now()}_${file.name}`;
  
  const { data: storageData, error: uploadError } = await supabase
    .storage
    .from("galleries")
    .upload(fileName, file, {
      cacheControl: "86400",
      upsert: false,
    });
    
    if (uploadError) {
    return new Response(JSON.stringify(uploadError.message), {
      status: 500,
    });
  }
  
  const publicUrl = supabase
    .storage
    .from("galleries")
    .getPublicUrl(fileName).data.publicUrl;

  const { error: dbError } = await supabase.from("galleries").insert([
    {
      name: name,
      url: publicUrl,
      user_id: currentUserId,
    },
  ]);

  if (dbError) {
    return new Response(JSON.stringify(dbError.message), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({
    message: "Upload successful",
    url: publicUrl
  }), { status: 200 });
};

export const PUT: APIRoute = async ({ request }) => {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user.id;

  if (!currentUserId) {
    return new Response(JSON.stringify("You must be logged in to update images."), {
      status: 401,
    });
  }

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const file = formData.get("image") as File | null;
  const name = formData.get("name") as string;

  if (!id) {
    return new Response(JSON.stringify("No image selected for update."), { status: 400 });
  }

  if (!name) {
    return new Response(JSON.stringify("Image Name can't be empty."), { status: 400 });
  }

  try {
    if (file && file.size > 0) {
      const { data: oldData, error: fetchError } = await supabase
        .from("galleries")
        .select("url")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const oldFileName = oldData.url.split("/").pop()!;
      const { error: removeError } = await supabase
        .storage
        .from("galleries")
        .remove([oldFileName]);

      if (removeError) throw new Error(removeError.message);

      const newFileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from("galleries")
        .upload(newFileName, file, {
          cacheControl: "86400",
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const publicUrl = supabase.storage.from("galleries").getPublicUrl(newFileName).data.publicUrl;

      const { error: dbUpdateError } = await supabase
        .from("galleries")
        .update({ name, url: publicUrl, user_id: currentUserId })
        .eq("id", id);

      if (dbUpdateError) throw new Error(dbUpdateError.message);
    } 
    
    else {
      const { error: nameUpdateError } = await supabase
        .from("galleries")
        .update({ name })
        .eq("id", id);

      if (nameUpdateError) throw new Error(nameUpdateError.message);
    }

    return new Response(JSON.stringify({ message: "Update successful" }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify(err.message || "Unknown error"), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user.id;
  
  if (!currentUserId) {
    return new Response(JSON.stringify("You must be logged in to delete images."), {
      status: 401,
    });
  }

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const url = formData.get("url") as string;

  if (!id) {
    return new Response(JSON.stringify("No image selected for delete."), {
      status: 400,
    });
  }

  const { data: dbData, error: dbError } = await supabase
    .from("galleries")
    .delete()
    .eq("id", id);

  if (dbError) {
    return new Response(JSON.stringify(dbError.message), {
      status: 500,
    });
  }

  const { error: deleteError } = await supabase.storage.from("galleries").remove([
    url.split("/").pop() as string,
  ]);

  if (deleteError) {
    return new Response(JSON.stringify(deleteError.message), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({
    message: "Delete successful",
  }), { status: 200 });
};
