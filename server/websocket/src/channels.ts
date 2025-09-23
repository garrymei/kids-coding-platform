export const channels = {
  runResults: (sessionId: string) => `run-results/${sessionId}`,
  notifications: (userId: string) => `notifications/${userId}`,
} as const;

export type ChannelName = ReturnType<(typeof channels)[keyof typeof channels]>;
