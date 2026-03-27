export const BOARD_REALTIME_EVENT = "board:mutation";

export function getBoardRealtimeChannel(schema: string) {
  return `board-sync:${schema}`;
}
