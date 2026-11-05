import { useLayoutEffect, useRef } from "react";

// 表の下端（横スクロールバー）が画面内に収まる高さにする。
export default function CalendarScrollArea({ children }) {
  const areaRef = useRef(null);

  useLayoutEffect(() => {
    const area = areaRef.current;
    const controls = area.previousElementSibling;
    let frame;

    const updateHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const top = area.getBoundingClientRect().top - (viewport?.offsetTop ?? 0);
      // 小さい画面では表までページをスクロールできる最小高さを残す。
      const minimum = Math.min(180, height / 2);
      const available = Math.max(minimum, height - Math.max(top, 12) - 16);
      area.style.setProperty("--calendar-scroll-height", `${available}px`);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(scheduleUpdate);
    if (controls) observer.observe(controls);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
    };
  }, []);

  return (
    <div
      ref={areaRef}
      className="table-wrapper calendar-scroll-area"
      role="region"
      aria-label="日程カレンダー（上下左右にスクロールできます）"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
