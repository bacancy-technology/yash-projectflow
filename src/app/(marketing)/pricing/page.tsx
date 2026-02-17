import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and small side projects.",
    features: [
      "Up to 3 projects",
      "5 team members",
      "100 issues per project",
      "5 labels per project",
      "7-day activity log",
      "Basic Kanban boards",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    description: "For growing teams that need more power.",
    features: [
      "Unlimited projects",
      "20 team members",
      "Unlimited issues",
      "Unlimited labels",
      "Custom workflows",
      "90-day activity log",
      "Priority labels & filters",
      "Advanced Kanban boards",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    description: "For large organizations with advanced needs.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Unlimited activity log",
      "Priority support",
      "Custom integrations",
      "SSO & SAML",
      "Audit logs",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as your team grows. No hidden fees, no
            surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg ring-1 ring-primary"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="mx-auto mt-20 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            All plans include SSL encryption, 99.9% uptime SLA, and community
            support.{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Contact us
            </Link>{" "}
            if you have questions.
          </p>
        </div>
      </div>
    </div>
  );
}
