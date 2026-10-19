import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * The prototype's data table: .amk-tablewrap and .amk-table, css/amk-app.css:206-213.
 * The wrapper scrolls sideways on narrow screens; the table keeps a 560px minimum.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative overflow-x-auto rounded-md border border-border-1 bg-surface-elevated"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full min-w-[560px] border-collapse text-fs-14",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child_td]:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ ...props }: React.ComponentProps<"tr">) {
  return <tr data-slot="table-row" {...props} />
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "border-b border-border-1 bg-bg-2 px-[14px] py-3 text-left align-middle font-mono text-[11px] font-bold tracking-gf-wide text-fg-3 uppercase",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "border-b border-border-1 px-[14px] py-3 text-left align-middle [&_b]:block [&_b]:text-fs-14 [&_small]:block [&_small]:text-fs-12 [&_small]:text-fg-3 [&:not(:first-child)]:whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

/* .amk-num-col (css/amk-pages.css:266): right-aligned figures. !important in the source. */
const numberColumn = "text-right! tabular-nums whitespace-nowrap!"

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  numberColumn,
}
