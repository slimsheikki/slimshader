import { defaults } from './ascii/model';
import { renderAscii } from './ascii/render';
export const shaders = [{ id: 'ascii', name: 'ASCII', category: 'Character studies', description: 'Every pixel, a different character.', defaults, render: renderAscii }] as const;
