import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// スクロール領域の外に表示し、表の端でも時間帯が切れないようにする。
export default function CalendarTimeTooltip({ value, label }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const leftEdge = (viewport?.offsetLeft ?? 0) + 8;
    const topEdge = (viewport?.offsetTop ?? 0) + 8;
    const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth) - 16;
    const bottomEdge = topEdge + (viewport?.height ?? window.innerHeight) - 16;
    tooltip.style.maxWidth = `${Math.min(320, rightEdge - leftEdge)}px`;
    const size = tooltip.getBoundingClientRect();
    const left = Math.max(leftEdge, Math.min(rect.left + (rect.width - size.width) / 2, rightEdge - size.width));
    const above = rect.top - size.height - 8;
    const top = above >= topEdge ? above : rect.bottom + 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(topEdge, Math.min(top, bottomEdge - size.height))}px`;

    const close = () => setOpen(false);
    const onKeyDown = (event) => { if (event.key === "Escape") close(); };
    const onPointerDown = (event) => { if (!trigger.contains(event.target)) close(); };
    // スクロールで元のセルが移動したら、古い位置の吹き出しを閉じる。
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.visualViewport?.addEventListener("resize", close);
    window.visualViewport?.addEventListener("scroll", close);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.visualViewport?.removeEventListener("resize", close);
      window.visualViewport?.removeEventListener("scroll", close);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, value]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="calendar-time-trigger symbol-box mark-☐"
        aria-label={`${label}の時間指定`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
      >
        ☐
      </button>
      {open && createPortal(
        <span ref={tooltipRef} id={id} role="tooltip" className="calendar-time-tooltip">
          {value}
        </span>,
        document.body,
      )}
    </>
  );
}
