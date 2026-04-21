"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, addMonths, differenceInCalendarDays, isSameMonth, isAfter, isBefore } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  allowFuture?: boolean
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  allowFuture = true,
}: DateRangePickerProps) {
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const update = () => setIsDesktop(mediaQuery.matches)

    update()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update)
      return () => mediaQuery.removeEventListener("change", update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return (
    <div className={cn("grid w-full gap-2 sm:w-auto", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full min-w-0 justify-start text-left font-normal text-xs sm:text-sm sm:w-[260px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, isDesktop ? "LLL dd, y" : "MMM d")} –{" "}
                  {format(date.to, isDesktop ? "LLL dd, y" : "MMM d, y")}
                </>
              ) : (
                format(date.from, isDesktop ? "LLL dd, y" : "MMM d, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[calc(100vw-1rem)] p-0" align={isDesktop ? "end" : "center"}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={isDesktop ? 2 : 1}
            disabled={!allowFuture ? { after: new Date() } : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
