import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { managementHandlers } from './management';
import { attendanceHandlers } from './attendance';
import { feeHandlers } from './fees';
import { academicsHandlers } from './academics';
import { leaveHandlers } from './leaves';
import { notificationHandlers } from './notifications';
import { dashboardHandlers } from './dashboard';

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...managementHandlers,
  ...attendanceHandlers,
  ...feeHandlers,
  ...academicsHandlers,
  ...leaveHandlers,
  ...notificationHandlers,
  ...dashboardHandlers,
];
