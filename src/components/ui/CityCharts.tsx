"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export function WeeklyTrendChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, "dark", {
      renderer: "svg",
    });

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        data: ["Reported", "Resolved", "AI Predicted"],
        textStyle: { color: "#a3a3a3", fontSize: 11 },
        bottom: 0,
      },
      grid: {
        top: "10%",
        left: "3%",
        right: "3%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          axisLine: { lineStyle: { color: "#404040" } },
          axisLabel: { color: "#a3a3a3" },
        },
      ],
      yAxis: [
        {
          type: "value",
          axisLine: { lineStyle: { color: "#404040" } },
          axisLabel: { color: "#a3a3a3" },
          splitLine: { lineStyle: { color: "#1f2937", type: "dashed" } },
        },
      ],
      series: [
        {
          name: "Reported",
          type: "bar",
          emphasis: { focus: "series" },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#3b82f6" },
              { offset: 1, color: "#1d4ed8" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: [42, 58, 69, 50, 85, 92, 74],
        },
        {
          name: "Resolved",
          type: "bar",
          emphasis: { focus: "series" },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#10b981" },
              { offset: 1, color: "#047857" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: [35, 48, 55, 45, 78, 80, 70],
        },
        {
          name: "AI Predicted",
          type: "line",
          smooth: true,
          emphasis: { focus: "series" },
          lineStyle: { width: 3, color: "#f59e0b" },
          itemStyle: { color: "#f59e0b" },
          data: [40, 50, 72, 60, 80, 95, 85],
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} className="h-64 w-full" />;
}

export function WardCompletionChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, "dark", {
      renderer: "svg",
    });

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        top: "5%",
        left: "3%",
        right: "8%",
        bottom: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#404040" } },
        axisLabel: { color: "#a3a3a3" },
        splitLine: { lineStyle: { color: "#1f2937", type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: ["Dharampeth", "Sadar", "Sitabuldi", "Laxmi Nagar", "Indora"],
        axisLine: { lineStyle: { color: "#404040" } },
        axisLabel: { color: "#a3a3a3" },
      },
      series: [
        {
          name: "Completion Rate (%)",
          type: "bar",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#8b5cf6" },
              { offset: 1, color: "#a78bfa" },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            formatter: "{c}%",
            color: "#ffffff",
            fontSize: 10,
          },
          data: [98, 94, 88, 85, 72],
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} className="h-48 w-full" />;
}

export function PredictiveHotspotChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, "dark", {
      renderer: "svg",
    });

    const option = {
      backgroundColor: "transparent",
      tooltip: {},
      radar: {
        indicator: [
          { name: "Monsoon Moisture", max: 100 },
          { name: "Traffic Congestion", max: 100 },
          { name: "Pavement Age", max: 100 },
          { name: "Citizen Reports", max: 100 },
          { name: "Historical Incidents", max: 100 },
          { name: "Utility Excavations", max: 100 },
        ],
        splitArea: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "#262626",
          },
        },
        axisLine: {
          lineStyle: {
            color: "#404040",
          },
        },
        name: {
          textStyle: {
            color: "#a3a3a3",
            fontSize: 9,
          },
        },
      },
      series: [
        {
          name: "Hotspot Factors",
          type: "radar",
          data: [
            {
              value: [85, 90, 75, 95, 80, 60],
              name: "West Zone (Dharampeth/Ambazari)",
              itemStyle: { color: "#ec4899" },
              areaStyle: {
                color: "rgba(236, 72, 153, 0.2)",
              },
            },
            {
              value: [65, 85, 95, 70, 90, 85],
              name: "Central Zone (Sitabuldi)",
              itemStyle: { color: "#f59e0b" },
              areaStyle: {
                color: "rgba(245, 158, 11, 0.2)",
              },
            },
          ],
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} className="h-56 w-full" />;
}
