"use client";

import { useActionState } from "react";

import { subscribeAction } from "@/app/(site)/alerts/actions";
import type { AlertFrequency } from "@/lib/domain/job-vocab";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  type JobAlertQuery,
  SALARY_BAND_IDS,
  SENIORITIES,
} from "@/lib/domain/job-vocab";

const SENIORITY_LABELS: Record<(typeof SENIORITIES)[number], string> = {
  c_level: "C level",
  director: "Director",
  entry: "Entry",
  intern: "Intern",
  lead: "Lead",
  mid: "Mid",
  principal: "Principal",
  senior: "Senior",
  vp: "VP",
};

export function AlertsForm({
  defaultFrequency,
  query,
}: {
  defaultFrequency: AlertFrequency;
  query: JobAlertQuery;
}) {
  const [state, formAction, pending] = useActionState(subscribeAction, null);

  return (
    <form
      action={formAction}
      className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10"
      data-testid="alerts-form"
    >
      <div>
        <h1 className="font-semibold text-2xl">Job alerts</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Get new jobs by email. Weekly is the default. Daily is available.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm" htmlFor="alerts-email">
        Email
        <input
          autoComplete="email"
          className="h-10 rounded-md border bg-background px-3"
          data-testid="alerts-email"
          id="alerts-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" htmlFor="alerts-frequency">
        Frequency
        <select
          className="h-10 rounded-md border bg-background px-3"
          data-testid="alerts-frequency"
          defaultValue={defaultFrequency}
          id="alerts-frequency"
          name="frequency"
        >
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium text-sm">Employment type</legend>
        {JOB_EMPLOYMENT_TYPES.map((type) => (
          <label className="flex items-center gap-2 text-sm" key={type}>
            <input
              data-testid={`alerts-type-${type}`}
              defaultChecked={query.types.includes(type)}
              name="types"
              type="checkbox"
              value={type}
            />
            {JOB_EMPLOYMENT_LABELS[type]}
          </label>
        ))}
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          data-testid="alerts-remote"
          defaultChecked={query.remote}
          name="remote"
          type="checkbox"
          value="true"
        />
        Remote
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          data-testid="alerts-visa"
          defaultChecked={query.visa}
          name="visa"
          type="checkbox"
          value="true"
        />
        Visa sponsorship
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium text-sm">Seniority</legend>
        {SENIORITIES.map((level) => (
          <label className="flex items-center gap-2 text-sm" key={level}>
            <input
              data-testid={`alerts-seniority-${level}`}
              defaultChecked={query.seniority.includes(level)}
              name="seniority"
              type="checkbox"
              value={level}
            />
            {SENIORITY_LABELS[level]}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium text-sm">Salary</legend>
        {SALARY_BAND_IDS.map((band, index) => (
          <label className="flex items-center gap-2 text-sm" key={band}>
            <input
              data-testid={`alerts-salary-${index}`}
              defaultChecked={query.salary.includes(band)}
              name="salary"
              type="checkbox"
              value={band}
            />
            {band}
          </label>
        ))}
      </fieldset>

      {query.languages.map((language) => (
        <input key={language} name="languages" type="hidden" value={language} />
      ))}

      <button
        className="h-10 rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-50"
        data-testid="alerts-submit"
        disabled={pending}
        type="submit"
      >
        Subscribe
      </button>
      <p data-testid="alerts-status" role="status">
        {state ? state.message : ""}
      </p>
    </form>
  );
}
