import React from 'react';
import { Menu } from '../Menu.js';

export interface ConfigMenuProps {
  serverCount: number;
  typeCount: number;
  onSelect: (section: 'servers' | 'types') => void;
  onBack: () => void;
}

export const ConfigMenu: React.FC<ConfigMenuProps> = ({
  serverCount,
  typeCount,
  onSelect,
  onBack,
}) => {
  const items = [
    {
      label: `INSTANCE REGISTRY (${serverCount})`,
      value: 'servers',
      description: 'Create, edit, or remove server entries',
    },
    {
      label: `PROFILE LIBRARY (${typeCount})`,
      value: 'types',
      description: 'Tune memory presets and JVM flags',
    },
  ];

  const handleSelect = (value: string) => {
    if (value === 'servers' || value === 'types') {
      onSelect(value);
    }
  };

  return (
    <Menu
      title="CONFIG WORKSPACE"
      items={items}
      onSelect={handleSelect}
      onBack={onBack}
    />
  );
};
