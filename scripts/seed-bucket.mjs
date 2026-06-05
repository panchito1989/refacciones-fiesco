import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

try {
  const { error } = await supabase.storage.createBucket("productos", {
    public: true,
    fileSizeLimit: "6MB",
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log("BUCKET_OK productos (public)");
} catch (e) {
  console.error("BUCKET_FAIL", e.message);
  process.exitCode = 1;
}
