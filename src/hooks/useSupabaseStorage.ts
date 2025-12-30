/**
 * Hook to manage storage driver switching
 */

import { useEffect, useState } from 'react';
import { storageService } from '@/services/storage/StorageService';
import { SupabaseDriver } from '@/services/storage/SupabaseDriver';
import { LocalStorageDriver } from '@/services/storage/LocalStorageDriver';
import { useAuth } from '@/contexts/AuthContext';

type DriverType = 'supabase' | 'local';

export function useSupabaseStorage() {
  const { user } = useAuth();
  const [driverType, setDriverType] = useState<DriverType>('local');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initStorage() {
      // Use Supabase driver when user is logged in, otherwise use local storage
      if (user) {
        const supabaseDriver = new SupabaseDriver();
        await supabaseDriver.initialize();
        storageService.setDriver(supabaseDriver);
        setDriverType('supabase');
      } else {
        const localDriver = new LocalStorageDriver();
        await localDriver.initialize();
        storageService.setDriver(localDriver);
        setDriverType('local');
      }
      
      await storageService.initialize();
      setInitialized(true);
    }

    initStorage();
  }, [user]);

  const switchDriver = async (type: DriverType) => {
    if (type === 'supabase') {
      const driver = new SupabaseDriver();
      await driver.initialize();
      storageService.setDriver(driver);
    } else {
      const driver = new LocalStorageDriver();
      await driver.initialize();
      storageService.setDriver(driver);
    }
    setDriverType(type);
  };

  return {
    driverType,
    initialized,
    switchDriver,
    storageService,
  };
}
