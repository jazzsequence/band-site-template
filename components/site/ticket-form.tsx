"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "../../design-system/components/Button";
import { money, type Show } from "../../lib/site/tour";

const field = "w-full border border-line bg-surface px-4 py-3 text-text focus:border-cyan";

/** Ticket state lives only in the URL of the confirmation page. Nothing is sent or stored. */
export function TicketForm({ show }: { show: Show }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const order = `PRS-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 36 ** 3)
      .toString(36)
      .toUpperCase()
      .padStart(3, "0")}`;
    const q = new URLSearchParams({ show: show.id, name: name.trim(), qty: String(quantity), order });
    router.push(`/ticket?${q.toString()}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm uppercase tracking-widest text-muted">
          Name on ticket
        </label>
        <input id="name" required maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div className="space-y-2">
        <label htmlFor="qty" className="block text-sm uppercase tracking-widest text-muted">
          Tickets
        </label>
        <select id="qty" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={field}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <p className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-muted">Total</span>
        <span className="font-display text-2xl tabular-nums">{money(show.price * quantity)}</span>
      </p>
      <Button type="submit">Complete purchase</Button>
      <p className="text-xs text-dim">
        This is a demonstration checkout. No payment is taken and nothing you enter is stored or sent anywhere.
      </p>
    </form>
  );
}
