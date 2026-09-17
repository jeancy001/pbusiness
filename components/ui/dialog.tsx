"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// ============================================================
// PB-PAY BRAND
// ============================================================

const PB_PAY_GREEN = "#064E3B"
const PB_PAY_GREEN_HOVER = "#053D2E"

// ============================================================
// DIALOG ROOT
// ============================================================

function Dialog({
  ...props
}: DialogPrimitive.Root.Props) {
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      {...props}
    />
  )
}

// ============================================================
// DIALOG TRIGGER
// ============================================================

function DialogTrigger({
  ...props
}: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
    />
  )
}

// ============================================================
// DIALOG PORTAL
// ============================================================

function DialogPortal({
  ...props
}: DialogPrimitive.Portal.Props) {
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      {...props}
    />
  )
}

// ============================================================
// DIALOG CLOSE
// ============================================================

function DialogClose({
  ...props
}: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    />
  )
}

// ============================================================
// DIALOG OVERLAY
// ============================================================

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        `
          fixed
          inset-0
          isolate
          z-50
          bg-black/20
          duration-100
          supports-backdrop-filter:backdrop-blur-xs
          data-open:animate-in
          data-open:fade-in-0
          data-closed:animate-out
          data-closed:fade-out-0
        `,
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// DIALOG CONTENT
// ============================================================

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />

      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          `
            fixed
            top-1/2
            left-1/2
            z-50
            grid
            w-full
            max-w-[calc(100%-2rem)]
            -translate-x-1/2
            -translate-y-1/2
            gap-4
            rounded-xl
            border
            border-[#064E3B]/15
            bg-popover
            p-4
            text-sm
            text-popover-foreground
            shadow-xl
            ring-1
            ring-[#064E3B]/10
            duration-100
            outline-none

            sm:max-w-sm

            data-open:animate-in
            data-open:fade-in-0
            data-open:zoom-in-95
            data-closed:animate-out
            data-closed:fade-out-0
            data-closed:zoom-out-95

            dark:border-emerald-900/50
            dark:ring-emerald-900/20
          `,
          className,
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="
                  absolute
                  top-2
                  right-2
                  text-muted-foreground
                  transition-colors
                  hover:bg-[#064E3B]/10
                  hover:text-[#064E3B]
                  focus-visible:border-[#064E3B]
                  focus-visible:ring-[#064E3B]/30

                  dark:hover:bg-emerald-950/40
                  dark:hover:text-emerald-400
                  dark:focus-visible:border-emerald-700
                  dark:focus-visible:ring-emerald-700/30
                "
                size="icon-sm"
              />
            }
          >
            <XIcon className="size-4" />

            <span className="sr-only">
              Close
            </span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

// ============================================================
// DIALOG HEADER
// ============================================================

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2",
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// DIALOG FOOTER
// ============================================================

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        `
          -mx-4
          -mb-4
          flex
          flex-col-reverse
          gap-2
          rounded-b-xl
          border-t
          border-[#064E3B]/10
          bg-[#064E3B]/5
          p-4
          sm:flex-row
          sm:justify-end

          dark:border-emerald-900/40
          dark:bg-emerald-950/20
        `,
        className,
      )}
      {...props}
    >
      {children}

      {showCloseButton && (
        <DialogPrimitive.Close
          render={
            <Button
              variant="outline"
              className="
                border-[#064E3B]/30
                text-[#064E3B]
                hover:border-[#064E3B]
                hover:bg-[#064E3B]
                hover:text-white

                dark:border-emerald-800
                dark:text-emerald-400
                dark:hover:bg-[#064E3B]
                dark:hover:text-white
              "
            />
          }
        >
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

// ============================================================
// DIALOG TITLE
// ============================================================

function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        `
          font-heading
          text-base
          leading-none
          font-medium
          text-foreground
        `,
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// DIALOG DESCRIPTION
// ============================================================

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        `
          text-sm
          text-muted-foreground
          *:[a]:underline
          *:[a]:underline-offset-3
          *:[a]:hover:text-[#064E3B]

          dark:*:[a]:hover:text-emerald-400
        `,
        className,
      )}
      {...props}
    />
  )
}

// ============================================================
// EXPORTS
// ============================================================

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}