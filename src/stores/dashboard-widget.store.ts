import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoleCode } from '@/constant/role';

export type WidgetId =
  | 'stat-main'
  | 'stat-loans'
  | 'stat-secondary'
  | 'revenue-chart'
  | 'inventory-chart'
  | 'top-customers'
  | 'receivables-aging'
  | 'disease-warnings';

export interface DashboardWidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
  priority: 'high' | 'medium' | 'low';
  requiredRole: 'admin' | 'staff' | 'customer';
}

const ALL_WIDGETS: Record<WidgetId, Omit<DashboardWidgetConfig, 'visible'>> = {
  'stat-main': { id: 'stat-main', label: 'Thẻ thống kê chính', priority: 'high', requiredRole: 'customer' },
  'stat-loans': { id: 'stat-loans', label: 'Thống kê khoản vay', priority: 'high', requiredRole: 'staff' },
  'stat-secondary': { id: 'stat-secondary', label: 'Thẻ thống kê phụ', priority: 'medium', requiredRole: 'staff' },
  'revenue-chart': { id: 'revenue-chart', label: 'Biểu đồ doanh thu', priority: 'high', requiredRole: 'customer' },
  'inventory-chart': { id: 'inventory-chart', label: 'Biểu đồ tồn kho', priority: 'medium', requiredRole: 'admin' },
  'top-customers': { id: 'top-customers', label: 'Top khách hàng', priority: 'medium', requiredRole: 'staff' },
  'receivables-aging': { id: 'receivables-aging', label: 'Công nợ theo thời gian', priority: 'medium', requiredRole: 'admin' },
  'disease-warnings': { id: 'disease-warnings', label: 'Cảnh báo bệnh hại', priority: 'low', requiredRole: 'customer' },
};

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN, RoleCode.MANAGER];
const STAFF_ROLES = [...ADMIN_ROLES, RoleCode.STAFF];
const CUSTOMER_ROLES = [...STAFF_ROLES, RoleCode.FARMER, RoleCode.USER];

const getRoleLevel = (roleCode?: string): 'admin' | 'staff' | 'customer' => {
  if (!roleCode) return 'customer';
  if (ADMIN_ROLES.includes(roleCode as RoleCode)) return 'admin';
  if (STAFF_ROLES.includes(roleCode as RoleCode)) return 'staff';
  return 'customer';
};

export const roleCanView = (requiredRole: 'admin' | 'staff' | 'customer', userRole: 'admin' | 'staff' | 'customer'): boolean => {
  const levels = { admin: 0, staff: 1, customer: 2 };
  return levels[userRole] <= levels[requiredRole];
};

const createDefaultWidgets = (userRole: 'admin' | 'staff' | 'customer'): Record<WidgetId, DashboardWidgetConfig> => {
  const result: Record<WidgetId, DashboardWidgetConfig> = {} as Record<WidgetId, DashboardWidgetConfig>;
  (Object.keys(ALL_WIDGETS) as WidgetId[]).forEach((id) => {
    const config = ALL_WIDGETS[id];
    result[id] = {
      id,
      label: config.label,
      priority: config.priority,
      requiredRole: config.requiredRole,
      visible: roleCanView(config.requiredRole, userRole),
    };
  });
  return result;
};

const DEFAULT_ADMIN_WIDGETS = createDefaultWidgets('admin');
const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'stat-main',
  'stat-secondary',
  'stat-loans',
  'revenue-chart',
  'inventory-chart',
  'top-customers',
  'receivables-aging',
  'disease-warnings',
];

const normalizeWidgetOrder = (widgetOrder?: WidgetId[]): WidgetId[] => {
  const existingOrder = widgetOrder?.filter((id): id is WidgetId => id in ALL_WIDGETS) || [];
  const missingWidgets = DEFAULT_WIDGET_ORDER.filter((id) => !existingOrder.includes(id));
  return [...existingOrder, ...missingWidgets];
};

interface DashboardWidgetStore {
  widgets: Record<WidgetId, DashboardWidgetConfig>;
  widgetOrder: WidgetId[];
  userRole: 'admin' | 'staff' | 'customer';
  toggleWidget: (id: WidgetId) => void;
  setWidgetVisibility: (id: WidgetId, visible: boolean) => void;
  setUserRole: (roleCode?: string) => void;
  reorderWidgets: (fromId: WidgetId, toId: WidgetId) => void;
  resetWidgets: () => void;
  getVisibleWidgets: () => WidgetId[];
}

export const useDashboardWidgetStore = create<DashboardWidgetStore>()(
  persist(
    (set, get) => ({
      widgets: DEFAULT_ADMIN_WIDGETS,
      widgetOrder: DEFAULT_WIDGET_ORDER,
      userRole: 'admin',
      toggleWidget: (id: WidgetId) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: { ...state.widgets[id], visible: !state.widgets[id].visible },
          },
        })),
      setWidgetVisibility: (id: WidgetId, visible: boolean) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: { ...state.widgets[id], visible },
          },
        })),
      setUserRole: (roleCode?: string) => {
        const role = getRoleLevel(roleCode);
        set((state) => {
          const roleDefaults = createDefaultWidgets(role);
          const widgets = {} as Record<WidgetId, DashboardWidgetConfig>;

          (Object.keys(roleDefaults) as WidgetId[]).forEach((id) => {
            const canView = roleCanView(roleDefaults[id].requiredRole, role);
            widgets[id] = {
              ...roleDefaults[id],
              visible: canView && (state.widgets[id]?.visible ?? roleDefaults[id].visible),
            };
          });

          return { userRole: role, widgets, widgetOrder: normalizeWidgetOrder(state.widgetOrder) };
        });
      },
      resetWidgets: () => {
        const role = get().userRole;
        set({ widgets: createDefaultWidgets(role), widgetOrder: DEFAULT_WIDGET_ORDER });
      },
      reorderWidgets: (fromId: WidgetId, toId: WidgetId) => {
        set((state) => {
          const order = [...state.widgetOrder];
          const fromIdx = order.indexOf(fromId);
          const toIdx = order.indexOf(toId);
          if (fromIdx === -1 || toIdx === -1) return state;
          const [removed] = order.splice(fromIdx, 1);
          order.splice(toIdx, 0, removed);
          return { widgetOrder: order };
        });
      },
      getVisibleWidgets: () => {
        return Object.values(get().widgets)
          .filter((w) => w.visible)
          .map((w) => w.id);
      },
    }),
    { name: 'dashboard-widgets', version: 1 },
  ),
);

export const WIDGET_LABELS: Record<WidgetId, string> = Object.fromEntries(
  (Object.keys(ALL_WIDGETS) as WidgetId[]).map((id) => [id, ALL_WIDGETS[id].label]),
) as Record<WidgetId, string>;
