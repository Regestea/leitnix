import { z } from "zod";
import type { Box } from "../../shared/types/entities";

export const EMPTY_BOX: Box = {
  Id: "",
  Name: null,
  RepeatIntervalSeconds: null,
  NextBoxId: null,
  PreviousBoxId: null,
};

export interface RepeatPeriodOption {
  label: string;
  value: number;
}

export const REPEAT_PERIOD_OPTIONS: RepeatPeriodOption[] = [
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "1 day", value: 1440 },
  { label: "2 days", value: 2880 },
  { label: "3 days", value: 4320 },
  { label: "4 days", value: 5760 },
  { label: "5 days", value: 7200 },
  { label: "6 days", value: 8640 },
  { label: "7 days", value: 10080 },
  { label: "8 days", value: 11520 },
  { label: "9 days", value: 12960 },
  { label: "10 days", value: 14400 },
  { label: "11 days", value: 15840 },
  { label: "12 days", value: 17280 },
  { label: "13 days", value: 18720 },
  { label: "14 days", value: 20160 },
  { label: "15 days", value: 21600 },
  { label: "20 days", value: 28800 },
  { label: "25 days", value: 36000 },
  { label: "30 days", value: 43200 },
  { label: "35 days", value: 50400 },
  { label: "40 days", value: 57600 },
  { label: "45 days", value: 64800 },
  { label: "50 days", value: 72000 },
  { label: "55 days", value: 79200 },
  { label: "60 days", value: 86400 },
];

export function formatRepeatPeriod(minutes: number): string {
  if (minutes === 0) return "Finish";
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = hours / 24;
  if (Number.isInteger(days)) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  return `${days.toFixed(1)} days`;
}

export const boxFormSchema = z.object({
  Name: z.string().trim().min(1, "Name is required."),
  RepeatIntervalSeconds: z
    .number({ error: "Repeat period is required." })
    .int({ error: "Repeat period must be a whole number." })
    .min(1, { message: "Repeat period must be at least 6 hours." }),
});

export type BoxFormErrors = Partial<
  Record<keyof z.infer<typeof boxFormSchema>, string>
>;

export function validateFormBox(box: Box): {
  success: boolean;
  errors: BoxFormErrors;
} {
  const result = boxFormSchema.safeParse({
    Name: box.Name ?? "",
    RepeatIntervalSeconds: box.RepeatIntervalSeconds,
  });

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: BoxFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof BoxFormErrors;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
