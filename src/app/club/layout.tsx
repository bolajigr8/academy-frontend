import { AppShell } from "@/components/layout/app-shell"
import { DemoBar } from "@/components/layout/demo-bar"

/* The club area (host/ in the prototype): sidebar, tab bar and top bar. */
export default function ClubLayout({ children }: LayoutProps<"/club">) {
  return (
    <>
      <DemoBar />
      <AppShell persona="club">{children}</AppShell>
    </>
  )
}
