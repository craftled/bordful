"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type ReactNode,
  useActionState,
  useCallback,
  useState,
} from "react";

import { subscribeAction } from "@/app/(site)/alerts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlertFrequency } from "@/lib/domain/job-vocab";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  type JobAlertQuery,
  SALARY_BAND_IDS,
  SENIORITIES,
} from "@/lib/domain/job-vocab";

const selectClass =
  "h-10 w-full appearance-none rounded-lg bg-card px-3 text-[14px] leading-[18px] text-foreground shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--ring)] focus-visible:ring-[3px] focus-visible:ring-ring/50";

// Paper chip: the native checkbox stays in the DOM, transparent over the
// whole chip, so names, values, clicks and keyboard behaviour are unchanged.
const chipClass =
  "relative flex h-[30px] cursor-pointer items-center rounded-full border border-line-strong bg-card px-3 text-[13px] leading-4 font-medium text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";

const checkboxClass =
  "absolute inset-0 m-0 cursor-pointer appearance-none rounded-full opacity-0";

const fieldLabelClass = "text-[13px] font-medium leading-4 text-foreground";
// A legend ignores the fieldset gap, so the 8px label-to-chips space lives here.
const legendClass = `${fieldLabelClass} mb-2 p-0`;

const STEPS = [
  "Pick what you want to see.",
  "Confirm your email once.",
  "New matches arrive when they are posted.",
];

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

const CADENCE: Record<AlertFrequency, string> = {
  daily: "One email a day.",
  weekly: "One email a week.",
};

export function AlertsForm({
  defaultFrequency,
  example,
  jobsHref,
  query,
}: {
  defaultFrequency: AlertFrequency;
  // The example digest card, rendered on the server from current jobs.
  example?: ReactNode;
  jobsHref: string;
  query: JobAlertQuery;
}) {
  const [state, formAction, pending] = useActionState(subscribeAction, null);
  const [frequency, setFrequency] = useState(defaultFrequency);
  const failed = state !== null && !state.ok;
  const onFrequencyChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setFrequency(event.target.value === "daily" ? "daily" : "weekly"),
    []
  );

  return (
    <div className="mx-auto -mt-8 -mb-1 flex w-full max-w-[1072px] flex-col gap-5 pt-2 pb-7 md:-mt-1 md:mb-0 md:gap-8 md:pt-0 md:pb-10">
      <nav aria-label="Breadcrumb" className="text-[13px] leading-4">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="text-subtle hover:text-foreground" href={jobsHref}>
              Jobs
            </Link>
          </li>
          <li aria-hidden="true" className="text-subtle">
            /
          </li>
          <li aria-current="page" className="text-foreground">
            Job alerts
          </li>
        </ol>
      </nav>

      <h1 className="flex flex-col text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
        <span className="text-foreground">Get new roles by email.</span>
        <span className="text-subtle md:hidden">Daily or weekly.</span>
        <span className="text-subtle hidden md:inline">
          Once a day or once a week.
        </span>
      </h1>

      <div className="flex flex-col items-start gap-5 md:flex-row md:gap-8">
        <form
          action={formAction}
          className="bg-card ring-line flex w-full flex-col gap-[18px] rounded-[14px] p-5 ring-1 md:w-[660px] md:shrink-0 md:gap-[22px] md:p-7"
          data-testid="alerts-form"
        >
          <div className="flex flex-col gap-[18px] md:flex-row md:gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <Label className={fieldLabelClass} htmlFor="alerts-email">
                Email
              </Label>
              <Input
                aria-describedby={
                  failed ? "alerts-privacy alerts-error" : "alerts-privacy"
                }
                aria-invalid={failed || undefined}
                autoComplete="email"
                className="h-10 px-3 text-[14px] leading-[18px]"
                data-testid="alerts-email"
                id="alerts-email"
                maxLength={254}
                name="email"
                placeholder="you@company.com"
                required
                type="email"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-[6px] md:w-[200px] md:shrink-0">
              <Label className={fieldLabelClass} htmlFor="alerts-frequency">
                Frequency
              </Label>
              <select
                className={selectClass}
                data-testid="alerts-frequency"
                id="alerts-frequency"
                name="frequency"
                onChange={onFrequencyChange}
                value={frequency}
              >
                <option value="weekly">Weekly digest</option>
                <option value="daily">Daily digest</option>
              </select>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className={legendClass}>Employment type</legend>
            <div className="flex flex-wrap gap-2">
              {JOB_EMPLOYMENT_TYPES.map((type) => (
                <label className={chipClass} key={type}>
                  <input
                    className={checkboxClass}
                    data-testid={`alerts-type-${type}`}
                    defaultChecked={query.types.includes(type)}
                    name="types"
                    type="checkbox"
                    value={type}
                  />
                  {JOB_EMPLOYMENT_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={legendClass}>Work</legend>
            <div className="flex flex-wrap gap-2">
              <label className={chipClass}>
                <input
                  className={checkboxClass}
                  data-testid="alerts-remote"
                  defaultChecked={query.remote}
                  name="remote"
                  type="checkbox"
                  value="true"
                />
                Remote
              </label>
              <label className={chipClass}>
                <input
                  className={checkboxClass}
                  data-testid="alerts-visa"
                  defaultChecked={query.visa}
                  name="visa"
                  type="checkbox"
                  value="true"
                />
                Visa sponsorship
              </label>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={legendClass}>Level</legend>
            <div className="flex flex-wrap gap-2">
              {SENIORITIES.map((level) => (
                <label className={chipClass} key={level}>
                  <input
                    className={checkboxClass}
                    data-testid={`alerts-seniority-${level}`}
                    defaultChecked={query.seniority.includes(level)}
                    name="seniority"
                    type="checkbox"
                    value={level}
                  />
                  {SENIORITY_LABELS[level]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={legendClass}>Salary</legend>
            <div className="flex flex-wrap gap-2">
              {SALARY_BAND_IDS.map((band, index) => (
                <label className={chipClass} key={band}>
                  <input
                    className={checkboxClass}
                    data-testid={`alerts-salary-${index}`}
                    defaultChecked={query.salary.includes(band)}
                    name="salary"
                    type="checkbox"
                    value={band}
                  />
                  {band}
                </label>
              ))}
            </div>
          </fieldset>

          {query.languages.map((language) => (
            <input
              key={language}
              name="languages"
              type="hidden"
              value={language}
            />
          ))}

          <p className="text-subtle text-[12px] leading-4" id="alerts-privacy">
            We keep your email address and alert preferences only to send these
            alerts. Every email has a one-click unsubscribe link.
          </p>

          <div className="flex flex-col gap-[18px] md:flex-row md:items-center md:gap-3">
            <Button
              className="h-11 w-full text-[15px] leading-[18px] md:h-9 md:w-fit md:text-[14px] md:leading-4"
              data-testid="alerts-submit"
              disabled={pending}
              type="submit"
            >
              Create alert
            </Button>
            <p className="text-subtle text-[12px] leading-4 md:text-[13px]">
              {CADENCE[frequency]} Unsubscribe in one click.
            </p>
          </div>
          {/* Both regions stay mounted so screen readers announce each change. */}
          <p
            className="text-foreground text-[13px] empty:sr-only"
            data-testid="alerts-status"
            id="alerts-status"
            role="status"
          >
            {state?.ok ? state.message : ""}
          </p>
          <p
            className="text-destructive text-[13px] empty:sr-only"
            id="alerts-error"
            role="alert"
          >
            {failed ? state.message : ""}
          </p>
        </form>

        <aside className="flex w-full flex-col gap-4 md:w-[380px] md:shrink-0">
          {example}
          {/* Paper's phone layout ends at the example email. */}
          <section className="bg-card ring-line hidden flex-col gap-[10px] rounded-[14px] p-5 ring-1 md:flex">
            <h2 className="text-foreground text-[15px] leading-[18px] font-medium">
              How it works
            </h2>
            <ol className="flex flex-col gap-[10px]">
              {STEPS.map((step, index) => (
                <li
                  className="text-muted-foreground flex gap-[10px] text-[13px] leading-4"
                  key={step}
                >
                  <span className="text-subtle font-medium">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
