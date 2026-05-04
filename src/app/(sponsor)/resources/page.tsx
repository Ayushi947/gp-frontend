'use client';

import {
  IconBook,
  IconPlayerPlay,
  IconFileText,
  IconFolder,
  IconShare,
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
  ];

  const documents = [
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Your Plan Information',
      count: 26,
    },
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Account Documents',
      count: 26,
    },
    {
      icon: <IconFolder className="w-6 h-6" />,
      title: 'Notices & Disclosures',
      count: 26,
    },
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'Forms & Templates',
      count: 26,
    },
    {
      icon: <IconShare className="w-6 h-6" />,
      title: 'Shared Files',
      count: 26,
    },
    {
      icon: <IconFileText className="w-6 h-6" />,
      title: 'IRS Documents',
      count: 26,
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
              Access helpful documents, guides, and videos
            </p>
          </div>
        </div>
      </div>

      {/* Help Resources Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Help Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Quick Actions */}
      <div className="mt-8 p-6 border-2 border-dashed rounded-lg bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Need to upload a document?</h3>
            <p className="text-sm text-muted-foreground">
              Securely share files with your plan administrator
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
