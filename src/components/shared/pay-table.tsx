import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  numberColumn,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DATES } from "@/data/catalog"
import { fmtEuro } from "@/features/academies/search"
import type { PaymentRow } from "@/features/applications/payments"
import { cn } from "@/lib/utils"

import { StatusPill } from "./status-pill"
import { Tag } from "./tag"

type Props = {
  items: PaymentRow[]
  /** today as YYYY-MM-DD, to tell "Due now" from "Due soon" */
  today: string
  /** adds the Application column (the academy's list across applications) */
  showApp?: boolean
  /** adds a Pay button to each unpaid item (the family side) */
  onPay?: (item: PaymentRow) => void
}

/* AmPayTable: js/amk-shell.jsx. Status words and tones are the prototype's. */
export function PayTable({ items, today, showApp = false, onPay }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showApp ? <TableHead scope="col">Application</TableHead> : null}
          <TableHead scope="col">Payment</TableHead>
          <TableHead scope="col">Due</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className={numberColumn}>
            Amount
          </TableHead>
          {onPay ? (
            <TableHead scope="col">
              <span className="am-sr">Action</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => {
          const paid = it.status === "paid"
          const dueNow = it.due <= today
          return (
            <TableRow key={`${it.appId}${it.id}`}>
              {showApp ? (
                <TableCell>
                  <b>{it.program}</b>
                  <small>{it.who}</small>
                </TableCell>
              ) : null}
              <TableCell>
                {it.label}
                {it.required && !paid ? (
                  <Tag mono className="ml-2">
                    Confirms place
                  </Tag>
                ) : null}
              </TableCell>
              <TableCell>
                {paid && it.paidAt
                  ? `Paid ${DATES.fmt(it.paidAt)}`
                  : DATES.fmt(it.due)}
              </TableCell>
              <TableCell>
                <StatusPill
                  tone={
                    paid
                      ? "success"
                      : it.required || dueNow
                        ? "warning"
                        : "ghost"
                  }
                >
                  {paid
                    ? "Paid"
                    : dueNow
                      ? "Due now"
                      : it.required
                        ? "Due soon"
                        : "Upcoming"}
                </StatusPill>
              </TableCell>
              <TableCell className={cn(numberColumn)}>
                {fmtEuro(it.amount)}
              </TableCell>
              {onPay ? (
                <TableCell className={numberColumn}>
                  {!paid ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onPay(it)}
                    >
                      Pay
                    </Button>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
