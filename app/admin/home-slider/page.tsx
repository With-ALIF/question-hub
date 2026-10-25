import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHomeSlider } from "@/components/admin/AdminHomeSlider";
import { getCurrentRole } from "@/lib/auth/roles";
import { getHomeSlideUrls } from "@/lib/home-slides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home Slider — Admin QuestionBank",
  description: "Manage the images shown in the homepage hero carousel.",
};

export default async function AdminHomeSliderPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const slides = await getHomeSlideUrls();

  return <AdminHomeSlider initialSlides={slides} role={role} />;
}
