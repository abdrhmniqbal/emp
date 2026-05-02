/**
 * Purpose: Resolves notification response intents into indexer actions or app routes.
 * Caller: Notification runtime.
 * Dependencies: Expo notifications constants and indexer services.
 * Main Functions: handleNotificationAction(), getNotificationRoute()
 * Side Effects: May pause, resume, or cancel indexing.
 */

import * as Notifications from "expo-notifications"

import {
  INDEXER_NOTIFICATION_ACTION_CANCEL,
  INDEXER_NOTIFICATION_ACTION_PAUSE,
  INDEXER_NOTIFICATION_ACTION_RESUME,
} from "@/modules/indexer/indexer-notification.service"
import {
  cancelIndexing,
  pauseIndexing,
  resumeIndexing,
} from "@/modules/indexer/indexer.service"

export function handleNotificationAction(
  response: Notifications.NotificationResponse
) {
  const source = response.notification.request.content.data?.source
  if (
    source !== "indexer-progress" ||
    response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
  ) {
    return false
  }

  switch (response.actionIdentifier) {
    case INDEXER_NOTIFICATION_ACTION_PAUSE:
      pauseIndexing()
      return true
    case INDEXER_NOTIFICATION_ACTION_RESUME:
      resumeIndexing()
      return true
    case INDEXER_NOTIFICATION_ACTION_CANCEL:
      cancelIndexing()
      return true
    default:
      return true
  }
}

export function getNotificationRoute(
  response: Notifications.NotificationResponse
) {
  const route = response.notification.request.content.data?.route
  if (typeof route !== "string" || route.length === 0) {
    return null
  }

  return route
}
