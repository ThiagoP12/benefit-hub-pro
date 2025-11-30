import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Benefícios', href: '/solicitacoes', icon: FileText },
  { name: 'Colaboradores', href: '/colaboradores', icon: Users, badge: 'Em Dev' },
  { name: 'Unidades', href: '/unidades', icon: Building2, badge: 'Em Dev' },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, badge: 'Em Dev' },
  { name: 'Configurações', href: '/configuracoes', icon: Settings, badge: 'Em Dev' },
];

export function Sidebar() {
  const location = useLocation();
  const { username, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    toast.success('Você saiu da sua conta');
  };

  const userInitials = username?.slice(0, 2).toUpperCase() || 'DP';
  const userName = username === 'dp' ? 'Depart. Pessoal' : username || 'Usuário';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <FileText className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Revalle</h1>
            <p className="text-xs text-sidebar-muted">Gestão de Benefícios</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-warning/20 text-warning border border-warning/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-muted truncate">Colaborador</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
