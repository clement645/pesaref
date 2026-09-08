import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const alertVariants = cva('relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4', {
  variants: {
    variant: {
      default: 'border-border bg-background text-foreground',
      destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
      success: 'border-success/40 bg-success/10 text-success',
      warning: 'border-warning/40 bg-warning/10 text-warning',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Alert({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('mb-1 font-semibold leading-none', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}
