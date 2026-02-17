'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PLAN_PRICES, type PlanType } from '@/lib/constants'
import { PlanBadge } from '@/components/billing/plan-badge'
import { Check } from 'lucide-react'

interface PricingCardsProps {
  currentPlan?: PlanType
  onSelectPlan?: (plan: PlanType) => void
  loading?: boolean
}

const plans: {
  plan: PlanType
  name: string
  description: string
  features: string[]
}[] = [
  {
    plan: 'free',
    name: 'Free',
    description: 'For individuals and small teams getting started.',
    features: [
      'Up to 3 projects',
      'Up to 5 members',
      '100 issues per project',
      '5 labels per project',
      'Time tracking',
      '7-day activity log',
    ],
  },
  {
    plan: 'pro',
    name: 'Pro',
    description: 'For growing teams that need more power.',
    features: [
      'Unlimited projects',
      'Up to 20 members',
      'Unlimited issues',
      'Unlimited labels',
      'Sprints & Backlog',
      'Roadmap / Timeline',
      'Custom workflows',
      'Time tracking',
      '90-day activity log',
    ],
  },
  {
    plan: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations that need full control.',
    features: [
      'Unlimited projects',
      'Unlimited members',
      'Unlimited issues',
      'Unlimited labels',
      'Sprints & Backlog',
      'Roadmap / Timeline',
      'Custom workflows',
      'Time tracking',
      'Unlimited activity log',
      'Priority support',
    ],
  },
]

export function PricingCards({
  currentPlan,
  onSelectPlan,
  loading,
}: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map(({ plan, name, description, features }) => {
        const isCurrent = currentPlan === plan
        const price = PLAN_PRICES[plan]

        return (
          <Card
            key={plan}
            className={cn(
              'relative flex flex-col',
              plan === 'pro' && 'border-blue-500 shadow-md',
              isCurrent && 'ring-2 ring-blue-500'
            )}
          >
            {plan === 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{name}</CardTitle>
                {isCurrent && <PlanBadge plan={plan} />}
              </div>
              <CardDescription>{description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${price}</span>
                {price > 0 && (
                  <span className="text-muted-foreground ml-1">
                    /member/month
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? 'outline' : plan === 'pro' ? 'default' : 'outline'}
                disabled={isCurrent || loading}
                onClick={() => onSelectPlan?.(plan)}
              >
                {isCurrent
                  ? 'Current Plan'
                  : currentPlan && plans.findIndex((p) => p.plan === currentPlan) >
                      plans.findIndex((p) => p.plan === plan)
                    ? 'Downgrade'
                    : 'Upgrade'}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
