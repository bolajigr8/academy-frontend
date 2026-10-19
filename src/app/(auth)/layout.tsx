/* Sign in and register: their own minimal layout, no nav, footer or demo bar (as in the prototype). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,5fr)_minmax(0,6fr)] le-900:grid-cols-[minmax(0,1fr)]">
      {children}
    </div>
  )
}
