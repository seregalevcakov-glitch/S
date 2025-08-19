import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatusCardProps {
  status?: {
    systemStatus: Array<{
      component: string;
      status: string;
      lastCheck: string;
      message?: string;
    }>;
    stats: {
      totalMessages: number;
      successRate: number;
    };
  };
}

export function StatusCard({ status }: StatusCardProps) {
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "online":
        return "bg-emerald-400";
      case "error":
        return "bg-red-400";
      case "pending":
        return "bg-amber-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (statusValue: string) => {
    switch (statusValue) {
      case "online":
        return "Online";
      case "error":
        return "Error";
      case "pending":
        return "Pending";
      case "offline":
        return "Offline";
      default:
        return statusValue;
    }
  };

  const formatComponentName = (component: string) => {
    return component.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!status) {
    return (
      <Card className="bg-secondary border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status.systemStatus.map((item) => (
            <div key={item.component} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${getStatusColor(item.status)} rounded-full`}></div>
                <span className="text-gray-300">{formatComponentName(item.component)}</span>
              </div>
              <Badge
                variant={item.status === "online" ? "default" : "destructive"}
                className={
                  item.status === "online"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : item.status === "pending"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : ""
                }
                data-testid={`status-${item.component}`}
              >
                {getStatusText(item.status)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white" data-testid="stat-total-messages">
                {status.stats.totalMessages}
              </div>
              <div className="text-sm text-gray-400">Messages Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white" data-testid="stat-success-rate">
                {status.stats.successRate}%
              </div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
