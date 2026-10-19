import { SampleDataNotice } from "@/components/shared/sample-data-notice"
import { DemoBar } from "@/components/layout/demo-bar"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteNav } from "@/components/layout/site-nav"

/* Public pages: demo bar, nav, page, footer. Pages render their own sections inside <main>. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DemoBar />
      <SiteNav />
      <main id="main">
        <SampleDataNotice className="am-container mt-4" />
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
