import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <>{children}</>;
}
