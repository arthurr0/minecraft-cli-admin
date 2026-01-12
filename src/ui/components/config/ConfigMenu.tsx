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
      label: `Servers (${serverCount})`,
      value: 'servers',
      description: 'Add, edit, or remove Minecraft servers',
    },
    {
      label: `Server Types (${typeCount})`,
      value: 'types',
      description: 'Configure server types (memory, JVM flags)',
    },
  ];

  const handleSelect = (value: string) => {
    if (value === 'servers' || value === 'types') {
      onSelect(value);
    }
  };

  return (
    <Menu
      title="Configuration Editor"
      items={items}
      onSelect={handleSelect}
      onBack={onBack}
    />
  );
};
