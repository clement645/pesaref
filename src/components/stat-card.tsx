import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
