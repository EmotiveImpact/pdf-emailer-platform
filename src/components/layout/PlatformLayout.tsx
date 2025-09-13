import React from 'react';
import { Building2, FileText, Mail, Home, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PlatformLayoutProps {
  children: React.ReactNode;
}

const PlatformLayout: React.FC<PlatformLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: Home,
      description: 'Platform overview and quick access'
    },
    {
      path: '/tools/pdf-splitter',
      label: 'PDF Splitter',
      icon: FileText,
      description: 'Split multi-page PDFs by account'
    },
    {
      path: '/tools/email-distribution',
      label: 'Email Distribution',
      icon: Mail,
      description: 'Send personalized emails with attachments'
    }
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* New Water Systems Header */}
      <div className="bg-blue-600 text-white py-3 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Building2 className="h-6 w-6" />
            <div>
              <span className="text-lg font-semibold">NEW WATER SYSTEMS</span>
              <div className="text-xs opacity-80">Business Tools Platform</div>
            </div>
          </Link>
          <div className="text-sm">
            Hi Lisa! 👋
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1 py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.comingSoon ? '#' : item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                    ${item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                  onClick={(e) => item.comingSoon && e.preventDefault()}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.comingSoon && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* New Water Systems Footer */}
      <footer className="mt-12 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">
              © 2024 New Water Systems - Professional Business Tools Platform
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Streamlined tools for efficient business operations and customer management
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLayout;
