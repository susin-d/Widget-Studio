import { useMemo } from "react";
import type { DesktopWidget } from "../../types/widget";
import { normalizeCustomWidgetData } from "../../types/customWidget";
import { useWidgetStore } from "../../store/widgetStore";
import { CustomWidgetRuntime } from "./CustomWidgetRuntime";
export function CustomWidget({ widget }: { widget: DesktopWidget }) { const updateWidget = useWidgetStore((state) => state.updateWidget); const data = useMemo(() => normalizeCustomWidgetData(widget.data), [widget.data]); return <CustomWidgetRuntime name={widget.name} source={data.source} permissions={data.permissions} onPermissionsChange={(permissions) => updateWidget(widget.id, { data: { ...widget.data, permissions } })} />; }
