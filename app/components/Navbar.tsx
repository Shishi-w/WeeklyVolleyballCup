'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    const supabase = createClient();
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push('/');
    router.refresh();
  };

  // 在认证页面隐藏导航栏
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
      <nav className="bg-white shadow-md sticky top-0 z-50" suppressHydrationWarning>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link
                href="/"
                className="text-lg sm:text-2xl font-bold text-blue-900 hover:text-blue-700 transition-colors truncate"
            >
              🏐 Volleyball Cup
            </Link>

            <div className="flex items-center gap-3 sm:gap-6">
              {loading ? (
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                  <>
                    {isLoggedIn ? (
                        <>
                          <button
                              onClick={handleLogout}
                              className="bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                          >
                            退出
                          </button>
                        </>
                    ) : (
                        <>
                          <Link
                              href="/auth/login"
                              className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                          >
                            登录
                          </Link>
                          <Link
                              href="/auth/register"
                              className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                          >
                            注册
                          </Link>
                        </>
                    )}
                  </>
              )}
            </div>
          </div>
        </div>
      </nav>
  );

}
