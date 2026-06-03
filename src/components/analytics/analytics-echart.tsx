"use client";

import { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import * as echarts from "echarts";
import type { AnalyticsChartVO } from "@/types/analytics";

interface AnalyticsEchartProps {
  chart: AnalyticsChartVO;
  title?: string;
}

export function AnalyticsEchart({ chart, title }: AnalyticsEchartProps) {
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

  const panelTitle = title || chart.description || "数据图表";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <TrendingUp className="size-4 text-emerald-600" />
        <h4 className="text-sm font-medium text-foreground">{panelTitle}</h4>
      </div>
      <div className="p-3">
        {chart.description && title && (
          <p className="mb-2 text-xs text-muted-foreground">{chart.description}</p>
        )}
        <div ref={containerRef} className="h-72 w-full" />
      </div>
    </div>
  );
}
