"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/auth/roles";
import { saveHomeSlideUrls } from "@/lib/home-slides";

export type SaveHomeSlidesResult = {
  success: boolean;
  error?: string;
};

export async function saveHomeSlidesAction(
  urls: string[],
): Promise<SaveHomeSlidesResult> {
  const role = await getCurrentRole();

  if (!role) {
    return {
      success: false,
      error: "Your session has expired. Please sign in again.",
    };
  }

  if (!Array.isArray(urls) || urls.some((url) => typeof url !== "string")) {
    return { success: false, error: "Invalid slide data. Please try again." };
  }

  try {
    await saveHomeSlideUrls(urls);
    revalidatePath("/");
    revalidatePath("/admin/home-slider");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save the homepage slides.",
    };
  }
}
