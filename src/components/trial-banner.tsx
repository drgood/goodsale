'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function TrialBanner({ tenant }: { tenant: string }) {
  const { data: session } = useSession();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkTrial() {
      try {
        if (session?.user?.tenantId) {
          const response = await fetch('/api/subscription/status');
          if (response.ok) {
            const status = await response.json();
            setDaysRemaining(status.daysRemaining);
          }
        }
      } catch (error) {
        console.error('Error checking trial status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkTrial();
  }, [session?.user?.tenantId]);

  if (isLoading || isHidden || daysRemaining === null || daysRemaining > 30) {
    return null;
  }

  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent
    ? 'bg-red-50 dark:bg-red-950/30'
    : 'bg-blue-50 dark:bg-blue-950/30';
  const borderColor = isUrgent
    ? 'border-red-200 dark:border-red-800'
    : 'border-blue-200 dark:border-blue-800';
  const textColor = isUrgent
    ? 'text-red-900 dark:text-red-200'
    : 'text-blue-900 dark:text-blue-200';
  const iconColor = isUrgent
    ? 'text-red-600 dark:text-red-400'
    : 'text-blue-600 dark:text-blue-400';
  const buttonBg = isUrgent
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <div className={`${iconColor} flex-shrink-0 mt-0.5`}>
          {isUrgent ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={`font-semibold ${textColor}`}>
                {isUrgent ? '⚠️ URGENT:' : '✨'} Trial{' '}
                {daysRemaining === 0 ? 'expires today' : `ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}
              </p>
              <p className={`text-sm ${textColor} opacity-75 mt-1`}>
                {isUrgent
                  ? 'Upgrade now to continue using GoodSale'
                  : 'Upgrade to a paid plan to keep using all features'}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/${tenant}/billing`}>
                <button
                  className={`${buttonBg} text-white px-4 py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity`}
                >
                  Upgrade Now
                </button>
              </Link>
              <button
                onClick={() => setIsHidden(true)}
                className={`${textColor} hover:opacity-60 transition-opacity p-2`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
