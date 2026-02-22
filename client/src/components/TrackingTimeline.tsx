import { Check, Circle, AlertCircle } from 'lucide-react';
import { TrackingEvent } from '@/lib/mockData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: string;
}

export function TrackingTimeline({ events, currentStatus }: TrackingTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const isException = currentStatus === 'Exception' || currentStatus === 'Customs Hold';

  return (
    <div className="relative">
      {sortedEvents.map((event, index) => {
        const isFirst = index === 0;
        const isLast = index === sortedEvents.length - 1;
        const isCurrentException = isFirst && isException;

        return (
          <div
            key={event.id}
            className="relative flex gap-4 pb-6 last:pb-0"
            data-testid={`timeline-event-${event.id}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  isFirst && !isCurrentException && 'bg-primary text-primary-foreground',
                  isFirst && isCurrentException && 'bg-red-500 text-white',
                  !isFirst && 'bg-muted text-muted-foreground'
                )}
              >
                {isCurrentException ? (
                  <AlertCircle className="w-4 h-4" />
                ) : isFirst ? (
                  <Circle className="w-4 h-4 fill-current" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border mt-2" />
              )}
            </div>

            <div className="flex-1 pt-1">
              <p className={cn(
                'font-semibold text-sm',
                isFirst && !isCurrentException && 'text-primary',
                isFirst && isCurrentException && 'text-red-600'
              )}>
                {event.status}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {event.note}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{event.location}</span>
                <span>•</span>
                <span>{format(new Date(event.timestamp), 'MMM d, h:mm a')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}