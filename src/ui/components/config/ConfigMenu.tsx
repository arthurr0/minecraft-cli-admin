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
      label: `Instance Registry (${serverCount})`,
      value: 'servers',
      description: 'Create, edit, or remove Minecraft instances',
    },
    {
      label: `Profile Library (${typeCount})`,
      value: 'types',
      description: 'Manage runtime profiles: memory and JVM flags',
    },
  ];

  const handleSelect = (value: string) => {
    if (value === 'servers' || value === 'types') {
      onSelect(value);
    }
  };

  return (
    <Menu
      title="Studio Configuration"
      items={items}
      onSelect={handleSelect}
      onBack={onBack}
    />
  );
};
