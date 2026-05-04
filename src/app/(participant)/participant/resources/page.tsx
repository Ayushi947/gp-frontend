'use client';

import {
  IconBook,
  IconPlayerPlay,
  IconFileText,
  IconFolder,
  IconCalculator,
  IconMail,
  IconDownload,
  IconArrowRight,
} from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';

interface ResourceCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

function ResourceCard({ icon, title, onClick }: ResourceCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          <IconArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentCardProps {
  icon: React.ReactNode;
  title: string;
  documentCount: number;
  onClick: () => void;
}

function DocumentCard({ icon, title, documentCount, onClick }: DocumentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {documentCount} {documentCount === 1 ? 'document' : 'documents'}
            </p>
          </div>
          <IconArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResourcesPage() {
  const handleResourceClick = (resourceName: string) => {
    toast.info(resourceName, 'Feature coming soon');
  };

  const helpResources = [
    {
      icon: <IconMail className="w-6 h-6" />,
      title: 'Help Center',
    },
    {
      icon: <IconPlayerPlay className="w-6 h-6" />,
      title: 'Video Library',
    },
    {
      icon: <IconCalculator className="w-6 h-6" />,
      title: 'Retirement Calculator',
    },
  ];

  const documents = [
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Account Documents',
      count: 12,
    },
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Plan Information',
      count: 8,
    },
    {
      icon: <IconFolder className="w-6 h-6" />,
      title: 'Statements & Confirmations',
      count: 15,
    },
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Tax Forms',
      count: 5,
    },
    {
      icon: <IconBook className="w-6 h-6" />,
      title: 'Investment Guides',
      count: 10,
    },
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Educational Materials',
      count: 18,
    },
  ];

  return (
    <DashboardContent>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <IconBook className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground mt-1">
              Access helpful tools, guides, and educational materials
            </p>
          </div>
        </div>
      </div>

      {/* Help Resources Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Help Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {helpResources.map((resource, index) => (
            <ResourceCard
              key={index}
              icon={resource.icon}
              title={resource.title}
              onClick={() => handleResourceClick(resource.title)}
            />
          ))}
        </div>
      </div>

      {/* Your Documents Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc, index) => (
            <DocumentCard
              key={index}
              icon={doc.icon}
              title={doc.title}
              documentCount={doc.count}
              onClick={() => handleResourceClick(doc.title)}
            />
          ))}
        </div>
      </div>

      {/* Educational Highlights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <IconBook className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">
                  Getting Started with Your 401(k)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Learn the basics of retirement planning and how to make the most of your 401(k) account.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResourceClick('Getting Started Guide')}
                >
                  Read Guide
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <IconCalculator className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">
                  Retirement Savings Calculator
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Estimate how much you'll need to save for a comfortable retirement and track your progress.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResourceClick('Retirement Calculator')}
                >
                  Launch Calculator
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 border-2 border-dashed rounded-lg bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Need to submit a document?</h3>
            <p className="text-sm text-muted-foreground">
              Securely upload required documents to your account
            </p>
          </div>
          <Button onClick={() => toast.info('Upload', 'Feature coming soon')}>
            <IconDownload className="mr-2 h-4 w-4 rotate-180" />
            Upload Document
          </Button>
        </div>
      </div>
    </DashboardContent>
  );
}
