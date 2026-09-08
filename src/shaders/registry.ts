import { defaults as toonDefaults } from './toon/model';
import { renderToon } from './toon/render';
import { defaults } from './ascii/model';
import { renderAscii } from './ascii/render';
export const shaders = [{ id: 'ascii', name: 'ASCII', category: 'Character studies', description: 'Every pixel, a different character.', defaults, render: renderAscii }, { id: 'toon', name: 'Painterly Toon', category: 'Paint & ink', description: 'Brushwork meets bold outlines.', defaults: toonDefaults, render: renderToon }] as const;
