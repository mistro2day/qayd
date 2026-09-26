import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";

export default async function AuthHomeRedirect() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  redirect("/login");
}
