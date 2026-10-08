"use client";

import { useMemo, useState } from "react";

import FundCard from "./FundCard";
import SearchBox from "./SearchBox";

type Props = {
  funds: any[];
  nextCursor?: string;
};

export default function FundList({
  funds: initialFunds,
  nextCursor: initialCursor,
}: Props) {
  const [search, setSearch] =
    useState("");

  const [funds, setFunds] =
    useState(initialFunds);

  const [cursor, setCursor] =
    useState(initialCursor);

  const [loading, setLoading] =
    useState(false);

  const filteredFunds = useMemo(() => {
    const keyword =
      search.toLowerCase();

    return funds.filter(
      (fund) =>
        fund.proj_abbr_name
          ?.toLowerCase()
          .includes(keyword) ||
        fund.proj_name_th
          ?.toLowerCase()
          .includes(keyword) ||
        fund.comp_name_th
          ?.toLowerCase()
          .includes(keyword)
    );
  }, [search, funds]);

  async function loadMore() {
    if (!cursor) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/funds?cursor=${encodeURIComponent(
          cursor
        )}`
      );

      const data =
        await response.json();

      setFunds((prev) => [
        ...prev,
        ...data.items,
      ]);

      setCursor(
        data.next_cursor || ""
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SearchBox
        value={search}
        onChange={setSearch}
      />

      <p className="mb-4 text-sm text-gray-500">
        พบ {filteredFunds.length}
        กองทุน
      </p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFunds.map(
          (fund, index) => (
            <FundCard
              key={`${fund.proj_id}-${fund.fund_class_name ?? index}`}
              fund={fund}
            />
          )
        )}
      </div>

      {cursor && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="
              px-6
              py-3
              rounded-xl
              bg-blue-600
              text-white
              hover:bg-blue-700
              disabled:bg-gray-300
            "
          >
            {loading
              ? "กำลังโหลด..."
              : "โหลดกองทุนเพิ่มเติม"}
          </button>
        </div>
      )}
    </>
  );
}