'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IconBuildingBank,
  IconUser,
  IconCheck,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { useSponsorOnboarding } from '@/hooks';

type UserType = 'company' | 'participant';

interface OptionCard {
  id: UserType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  route: string;
}

const options: OptionCard[] = [
  {
    id: 'company',
    title: 'A 401(k) Plan for my Company',
    description: 'Set up and design a retirement plan for your employees',
    icon: <IconBuildingBank className="h-8 w-8" />,
    features: [
      'Customizable plan designs',
      'Employer matching options',
      'Compliance support included',
      'Easy payroll integration',
    ],
    route: ROUTES.GET_STARTED.EMAIL,
  },
  {
    id: 'participant',
    title: 'Accessing my 401(k) Plan',
    description: 'Already enrolled? Access your account to manage investments and contributions.',
    icon: <IconUser className="h-8 w-8" />,
    features: [
      'View your account balance',
      'Manage investments',
      'Change contribution rates',
      'Track retirement progress',
    ],
    route: ROUTES.PARTICIPANT_ENROLLMENT.EMAIL,
  },
];

export default function GetStartedPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<UserType | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(true);

  // Hook for sponsor onboarding progress
  const {
    canResume,
    resumeOnboarding,
    resetOnboarding,
    progressPercentage,
    currentStepInfo,
    isHydrated,
    completeStep,
  } = useSponsorOnboarding();

  // Auto-resume onboarding if user has progress
  useEffect(() => {
    if (isHydrated && canResume && showResumePrompt) {
      // Auto-redirect after 2 seconds to allow user to see the banner
      const timer = setTimeout(() => {
        resumeOnboarding();
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isHydrated, canResume, showResumePrompt, resumeOnboarding]);

  const handleOptionSelect = (option: OptionCard) => {
    setSelectedOption(option.id);
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    setIsNavigating(true);

    if (selectedOption === 'company') {
      // Mark root step as complete and navigate to email
      completeStep('root');
    } else {
      // Participant flow - just navigate
      sessionStorage.setItem('userType', selectedOption);
      router.push(ROUTES.PARTICIPANT_ENROLLMENT.EMAIL);
    }
  };

  const handleResume = () => {
    setIsNavigating(true);
    resumeOnboarding();
  };

  const handleStartFresh = () => {
    resetOnboarding();
    setShowResumePrompt(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image
              src="/assets/images/Final Logo.svg"
              alt="GlidingPath Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold">GlidingPath</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome to GlidingPath
          </h1>
          <p className="text-muted-foreground text-lg">
            Select your interest
          </p>
        </div>

        {/* Resume Progress Banner */}
        {isHydrated && canResume && showResumePrompt && (
          <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    Resume your 401(k) plan setup?
                  </span>
                  <span className="text-sm text-muted-foreground">
                    You left off at &quot;{currentStepInfo.label}&quot; - {progressPercentage}% complete
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={handleResume}
                  loading={isNavigating}
                  loadingText="Loading..."
                >
                  <IconRefresh className="h-4 w-4 mr-1" />
                  Resume
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleStartFresh}
                  className="text-muted-foreground"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md h-full flex flex-col',
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                )}
                onClick={() => handleOptionSelect(option)}
              >
                <CardHeader className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={cn(
                        'p-3 rounded-xl transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {option.icon}
                    </div>
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && (
                        <IconCheck className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription className="mt-2">{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {option.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <IconCheck className="h-4 w-4 text-success shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex flex-col items-center gap-6">
          <Button
            onClick={handleContinue}
            disabled={!selectedOption || isNavigating}
            size="lg"
            className="min-w-[240px] h-12 text-base"
            loading={isNavigating}
            loadingText="Loading..."
          >
            Continue
          </Button>

          {/* Footer */}
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a
              href={ROUTES.AUTH.LOGIN}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
