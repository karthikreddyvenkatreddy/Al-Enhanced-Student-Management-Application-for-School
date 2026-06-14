import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Users, Calendar, FileText, TrendingUp,
  Brain, BarChart3, GraduationCap, School, Settings as SettingsIcon,
  Menu, X, Search, Bell, Moon, Sun, ChevronRight, LogOut,
  ClipboardList, Building2, ShieldCheck, BookOpen, ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../lib/toast";
import { cn } from "../../lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: ("admin" | "teacher")[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Academic",
    items: [
      { icon: Users, label: "Students", path: "/students" },
      { icon: Calendar, label: "Attendance", path: "/attendance" },
      { icon: FileText, label: "Marks", path: "/marks" },
      { icon: ClipboardList, label: "Assignments", path: "/assignments" },
      { icon: TrendingUp, label: "Performance", path: "/performance" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { icon: Brain, label: "AI Prediction", path: "/ai-prediction" },
      { icon: BarChart3, label: "AI Reports", path: "/ai-reports" },
    ],
  },
  {
    label: "Administration",
    items: [
      { icon: GraduationCap, label: "Teachers", path: "/teachers", roles: ["admin"] },
      { icon: School, label: "Classes", path: "/classes", roles: ["admin"] },
      { icon: Building2, label: "Departments", path: "/departments", roles: ["admin"] },
      { icon: ShieldCheck, label: "Users", path: "/users", roles: ["admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { icon: SettingsIcon, label: "Settings", path: "/settings" },
    ],
  },
];

function NavLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== "/" && location.pathname.startsWith(item.path));
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent text-foreground"
      )}
    >
      <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
      {!collapsed && <span className="font-medium">{item.label}</span>}
    </Link>
  );
}

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/auth/login", { replace: true });
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    if (paths.length === 0) return ["Dashboard"];
    return paths.map(path => path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "));
  };

  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true;
      return isAdmin();
    }),
  })).filter(group => group.items.length > 0);

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
      {visibleGroups.map(group => (
        <div key={group.label}>
          {!collapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
          )}
          {collapsed && group !== visibleGroups[0] && (
            <div className="border-t border-border mb-3 mt-1" />
          )}
          <div className="space-y-0.5">
            {group.items.map(item => (
              <NavLink
                key={item.path}
                item={item}
                collapsed={collapsed}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-base leading-tight block">EduERP</span>
                <span className="text-xs text-muted-foreground leading-tight">Institution Manager</span>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-accent rounded-lg transition-colors ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!sidebarOpen && (
          <div className="p-2 border-b border-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full p-1.5 hover:bg-accent rounded-lg transition-colors flex justify-center"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        )}

        <SidebarContent collapsed={!sidebarOpen} />

        {/* User info at bottom */}
        <div className={cn("p-3 border-t border-border flex-shrink-0", !sidebarOpen && "flex justify-center")}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0",
                isAdmin() ? "bg-red-500" : "bg-blue-500"
              )}>
                {user?.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{user?.name}</p>
                <p className={cn("text-xs", isAdmin() ? "text-red-500" : "text-blue-500")}>
                  {isAdmin() ? "Administrator" : "Teacher"}
                </p>
              </div>
            </div>
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
              isAdmin() ? "bg-red-500" : "bg-blue-500"
            )}>
              {user?.name?.charAt(0) || "?"}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-72 h-full bg-card border-r border-border flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-bold text-base block">EduERP</span>
                  <span className="text-xs text-muted-foreground">Institution Manager</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent collapsed={false} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
              {getBreadcrumbs().map((crumb, index, arr) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className={index === arr.length - 1 ? "text-foreground font-medium" : ""}>
                    {crumb}
                  </span>
                  {index < arr.length - 1 && <ChevronRight className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-accent px-3 py-2 rounded-lg w-52">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2 hover:bg-accent rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
                  isAdmin() ? "bg-red-500" : "bg-blue-500"
                )}>
                  {user?.name?.charAt(0) || "?"}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium leading-tight">{user?.name}</p>
                  <p className={cn("text-xs leading-tight", isAdmin() ? "text-red-500" : "text-blue-500")}>
                    {isAdmin() ? "Administrator" : "Teacher"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 hidden lg:block text-muted-foreground" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white",
                          isAdmin() ? "bg-red-500" : "bg-blue-500"
                        )}>
                          {user?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full font-medium",
                            isAdmin()
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {isAdmin() ? "Administrator" : "Teacher"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors text-sm"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
