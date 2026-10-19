import { Icon } from "@/components/icons/icon"
import { Crest } from "@/components/shared/crest"
import { Logo } from "@/components/shared/logo"
import { Pitch } from "@/components/shared/pitch"
import { TRUST } from "@/data/copy"
import { routes } from "@/routes"

type Props = {
  title: string
  text: string
}

/*
 * AmAuthPanel (js/amk-ui.jsx) + .amk-auth__panel*, css/amk-pages.css:342-358.
 * Always dark, in both themes (it uses the raw palette). Hidden at 900px and below.
 *
 * Layers, bottom to top:
 *   1 stripes   .amk-auth__stripes   am-stripes at 80% opacity
 *   2 pitch     .amk-auth__pitch     full pitch lines, bottom, 140% wide, --gf-ash
 *   3 crest     .amk-auth__crest     220px crest at 16% opacity, right edge
 *   4 content   logo, copy block, footer line (relative, above the layers)
 */
export function AuthPanel({ title, text }: Props) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col justify-between gap-8 overflow-hidden bg-gf-black p-[clamp(28px,4vw,56px)] text-gf-white le-900:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 am-stripes opacity-80"
      />
      <Pitch
        variant="full"
        className="top-auto right-[-20%] bottom-[-10%] left-[-20%] h-[70%] w-[140%] text-gf-ash"
      />
      <Logo size="lg" onPhoto className="relative" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[18%] right-[-40px] opacity-[0.16]"
      >
        <Crest size={220} />
      </span>
      <div className="relative grid max-w-[30ch] gap-[14px]">
        <h2 className="font-display text-[clamp(34px,3.8vw,52px)] leading-none font-bold tracking-[-0.03em] text-gf-white uppercase">
          {title}
        </h2>
        <p className="text-fs-16 leading-lh-relaxed text-gf-chalk">{text}</p>
        <ul className="mt-2 grid gap-[10px]">
          {TRUST.slice(0, 3).map((t) => (
            <li
              key={t.title}
              className="flex items-center gap-[10px] font-semibold text-gf-white"
            >
              <Icon name={t.icon} size={18} className="text-gf-neon" />
              {t.title}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-fs-13 text-gf-mist [&_a]:text-gf-white [&_a]:underline [&_a]:underline-offset-[3px]">
        A Golafly product · <a href={routes.site.golafly}>golafly.com</a> ·{" "}
        <a href={routes.site.travel}>Golafly Travel</a>
      </p>
    </aside>
  )
}
