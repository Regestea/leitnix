import { describe, it, expect, beforeEach, vi } from "vitest";

const {
  mockCheckPermissions,
  mockRequestPermissions,
  mockSchedule,
  mockGetPending,
  mockCancel,
} = vi.hoisted(() => ({
  mockCheckPermissions: vi.fn(),
  mockRequestPermissions: vi.fn(),
  mockSchedule: vi.fn(),
  mockGetPending: vi.fn(),
  mockCancel: vi.fn(),
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: mockCheckPermissions,
    requestPermissions: mockRequestPermissions,
    schedule: mockSchedule,
    getPending: mockGetPending,
    cancel: mockCancel,
  },
}));

const { mockOverallReviewToday, mockGetOrCreateDefaults } = vi.hoisted(() => ({
  mockOverallReviewToday: vi.fn(),
  mockGetOrCreateDefaults: vi.fn(),
}));

vi.mock("../../src/repositories/CardRepository", () => ({
  cardRepository: {
    overallReviewToday: mockOverallReviewToday,
  },
}));

vi.mock("../../src/repositories/SettingRepository", () => ({
  settingRepository: {
    getOrCreateDefaults: mockGetOrCreateDefaults,
  },
}));

import {
  requestNotificationPermission,
  rescheduleDailyNotification,
  cancelDailyNotification,
  scheduleNotification,
} from "../../src/services/notificationService";

describe("requestNotificationPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when already granted", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "granted" });

    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it("requests permission when not granted", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "granted" });

    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalledOnce();
  });

  it("returns false when permission denied", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "denied" });

    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

describe("rescheduleDailyNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPending.mockResolvedValue({ notifications: [] });
    mockGetOrCreateDefaults.mockResolvedValue({
      Notification: true,
      NotificationHour: 18,
      NotificationMinute: 30,
    });
    mockOverallReviewToday.mockResolvedValue(5);
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
  });

  it("schedules notification with settings hour/minute", async () => {
    await rescheduleDailyNotification();

    expect(mockSchedule).toHaveBeenCalledWith({
      notifications: [
        expect.objectContaining({
          title: "Leitnix — Review Time",
          body: "You have 5 cards to review today.",
          schedule: { on: { hour: 18, minute: 30 }, repeats: true },
        }),
      ],
    });
  });

  it("skips when Notification setting is false", async () => {
    mockGetOrCreateDefaults.mockResolvedValue({
      Notification: false,
      NotificationHour: 18,
      NotificationMinute: 30,
    });

    await rescheduleDailyNotification();

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("skips when no cards to review", async () => {
    mockOverallReviewToday.mockResolvedValue(0);

    await rescheduleDailyNotification();

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("uses default time when settings are null", async () => {
    mockGetOrCreateDefaults.mockResolvedValue({
      Notification: true,
      NotificationHour: null,
      NotificationMinute: null,
    });

    await rescheduleDailyNotification();

    expect(mockSchedule).toHaveBeenCalledWith({
      notifications: [
        expect.objectContaining({
          schedule: { on: { hour: 18, minute: 0 }, repeats: true },
        }),
      ],
    });
  });

  it("cancels existing notification before scheduling", async () => {
    mockGetPending.mockResolvedValue({
      notifications: [{ id: 1, title: "old" }],
    });

    await rescheduleDailyNotification();

    expect(mockCancel).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({ id: 1 })],
    });
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("does not cancel if no pending notification", async () => {
    mockGetPending.mockResolvedValue({ notifications: [] });

    await rescheduleDailyNotification();

    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("requests permission if not granted", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "granted" });

    await rescheduleDailyNotification();

    expect(mockRequestPermissions).toHaveBeenCalledOnce();
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("skips scheduling if permission denied", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "denied" });

    await rescheduleDailyNotification();

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});

describe("cancelDailyNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels pending notification when one exists", async () => {
    mockGetPending.mockResolvedValue({
      notifications: [{ id: 1, title: "test" }],
    });

    await cancelDailyNotification();

    expect(mockCancel).toHaveBeenCalledWith({
      notifications: [expect.objectContaining({ id: 1 })],
    });
  });

  it("does nothing when no pending notification", async () => {
    mockGetPending.mockResolvedValue({ notifications: [] });

    await cancelDailyNotification();

    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe("scheduleNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOverallReviewToday.mockResolvedValue(3);
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
  });

  it("schedules at given hour/minute", async () => {
    await scheduleNotification(9, 15);

    expect(mockSchedule).toHaveBeenCalledWith({
      notifications: [
        expect.objectContaining({
          body: "You have 3 cards to review today.",
          schedule: { on: { hour: 9, minute: 15 }, repeats: true },
        }),
      ],
    });
  });

  it("requests permission if needed", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "granted" });

    await scheduleNotification(10, 0);

    expect(mockRequestPermissions).toHaveBeenCalledOnce();
    expect(mockSchedule).toHaveBeenCalled();
  });

  it("skips when permission denied", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "denied" });

    await scheduleNotification(10, 0);

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("skips when no cards to review", async () => {
    mockOverallReviewToday.mockResolvedValue(0);

    await scheduleNotification(10, 0);

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
