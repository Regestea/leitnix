import { z } from "zod";
import type { Box } from "../../db/entities";

export const EMPTY_BOX: Box = {
  Id: "",
  Name: "",
  RepeatIntervalSeconds: 0,
  NextBoxId: null,
  PreviousBoxId: null,
};

export interface RepeatPeriodOption {
  label: string;
  value: number;
}

export const REPEAT_PERIOD_OPTIONS: RepeatPeriodOption[] = [
  { label: "1 minute", value: 60 },
  { label: "6 hours", value: 21600 },
  { label: "12 hours", value: 43200 },
  { label: "1 day", value: 86400 },
  { label: "2 days", value: 172800 },
  { label: "3 days", value: 259200 },
  { label: "4 days", value: 345600 },
  { label: "5 days", value: 432000 },
  { label: "6 days", value: 518400 },
  { label: "7 days", value: 604800 },
  { label: "8 days", value: 691200 },
  { label: "9 days", value: 777600 },
  { label: "10 days", value: 864000 },
  { label: "11 days", value: 950400 },
  { label: "12 days", value: 1036800 },
  { label: "13 days", value: 1123200 },
  { label: "14 days", value: 1209600 },
  { label: "15 days", value: 1296000 },
  { label: "20 days", value: 1728000 },
  { label: "25 days", value: 2160000 },
  { label: "30 days", value: 2592000 },
  { label: "35 days", value: 3024000 },
  { label: "40 days", value: 3456000 },
  { label: "45 days", value: 3888000 },
  { label: "50 days", value: 4320000 },
  { label: "55 days", value: 4752000 },
  { label: "60 days", value: 5184000 },
];

export function formatRepeatPeriod(seconds: number): string {
  if (seconds === 0) return "Finish";
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = seconds / 60;
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
