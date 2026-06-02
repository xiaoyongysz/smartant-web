"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { AnalyticsChartVO } from "@/types/analytics";

interface AnalyticsEchartProps {
  chart: AnalyticsChartVO;
}

export function AnalyticsEchart({ chart }: AnalyticsEchartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chart.option) return;

    const instance = echarts.init(el);
    instance.setOption(chart.option as echarts.EChartsOption);

    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
    };
  }, [chart]);

  if (!chart.option) return null;

  return (
    <div className="mt-3 space-y-2">
      {chart.description && (
        <p className="text-xs text-muted-foreground">{chart.description}</p>
      )}
      <div
        ref={containerRef}
        className="h-72 w-full rounded-lg border border-border bg-background"
      />
    </div>
  );
}
