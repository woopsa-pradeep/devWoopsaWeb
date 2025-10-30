import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../component/atoms/loader/LoadingSpinner';

/**
 * Advanced lazy loading utility with preloading capabilities
 */
export class LazyComponentLoader {
  private static preloadedComponents: Record<string, Promise<any>> = {};

  /**
   * Creates a lazy-loaded component with a consistent loading UI
   * 
   * @param importFn The import function for the component
   * @param componentName Unique name for the component (used for preloading)
   * @param loadingMessage The message to display while loading
   * @param fullScreen Whether to display the loading spinner full screen
   * @returns A component that lazy loads the specified component
   */
  static create(
    importFn: () => Promise<{ default: React.ComponentType<any> }>,
    componentName: string,
    loadingMessage = 'Loading...',
    fullScreen = true
  ) {
    // Store the import promise for preloading
    this.preloadedComponents[componentName] = importFn();
    
    const LazyComponent = lazy(importFn);
    
    return (props: any) => (
      <Suspense fallback={<LoadingSpinner fullScreen={fullScreen} message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  /**
   * Preloads a component by its name
   * 
   * @param componentName The name of the component to preload
   * @returns A promise that resolves when the component is loaded
   */
  static preload(componentName: string): Promise<any> {
    if (componentName in this.preloadedComponents) {
      return this.preloadedComponents[componentName];
    }
    
    console.warn(`Component ${componentName} not found for preloading`);
    return Promise.resolve();
  }

  /**
   * Preloads multiple components by their names
   * 
   * @param componentNames Array of component names to preload
   * @returns A promise that resolves when all components are loaded
   */
  static preloadMultiple(componentNames: string[]): Promise<any[]> {
    return Promise.all(
      componentNames.map(name => this.preload(name))
    );
  }
} 