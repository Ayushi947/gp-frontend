'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconAdjustments,
  IconSettings,
  IconChartBar,
  IconChevronRight,
} from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingLayout } from '@/components/onboarding';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

type InvestmentPath = 'personalize' | 'default' | 'custom';

interface InvestmentOption {
  id: InvestmentPath;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const investmentOptions: InvestmentOption[] = [
  {
    id: 'personalize',
    title: 'Personalize',
    description: 'Get a portfolio tailored to your goals and risk profile.',
    icon: <IconAdjustments className="h-7 w-7" />,
    route: ROUTES.PARTICIPANT_ENROLLMENT.RETIREMENT_PLANS,
  },
  {
    id: 'default',
    title: 'Default',
    description: "Stay on track with your plan's target date fund.",
    icon: <IconSettings className="h-7 w-7" />,
    route: ROUTES.PARTICIPANT_ENROLLMENT.DEFAULT_PORTFOLIO,
  },
  {
    id: 'custom',
    title: 'Custom',
    description: 'Choose your own investments and set allocations manually.',
    icon: <IconChartBar className="h-7 w-7" />,
    route: ROUTES.PARTICIPANT_ENROLLMENT.CUSTOM_PORTFOLIO,
  },
];

export default function ChooseInvestmentPathPage() {
  const router = useRouter();
  // Default to "Personalize" selected to match Figma
  const [selectedPath, setSelectedPath] = useState<InvestmentPath>('personalize');

  const handleSelectPath = (option: InvestmentOption) => {
    setSelectedPath(option.id);
    router.push(option.route);
  };

  return (
    <OnboardingLayout
      title="Choose Your Investment Path"
      description="Select your preferred type of investment portfolio"
      maxWidth="lg"
    >
      <div className="space-y-5 max-w-xl mx-auto w-full">
        {investmentOptions.map((option) => {
          const isSelected = selectedPath === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleSelectPath(option)}
              className={cn(
                'w-full text-left rounded-lg flex items-center p-5 transition-all border-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-transparent bg-muted hover:border-primary/40 hover:bg-muted/80'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center bg-primary text-primary-foreground mr-4">
                {option.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1">{option.title}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>

              {/* Chevron */}
              <IconChevronRight className="h-5 w-5 flex-shrink-0 ml-2 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
