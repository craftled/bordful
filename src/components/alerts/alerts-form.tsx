"use client";

import { useActionState } from "react";

import { subscribeAction } from "@/app/(site)/alerts/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const checkRowClass = "flex items-center gap-2 text-sm";

const checkboxClass =
  "size-4 accent-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

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
      className="mx-auto flex w-full max-w-xl flex-col gap-6 py-4"
      data-testid="alerts-form"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-3xl tracking-tight">Job Alerts</h1>
        <p className="text-muted-foreground">
          Get new jobs from this board by email. Weekly is the default, and
          daily is available.
        </p>
      </div>

      <Card className="gap-6 py-6">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="alerts-email">Email *</Label>
            <Input
              aria-describedby="alerts-privacy"
              autoComplete="email"
              data-testid="alerts-email"
              id="alerts-email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="alerts-frequency">Frequency</Label>
            <select
              className={selectClass}
              data-testid="alerts-frequency"
              defaultValue={defaultFrequency}
              id="alerts-frequency"
              name="frequency"
            >
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 font-medium text-sm leading-none">
              Employment type
            </legend>
            {JOB_EMPLOYMENT_TYPES.map((type) => (
              <label className={checkRowClass} key={type}>
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
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 font-medium text-sm leading-none">
              Work
            </legend>
            <label className={checkRowClass}>
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
            <label className={checkRowClass}>
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
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 font-medium text-sm leading-none">
              Seniority
            </legend>
            {SENIORITIES.map((level) => (
              <label className={checkRowClass} key={level}>
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
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 font-medium text-sm leading-none">
              Salary
            </legend>
            {SALARY_BAND_IDS.map((band, index) => (
              <label className={checkRowClass} key={band}>
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
          </fieldset>

          {query.languages.map((language) => (
            <input
              key={language}
              name="languages"
              type="hidden"
              value={language}
            />
          ))}

          <p className="text-muted-foreground text-xs" id="alerts-privacy">
            We keep only your email address to send alerts. Every email has a
            one-click unsubscribe link.
          </p>

          <Button data-testid="alerts-submit" disabled={pending} type="submit">
            Subscribe to job alerts
          </Button>
          <p className="text-sm" data-testid="alerts-status" role="status">
            {state ? state.message : ""}
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
