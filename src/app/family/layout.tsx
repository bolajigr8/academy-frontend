import { AppShell } from "@/components/layout/app-shell"
import { DemoBar } from "@/components/layout/demo-bar"

/* The family area (account/ in the prototype): sidebar, tab bar and top bar. */
export default function FamilyLayout({ children }: LayoutProps<"/family">) {
  return (
    <>
      <DemoBar />
      <AppShell persona="family">{children}</AppShell>
    </>
  )
}
