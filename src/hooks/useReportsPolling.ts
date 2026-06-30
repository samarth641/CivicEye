"use client";

import { useEffect } from "react";
import { useMapStore } from "@/lib/store";

const POLL_INTERVAL_MS = 30_000;

/**
 * Polls /api/reports and /api/news periodically to refresh markers.
 * Replace with Socket.io or Supabase Realtime for true real-time updates.
 */
export function useReportsPolling() {
  const setReports = useMapStore((s) => s.setReports);
  const setNews = useMapStore((s) => s.setNews);
  const setMissingPersons = useMapStore((s) => s.setMissingPersons);

  useEffect(() => {
    const fetchReports = () => {
      fetch("/api/reports")
        .then((res) => (res.ok ? res.json() : []))
        .then(setReports)
        .catch(() => setReports([]));
    };
    const fetchNews = () => {
      fetch("/api/news")
        .then((res) => (res.ok ? res.json() : []))
        .then(setNews)
        .catch(() => setNews([]));
    };
    const fetchMissingPersons = () => {
      fetch("/api/missing-persons")
        .then((res) => (res.ok ? res.json() : []))
        .then(setMissingPersons)
        .catch(() => setMissingPersons([]));
    };

    fetchReports();
    fetchNews();
    fetchMissingPersons();
    const id = setInterval(() => {
      fetchReports();
      fetchNews();
      fetchMissingPersons();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [setReports, setNews, setMissingPersons]);
}
