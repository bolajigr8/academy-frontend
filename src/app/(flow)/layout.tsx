import { DemoBar } from "@/components/layout/demo-bar"

/* Focused flows (apply.html): demo bar only. Each page renders its own flow bar and <main>. */
export default function FlowLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DemoBar />
      {children}
    </>
  )
}
