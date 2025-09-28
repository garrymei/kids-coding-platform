import React, { Suspense, lazy } from 'react';
import { LoadingSpinner, CardSkeleton } from './LoadingStates';

// 懒加载图表组件
export const TrendChart = lazy(() => 
  import('./charts/TrendChart').catch(() => ({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        图表组件加载失败
      </div>
    )
  }))
);

// 懒加载MazeRunner组件
export const LazyMazeRunner = lazy(() => 
  import('../games/maze/MazeRunner').catch(() => ({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        游戏组件加载失败
      </div>
    )
  }))
);

// 懒加载LEDRunner组件
export const LazyLEDRunner = lazy(() => 
  import('../games/led/LEDRunner').catch(() => ({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        游戏组件加载失败
      </div>
    )
  }))
);

// 懒加载代码编辑器
export const LazyCodeEditor = lazy(() => 
  import('./CodeEditor').catch(() => ({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        代码编辑器加载失败
      </div>
    )
  }))
);

// 懒加载设置页面
export const LazySettingsPage = lazy(() => 
  import('../pages/SettingsPage').catch(() => ({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        设置页面加载失败
      </div>
    )
  }))
);

// 懒加载统计页面
export const LazyStatsPage = lazy(() => 
  import('../pages/StatsPage').catch(() => ({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        统计页面加载失败
      </div>
    )
  }))
);

// 高阶组件：为懒加载组件添加Suspense包装
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <CardSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// 预加载组件
export const preloadComponents = {
  // 预加载图表组件
  preloadTrendChart: () => {
    import('./charts/TrendChart');
  },
  
  // 预加载游戏组件
  preloadMazeRunner: () => {
    import('../games/maze/MazeRunner');
  },
  
  preloadLEDRunner: () => {
    import('../games/led/LEDRunner');
  },
  
  // 预加载编辑器
  preloadCodeEditor: () => {
    import('./CodeEditor');
  },
  
  // 预加载页面
  preloadSettingsPage: () => {
    import('../pages/SettingsPage');
  },
  
  preloadStatsPage: () => {
    import('../pages/StatsPage');
  },
};

// 智能预加载：在用户可能访问前预加载
export const smartPreload = {
  // 在首页加载完成后预加载常用组件
  onHomePageLoaded: () => {
    setTimeout(() => {
      preloadComponents.preloadTrendChart();
      preloadComponents.preloadCodeEditor();
    }, 2000);
  },
  
  // 在用户开始学习时预加载游戏组件
  onLearningStarted: () => {
    setTimeout(() => {
      preloadComponents.preloadMazeRunner();
      preloadComponents.preloadLEDRunner();
    }, 1000);
  },
  
  // 在用户空闲时预加载设置页面
  onUserIdle: () => {
    setTimeout(() => {
      preloadComponents.preloadSettingsPage();
      preloadComponents.preloadStatsPage();
    }, 5000);
  },
};

// 组件懒加载包装器
export function LazyComponentWrapper({ 
  children, 
  fallback,
  minHeight = '200px'
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div style={{ 
            minHeight, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <LoadingSpinner text="加载中..." />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}
