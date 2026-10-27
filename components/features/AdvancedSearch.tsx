"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";

const POPULAR_SEARCHES = [
  "Revision notes",
  "Past papers",
  "Mathematics",
  "Computer studies",
  "Business studies",
  "Science",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
];

const CATEGORIES = [
  "Mathematics",
  "Science",
  "Computer Studies",
  "Business Studies",
  "Languages",
  "Revision Notes",
  "Past Papers",
  "Other",
];

const RECENT_SEARCHES_KEY = "edumarket_recent_searches";

export default function AdvancedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "",
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") ?? "newest",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setSort(searchParams.get("sort") ?? "newest");
  }, [searchParams]);

  const saveSearch = useCallback((value: string) => {
    const normalized = value.trim();

    if (!normalized) return;

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      const previous = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];

      const updated = [
        normalized,
        ...previous.filter(
          (item) => item.toLowerCase() !== normalized.toLowerCase(),
        ),
      ].slice(0, 6);

      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(updated),
      );

      setRecentSearches(updated);
    } catch {
      // Searching remains available if local storage is disabled.
    }
  }, []);

  const submitSearch = useCallback(
    (searchTerm = query) => {
      const params = new URLSearchParams();
      const normalized = searchTerm.trim();

      if (normalized) params.set("q", normalized);
      if (category) params.set("category", category);
      if (sort !== "newest") params.set("sort", sort);
      if (freeOnly) params.set("free", "true");

      saveSearch(normalized);
      setShowSuggestions(false);

      const queryString = params.toString();
      router.push(queryString ? `/search?${queryString}` : "/search");
    },
    [query, category, sort, freeOnly, router, saveSearch],
  );

  const clearFilters = () => {
    setCategory("");
    setSort("newest");
    setFreeOnly(false);
    setQuery("");
    router.push("/search");
  };

  const filteredSuggestions = POPULAR_SEARCHES.filter((item) =>
    item.toLowerCase().includes(query.trim().toLowerCase()),
  ).slice(0, 5);

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        className="relative"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder="Search resources, subjects, topics..."
              aria-label="Search educational resources"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                {query.trim() ? (
                  <>
                    <p className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Suggestions
                    </p>

                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setQuery(suggestion);
                            submitSearch(suggestion);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Search size={16} />
                          {suggestion}
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => submitSearch()}
                        className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Search for &quot;{query.trim()}&quot;
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {recentSearches.length > 0 && (
                      <>
                        <div className="flex items-center justify-between px-2 py-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Recent searches
                          </span>

                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              localStorage.removeItem(RECENT_SEARCHES_KEY);
                              setRecentSearches([]);
                            }}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            Clear
                          </button>
                        </div>

                        {recentSearches.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setQuery(item);
                              submitSearch(item);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Clock size={16} className="text-slate-400" />
                            {item}
                          </button>
                        ))}
                      </>
                    )}

                    <p className="flex items-center gap-2 px-2 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      <TrendingUp size={15} />
                      Popular searches
                    </p>

                    {POPULAR_SEARCHES.slice(0, 5).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery(item);
                          submitSearch(item);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Search size={16} />
                        {item}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            <Search size={18} />
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            aria-expanded={showFilters}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm font-bold transition ${
              showFilters
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-950">
              Refine your search
            </h3>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              <X size={15} />
              Clear all
            </button>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </span>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All categories</option>

                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Sort results
              </span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(event) => setFreeOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
              />

              <span className="text-sm font-semibold text-slate-700">
                Show free resources only
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => submitSearch()}
            className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-blue-800 sm:w-auto"
          >
            Apply filters
          </button>
        </div>
      )}
    </section>
  );
}